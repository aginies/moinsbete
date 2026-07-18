'use server'

import { prisma } from '@/lib/db'
import { sanitizeMessage } from '@/lib/utils'
import { cookies } from 'next/headers'
import { decode } from 'next-auth/jwt'

async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('__Secure-next-auth.session-token') || cookieStore.get('next-auth.session-token')
  
  if (!sessionCookie) return null

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) return null

  try {
    const session = await decode({
      token: sessionCookie.value,
      secret,
    })

    if (!session?.sub) return null

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, email: true, displayName: true, role: true },
    })

    if (!user) return null

    const expires = (session.exp && typeof session.exp === 'number')
      ? new Date(session.exp * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        role: user.role,
      },
      expires,
    }
  } catch {
    return null
  }
}

export async function createSuggestionAction(data: { title: string; description: string }) {
  const session = await getSession()
  if (!session?.user) return { error: 'Non authentifié' }

  const titleSanitized = data.title.trim()
  if (!titleSanitized) return { error: 'Titre requis' }
  if (titleSanitized.length > 100) return { error: 'Titre max 100 caractères' }

  const descValidation = sanitizeMessage(data.description)
  if (!descValidation.valid) return { error: descValidation.error }

  const suggestion = await prisma.userSuggestion.create({
    data: {
      userId: session.user.id,
      title: titleSanitized,
      description: descValidation.clean,
    },
    include: { user: { select: { id: true, displayName: true, email: true } } },
  })

  return { success: true, suggestion }
}

export async function updateSuggestionAction(suggestionId: string, data: { title: string; description: string }) {
  const session = await getSession()
  if (!session?.user) return { error: 'Non authentifié' }

  const suggestion = await prisma.userSuggestion.findUnique({
    where: { id: suggestionId },
  })
  if (!suggestion) return { error: 'Suggestion introuvable' }

  const isOwner = suggestion.userId === session.user.id
  const isAdmin = session.user.role === 'ADMIN'
  if (!isOwner && !isAdmin) return { error: 'Non autorisé' }

  const titleSanitized = data.title.trim()
  if (!titleSanitized) return { error: 'Titre requis' }
  if (titleSanitized.length > 100) return { error: 'Titre max 100 caractères' }

  const descValidation = sanitizeMessage(data.description)
  if (!descValidation.valid) return { error: descValidation.error }

  const updated = await prisma.userSuggestion.update({
    where: { id: suggestionId },
    data: { title: titleSanitized, description: descValidation.clean },
  })

  return { success: true, suggestion: updated }
}

export async function deleteSuggestionAction(suggestionId: string) {
  const session = await getSession()
  if (!session?.user) return { error: 'Non authentifié' }

  const suggestion = await prisma.userSuggestion.findUnique({
    where: { id: suggestionId },
  })
  if (!suggestion) return { error: 'Suggestion introuvable' }

  const isOwner = suggestion.userId === session.user.id
  const isAdmin = session.user.role === 'ADMIN'
  if (!isOwner && !isAdmin) return { error: 'Non autorisé' }

  await prisma.userSuggestion.delete({ where: { id: suggestionId } })

  return { success: true }
}

export async function addCommentAction(data: { suggestionId: string; content: string }) {
  const session = await getSession()
  if (!session?.user) return { error: 'Non authentifié' }

  const suggestion = await prisma.userSuggestion.findUnique({
    where: { id: data.suggestionId },
  })
  if (!suggestion) return { error: 'Suggestion introuvable' }

  const msgValidation = sanitizeMessage(data.content)
  if (!msgValidation.valid) return { error: msgValidation.error }

  const comment = await prisma.suggestionComment.create({
    data: {
      suggestionId: data.suggestionId,
      userId: session.user.id,
      content: msgValidation.clean,
    },
    include: {
      user: { select: { id: true, displayName: true, email: true } },
    },
  })

  return { success: true, comment }
}
