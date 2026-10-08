import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { scrapeAndCacheCnrs } from "@/scripts/cache-cnrs";
import { scrapeAndCacheRadioEpisodes } from "@/scripts/cache-radio-france";
import {
  scrapeAndCacheWikipediaImages,
  scrapeAndCacheWikipediaImagesEN,
} from "@/scripts/cache-wikipedia-image";
import { scrapeAndCacheNews } from "@/scripts/cache-news";
import { scrapeAndCacheSaviezVousImages } from "@/scripts/cache-saviez-vous-images";
import { scrapeAndCacheF1 } from "@/scripts/cache-f1";
import { scrapeAndCachePortailWikipedia } from "@/scripts/cache-portail-wikipedia";
import { scrapeAndCacheCitation } from "@/scripts/cache-citation";
import { scrapeAndCacheWikiLoves } from "@/scripts/scrape-wikiloves";
import { scrapeAndCachePortailLexicalWotd } from "@/scripts/cache-portail-lexical";
import { scrapeAndCacheInsolite } from "@/scripts/cache-insolite";
import { scrapeAndCacheApod } from "@/scripts/cache-apod";
import { sendCronErrorEmail } from "@/lib/email";
import { cleanupExpired, cleanupNewsByMaxAge } from "@/lib/cache-helpers";
import { cleanupOldInsoliteConfigs } from "@/lib/insolite";
import { isAllowedIp, getClientIp } from "@/lib/ip";

const CRON_SECRET = process.env.CRON_SECRET || "";

function ipInPrivateRange(ip: string): boolean {
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("100.64.") || ip.startsWith("100.127.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("172.16.") || ip.startsWith("172.31.")) return true;
  if (ip === "::1" || ip.startsWith("fe80:")) return true;
  return false;
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function isAuthorized(request: NextRequest): {
  authorized: boolean;
  ip: string;
  reason: string;
} {
  const token = request.nextUrl.searchParams.get("token");
  const headerToken = request.headers.get("x-cron-token");
  const providedToken = token || headerToken;

  // Trusted IP resolution (platform IP / cf-connecting-ip first; x-forwarded-for
  // only honored when TRUST_PROXY=true). Never read x-forwarded-for blindly.
  const ip = getClientIp(request);

  // Token auth (constant-time compare). When a secret is configured it is REQUIRED —
  // no IP fallback, so header spoofing cannot bypass auth in production.
  if (CRON_SECRET) {
    if (providedToken && safeEqual(providedToken, CRON_SECRET)) {
      return { authorized: true, ip, reason: "token" };
    }
    return { authorized: false, ip, reason: "token-required" };
  }

  // No secret configured (dev / local cron): fall back to trusted IP resolution.
  if (isAllowedIp(ip)) {
    return { authorized: true, ip, reason: "ip-whitelist" };
  }

  if (ipInPrivateRange(ip)) {
    return { authorized: true, ip, reason: "private-range" };
  }

  return { authorized: false, ip, reason: "unauthorized" };
}

export async function GET(request: NextRequest) {
  const auth = isAuthorized(request);

  if (!auth.authorized) {
    return NextResponse.json(
      { error: "unauthorized", ip: auth.ip },
      { status: 401 },
    );
  }

  const ip = auth.ip;

  const startTime = Date.now();
  console.log(
    `[cron] Starting cache update from IP: ${ip} (auth: ${auth.reason})`,
  );

  const results: Record<string, string> = {};
  let hasErrors = false;

  async function runStep(step: string, fn: () => Promise<unknown>) {
    try {
      await fn();
      results[step] = "ok";
    } catch (error) {
      hasErrors = true;
      console.error(`[cron] Step ${step} failed:`, error);
      results[step] = "error";
      await sendCronErrorEmail(step, error);
    }
  }

  try {
    console.log("[cron] Step 1/14: Scraping CNRS...");
    await runStep("cnrs", scrapeAndCacheCnrs);

    console.log("[cron] Step 2/14: Scraping Radio France...");
    await runStep("radio", scrapeAndCacheRadioEpisodes);

    console.log("[cron] Step 3/14: Scraping News...");
    await runStep("news", scrapeAndCacheNews);

    console.log("[cron] Step 4/14: Scraping Wikipedia Image (FR)...");
    await runStep("wiki", scrapeAndCacheWikipediaImages);

    console.log("[cron] Step 5/14: Scraping Wikipedia Image (EN)...");
    await runStep("wikiEn", scrapeAndCacheWikipediaImagesEN);

    console.log("[cron] Step 6/14: Scraping F1 portal...");
    await runStep("f1", scrapeAndCacheF1);

    console.log("[cron] Step 7/14: Scraping Portail Wikipédia...");
    await runStep("portailWiki", scrapeAndCachePortailWikipedia);

    console.log("[cron] Step 8/14: Scraping Wikiquote...");
    await runStep("citation", scrapeAndCacheCitation);

    console.log("[cron] Step 9/14: Scraping Wiki Loves...");
    await runStep("wikiLoves", scrapeAndCacheWikiLoves);

    console.log("[cron] Step 10/14: Scraping Articles insolites...");
    await runStep("insolite", scrapeAndCacheInsolite);

    console.log("[cron] Step 11/14: Cleanup...");
    try {
      const counts = await cleanupExpired();
      const citationSkipped = counts.citation === 0;
      const insoliteSkipped = counts.insolite === 0;
      const apodSkipped = counts.apod === 0;
      const airCrashSkipped = counts.airCrash === 0;
      const cleanupParts = [
        `cnrs:${counts.cnrs}`,
        `radio:${counts.radio}`,
        `wiki:${counts.wiki}`,
        `wikiLoves:${counts.wikiLoves}`,
        `news:${counts.news}`,
        `f1:${counts.f1}`,
        `portailWiki:${counts.portailWikipedia}`,
      ];
      if (!citationSkipped) {
        cleanupParts.push(`citation:${counts.citation}`);
      }
      if (!insoliteSkipped) {
        cleanupParts.push(`insolite:${counts.insolite}`);
      }
      if (!apodSkipped) {
        cleanupParts.push(`apod:${counts.apod}`);
      }
      if (!airCrashSkipped) {
        cleanupParts.push(`airCrash:${counts.airCrash}`);
      }
      results.cleanup = cleanupParts.join(",");
      const newsMaxAge = await cleanupNewsByMaxAge(5);
      results.newsMaxAge = newsMaxAge > 0 ? `maxage:${newsMaxAge}` : "";
      const oldConfigCleaned = await cleanupOldInsoliteConfigs(30);
      if (oldConfigCleaned > 0) {
        results.insoliteConfigCleanup = `configs:${oldConfigCleaned}`;
      }
    } catch (error) {
      hasErrors = true;
      console.error("[cron] Cleanup failed:", error);
      results.cleanup = "error";
      await sendCronErrorEmail("cleanup", error);
    }

    console.log("[cron] Step 12/14: Resolving Saviez-vous images...");
    await runStep("saviezvous", scrapeAndCacheSaviezVousImages);

    console.log(
      "[cron] Step 13/14: Scraping Portail Lexical Word of the Day...",
    );
    await runStep("portailLexical", scrapeAndCachePortailLexicalWotd);

    console.log("[cron] Step 14/14: Scraping APOD (NASA)...");
    await runStep("apod", scrapeAndCacheApod);

    const duration = ((Date.now() - startTime) / 1000).toFixed(0);
    console.log(
      `[cron] Cache update completed in ${duration}s${hasErrors ? " (with errors)" : ""}`,
    );

    return NextResponse.json(
      {
        ok: !hasErrors,
        results,
        duration: `${duration}s`,
        ip,
      },
      hasErrors ? { status: 207 } : {},
    ); // 207 Multi-Status for partial success
  } catch (error) {
    console.error("[cron] Cache update error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: String(error),
        results,
        duration: `${((Date.now() - startTime) / 1000).toFixed(0)}s`,
      },
      { status: 500 },
    );
  }
}
