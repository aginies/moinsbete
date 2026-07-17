import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MoinsBeteApp/1.0 (moinsbete@ginies.org)',
      },
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch video' }, { status: 502 })
    }

    const videoBuffer = await response.arrayBuffer()

    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoBuffer.byteLength.toString(),
        'Access-Control-Allow-Origin': '*',
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (error) {
    console.error('Video proxy error:', error)
    return NextResponse.json({ error: 'Video proxy error' }, { status: 500 })
  }
}
