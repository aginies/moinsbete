'use server'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { slugify } from '@/lib/utils'

export async function createTopicAction(data: {
  name: string
  icon?: string
  description?: string
  color?: string
  parentId?: string
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { error: 'Non autorisé' }
  }

  const existing = await prisma.topic.findUnique({
    where: { name: data.name },
  })

  if (existing) {
    return { error: 'Ce sujet existe déjà' }
  }

  await prisma.topic.create({
    data: {
      name: data.name,
      slug: slugify(data.name),
      icon: data.icon || '📚',
      description: data.description,
      color: data.color || '#6366f1',
      parentId: data.parentId || undefined,
    },
  })

  return { success: true }
}

export async function updateTopicAction(id: string, data: {
  name?: string
  icon?: string
  description?: string
  color?: string
  parentId?: string | null
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { error: 'Non autorisé' }
  }

  await prisma.topic.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.name ? slugify(data.name) : undefined,
      icon: data.icon,
      description: data.description,
      color: data.color,
      parentId: data.parentId,
    },
  })

  return { success: true }
}

export async function deleteTopicAction(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { error: 'Non autorisé' }
  }

  await prisma.topic.delete({ where: { id } })
  return { success: true }
}

export async function approveSuggestionAction(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { error: 'Non autorisé' }
  }

  const suggestion = await prisma.topicSuggestion.findUnique({ where: { id } })
  if (!suggestion) {
    return { error: 'Suggestion not found' }
  }
  if (suggestion.status !== 'PENDING') {
    return { error: 'Suggestion already processed' }
  }

  let topic
  await prisma.$transaction(async (tx) => {
    if (suggestion.parentId) {
      topic = await tx.topic.create({
        data: {
          name: suggestion.categoryName,
          slug: slugify(suggestion.categoryName),
          icon: suggestion.icon,
          color: getRandomColor(),
          parentId: suggestion.parentId,
        },
      })
    } else {
      topic = await tx.topic.create({
        data: {
          name: suggestion.categoryName,
          slug: slugify(suggestion.categoryName),
          icon: suggestion.icon,
          color: getRandomColor(),
        },
      })
    }
    await tx.topicSuggestion.update({
      where: { id },
      data: { status: 'APPROVED', mergedIntoId: topic.id },
    })
  })

  return { success: true, topicId: topic.id }
}

export async function rejectSuggestionAction(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { error: 'Non autorisé' }
  }

  await prisma.topicSuggestion.update({
    where: { id },
    data: { status: 'REJECTED' },
  })

  return { success: true }
}

export async function mergeSuggestionAction(id: string, mergedIntoId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { error: 'Non autorisé' }
  }

  const targetTopic = await prisma.topic.findUnique({ where: { id: mergedIntoId } })
  if (!targetTopic) {
    return { error: 'Target topic not found' }
  }

  await prisma.topicSuggestion.update({
    where: { id },
    data: { status: 'MERGED', mergedIntoId },
  })

  return { success: true, mergedInto: targetTopic }
}
