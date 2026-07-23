import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const now = new Date()
    const article = await prisma.cachedCnrsArticle.findFirst({
      where: { expiresAt: { gte: now } },
      orderBy: { scrapedAt: 'desc' },
    })

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
