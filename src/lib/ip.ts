/**
 * Resolves the client's IP address securely.
 * Prioritizes native platform-provided client IPs and trusted CDN headers (e.g. Cloudflare)
 * to mitigate header spoofing risks in production systems.
 */
export function getClientIp(request: any): string {
  // 1. Prioritize Next.js's built-in request.ip, set securely by the hosting platform (Vercel/Netlify/etc.)
  if (request && typeof request.ip === 'string' && request.ip) {
    return request.ip
  }

  // 2. Check for trusted Cloudflare client IP header (scrubbed & set at Cloudflare edge)
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  // 3. Fallback to standard headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (process.env.NODE_ENV === 'production' && process.env.TRUST_PROXY !== 'true') {
    // In production without an explicitly trusted upstream reverse proxy, standard headers are untrusted.
    if (realIp) return realIp.trim()
  }

  const ip = forwarded || realIp || 'unknown'
  return ip.split(',')[0].trim()
}

export async function getClientIpFromHeaders(): Promise<string> {
  const { headers } = await import('next/headers')
  const headersList = await headers()

  // Prioritize trusted Cloudflare client IP header
  const cfIp = headersList.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  const forwarded = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')

  const ip = forwarded || realIp || 'unknown'
  return ip.split(',')[0].trim()
}
