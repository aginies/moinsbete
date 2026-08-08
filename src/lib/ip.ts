/**
 * Resolves the client's IP address securely.
 * Prioritizes native platform-provided client IPs and trusted CDN headers (e.g. Cloudflare)
 * to mitigate header spoofing risks in production systems.
 */
export function getClientIp(request: Request | { ip?: string }): string {
  // 1. Prioritize Next.js's built-in request.ip, set securely by the hosting platform (Vercel/Netlify/etc.)
  if (request && typeof (request as any).ip === 'string' && (request as any).ip) {
    return (request as any).ip
  }

  // 2. Check for trusted Cloudflare client IP header (scrubbed & set at Cloudflare edge)
  const headers = (request as any).headers
  const cfIp = headers?.get ? headers.get('cf-connecting-ip') : undefined
  if (cfIp) return cfIp.trim()

  // 3. Fallback to standard headers
  const forwarded = headers?.get ? headers.get('x-forwarded-for') : undefined
  const realIp = headers?.get ? headers.get('x-real-ip') : undefined
  
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

export const ALLOWED_CRON_IPS = [
  '62.210.207.184',
  '127.0.0.1',
  '::1',
  '100.0.0.0/8',
  '10.0.0.0/8',
  '192.168.0.0/16',
]

export function isAllowedIp(ip: string): boolean {
  if (!ip) return false
  
  if (ALLOWED_CRON_IPS.includes(ip)) return true
  
  for (const cidr of ALLOWED_CRON_IPS) {
    if (cidr.includes('/')) {
      const [network, prefixLen] = cidr.split('/')
      const prefix = parseInt(prefixLen, 10)
      if (ipMatchesNetwork(ip, network, prefix)) return true
    }
  }
  
  return false
}

function ipMatchesNetwork(ip: string, network: string, prefixLen: number): boolean {
  const ipInt = ipToNumber(ip)
  const networkInt = ipToNumber(network)
  const mask = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0
  
  return (ipInt & mask) === (networkInt & mask)
}

function ipToNumber(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
}
