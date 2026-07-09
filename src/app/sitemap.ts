import { prisma } from '@/lib/db'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${baseUrl}/sujets`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${baseUrl}/favoris`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.5 },
    { url: `${baseUrl}/mon-historique`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.5 },
    { url: `${baseUrl}/a-propos`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
  ]

  const ideas = await prisma.idea.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })

  const ideaRoutes: MetadataRoute.Sitemap = ideas.map((idea) => ({
    url: `${baseUrl}/idees/${idea.slug}`,
    lastModified: idea.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  const topics = await prisma.topic.findMany({
    select: { slug: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  const topicRoutes: MetadataRoute.Sitemap = topics.map((topic) => ({
    url: `${baseUrl}/sujets/${topic.slug}`,
    lastModified: topic.createdAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...ideaRoutes, ...topicRoutes]
}
