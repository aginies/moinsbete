import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fetchWotd, fetchWordDetails, searchWords, isValidSearchTerm, type WotdResponse } from '@/lib/portail-lexical'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'search') {
    const term = searchParams.get('q') || ''
    if (!isValidSearchTerm(term)) {
      return NextResponse.json({ suggestions: [] })
    }
    const suggestions = await searchWords(term)
    return NextResponse.json({ suggestions })
  }

  if (action === 'wotd') {
    try {
      const wotd = await fetchWotd()
      if (!wotd) {
        return NextResponse.json({
          form: 'lexique',
          pos: 'nom',
          full_form: 'lexique',
          full_pos: 'nom masculin',
          description: 'Ensemble des mots d\'une langue.',
        })
      }
      return NextResponse.json(wotd)
    } catch {
      return NextResponse.json({
        form: 'lexique',
        pos: 'nom',
        full_form: 'lexique',
        full_pos: 'nom masculin',
        description: 'Ensemble des mots d\'une langue.',
      })
    }
  }

  if (action === 'word') {
    const word = searchParams.get('word') || ''
    if (!word || !isValidSearchTerm(word)) {
      return NextResponse.json({ error: 'Invalid or missing word parameter' }, { status: 400 })
    }
    const details = await fetchWordDetails(word)
    if (!details) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 })
    }
    return NextResponse.json(details)
  }

  if (action === 'history') {
    const limit = Math.min(parseInt(searchParams.get('limit') || '365') || 365, 365)
    const cursor = searchParams.get('cursor') || undefined

    const where: { date: { lt?: string } } = {} as { date: { lt?: string } }
    if (cursor) {
      where.date = { lt: cursor }
    }

    const [words, total] = await Promise.all([
      prisma.portailLexicalMotDuJour.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit + 1,
        select: { word: true, date: true },
      }),
      prisma.portailLexicalMotDuJour.count({
        where,
      }),
    ])

    const hasMore = words.length > limit
    const resultWords = words.slice(0, limit)

    return NextResponse.json({
      words: resultWords,
      total,
      hasMore,
    })
  }

  try {
    const wotd = await fetchWotd()
    if (!wotd) {
      return NextResponse.json({
        form: 'lexique',
        pos: 'nom',
        full_form: 'lexique',
        full_pos: 'nom masculin',
        description: 'Ensemble des mots d\'une langue.',
        ipa: '',
        tlfidefinitions: [],
        wiktionnaireDefinitions: [],
        etymologie: '',
        concordance: [],
      })
    }

    const details = await fetchWordDetails(wotd.form)
    if (!details) {
      return NextResponse.json({
        ...wotd,
        description: '',
        ipa: '',
        tlfidefinitions: [],
        wiktionnaireDefinitions: [],
        etymologie: '',
        concordance: [],
      })
    }

    return NextResponse.json(details)
  } catch (error) {
    console.error('Portail lexical error:', error)
    return NextResponse.json({
      form: 'lexique',
      pos: 'nom',
      full_form: 'lexique',
      full_pos: 'nom masculin',
      description: 'Ensemble des mots d\'une langue.',
      ipa: '',
      tlfidefinitions: [],
      wiktionnaireDefinitions: [],
      etymologie: '',
      concordance: [],
    })
  }
}
