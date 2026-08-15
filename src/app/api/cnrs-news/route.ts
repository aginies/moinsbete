import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/ip'
import { RATE_LIMIT_ERROR_MESSAGE } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const clientId = getClientIp(request)
  if (!(await checkRateLimit(`cnrs:${clientId}`, 30, 60_000))) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 })
  }

  try {
    const now = new Date()
    const articles = await prisma.cachedCnrsArticle.findMany({
      where: { expiresAt: { gte: now } },
    })
    const article = articles.length > 0
      ? articles[Math.floor(Math.random() * articles.length)]
      : null

    if (article) {
      return NextResponse.json({
        title: article.title || 'Actualité CNRS',
        imageUrl: article.imageUrl,
        link: article.link,
        category: article.category || 'Sciences',
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
      })
    }

    return NextResponse.json({
      title: 'Actualité CNRS',
      imageUrl: '',
      link: 'https://www.cnrs.fr/fr/newsroom',
      category: 'Sciences',
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
    })
  } catch (error) {
    console.error('CNRS error:', error)
    return NextResponse.json({
      title: 'Actualité CNRS',
      imageUrl: '',
      link: 'https://www.cnrs.fr/fr/newsroom',
      category: 'Sciences',
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
    })
  }
}
