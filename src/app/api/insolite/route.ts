import { NextRequest, NextResponse } from 'next/server'
import { pickAndSaveTodayInsoliteArticle, getRandomInsoliteArticles, getValidInsoliteArticleCount } from '@/lib/insolite'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const count = Math.min(parseInt(searchParams.get('count') || '1'), 20)
    const useDaily = searchParams.get('daily') !== 'false'

    const clientId = getClientIp(request)
    if (!(await checkRateLimit(`insolite:${clientId}`, 30, 60_000))) {
      return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
    }

    let article: Awaited<ReturnType<typeof pickAndSaveTodayInsoliteArticle>> | null = null
    let allSeen = false

    if (useDaily) {
      const today = new Date().toISOString().split('T')[0]
      article = await pickAndSaveTodayInsoliteArticle(today)

      if (article) {
        const totalValid = await getValidInsoliteArticleCount()
        const config = await prisma.cachedConfig.findUnique({
          where: { key: `insolite_${today}` },
        })
        if (config?.value) {
          try {
            const parsed = JSON.parse(config.value)
            allSeen = (parsed.shownCount || 0) >= totalValid
          } catch {
            // ignore
          }
        }
      }
    }

    if (!article) {
      const articles = await getRandomInsoliteArticles(count)
      return NextResponse.json({ articles: articles.slice(0, count), allSeen: false })
    }

    return NextResponse.json({ articles: [article], allSeen })
  } catch (error) {
    console.error('Insolite API error:', error)
    return NextResponse.json({ articles: [], allSeen: false })
  }
}
