'use server'


import { getSession, authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { slugify } from '@/lib/utils'

export async function createTopicAction(data: {
  name: string
  icon?: string
  description?: string
  color?: string
  parentId?: string
}) {
  const session = await getSession()
  if (!session) {
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
  const session = await getSession()
  if (!session) {
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
  const session = await getSession()
  if (!session) {
    return { error: 'Non autorisé' }
  }

  await prisma.topic.delete({ where: { id } })
  return { success: true }
}
