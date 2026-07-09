export function getClientIp(request: Request): string {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  return ip.split(',')[0].trim()
}

export async function getClientIpFromHeaders(): Promise<string> {
  const { headers } = await import('next/headers')
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  return ip.split(',')[0].trim()
}
