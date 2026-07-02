import 'dotenv/config'
import { prisma } from '../lib/db'
import { slugify, getRandomIcon, getRandomColor } from '../lib/utils'
import { suggestTopic, distillIdeas } from '../lib/llm'

const WIKIPEDIA_API = 'https://fr.wikipedia.org/api/rest_v1'

interface WikipediaSummary {
  title: string
  extract: string
  thumbnail?: { source: string }
  content_urls?: { desktop?: { page?: string } }
}

const ARTICLES_TO_INGEST = [
  'Stoïcisme',
  'Mémoire de travail',
  'Biais cognitifs',
]

const ROOT_TOPICS = [
  { name: 'Psychologie', icon: '🧠', color: '#6366f1', description: 'Étude du comportement et de l\'esprit humain' },
  { name: 'Philosophie', icon: '🏛️', color: '#8b5cf6', description: 'Réflexion sur les questions fondamentales de l\'existence' },
  { name: 'Sciences cognitives', icon: '🔬', color: '#ec4899', description: 'Étude interdisciplinaire de l\'esprit et du cerveau' },
  { name: 'Économie', icon: '💰', color: '#f97316', description: 'Science des choix et de l\'allocation des ressources' },
  { name: 'Communication', icon: '🗣️', color: '#22c55e', description: 'Échange d\'informations et interaction entre individus' },
  { name: 'Productivité', icon: '⚡', color: '#eab308', description: 'Art d\'optimiser son temps et ses efforts' },
  { name: 'Santé & Bien-être', icon: '🧘', color: '#14b8a6', description: 'Développement du physique et du mental' },
  { name: 'Créativité', icon: '💡', color: '#f43f5e', description: 'Capacité à générer des idées nouvelles et originales' },
  { name: 'Leadership', icon: '👑', color: '#3b82f6', description: 'Art d\'inspirer et guider les autres' },
  { name: 'Histoire', icon: '📜', color: '#7c3aed', description: 'Étude des événements passés et de leurs leçons' },
]

async function fetchWikipediaSummary(title: string): Promise<WikipediaSummary | null> {
  try {
    const response = await fetch(`${WIKIPEDIA_API}/page/summary/${encodeURIComponent(title)}`, {
      headers: {
        'User-Agent': 'StashFru/1.0 (contact: admin@stashfru.fr)',
      },
    })
    if (!response.ok) return null
    const data = await response.json()
    if (data.type === 'disambiguation') return null
    return data
  } catch {
    return null
  }
}

async function fetchWikipediaCategories(title: string): Promise<string[]> {
  try {
    const response = await fetch(`${WIKIPEDIA_API}/page/html/${encodeURIComponent(title)}`, {
      headers: {
        'User-Agent': 'StashFru/1.0 (contact: admin@stashfru.fr)',
      },
    })
    if (!response.ok) return []
    const html = await response.text()

    const categoryRegex = /<a[^>]*href="\/wiki\/Catégorie:([^"]+)"[^>]*>/gi
    const categories: string[] = []
    let match

    while ((match = categoryRegex.exec(html)) !== null) {
      categories.push(match[1])
    }

    return [...new Set(categories)]
  } catch {
    return []
  }
}

async function ensureRootTopics() {
  console.log('📚 Vérification des sujets racine...')

  for (const topicData of ROOT_TOPICS) {
    const existing = await prisma.topic.findUnique({
      where: { name: topicData.name },
    })

    if (!existing) {
      await prisma.topic.create({
        data: {
          name: topicData.name,
          slug: slugify(topicData.name),
          icon: topicData.icon,
          color: topicData.color,
          description: topicData.description,
        },
      })
      console.log(`  ✓ Créé: ${topicData.name}`)
    } else {
      console.log(`  ✓ Existe déjà: ${topicData.name}`)
    }
  }
}

async function getOrCreateTopic(categoryName: string, existingTopics: Array<{ id: string; name: string; parentId?: string }>) {
  const metaPatterns = ['Portail:', 'Wikipédia:', 'Article ébauche', 'À illustrer', 'Articles à vérifier']
  if (metaPatterns.some(p => categoryName.includes(p))) return null

  const suggestion = await suggestTopic(categoryName, existingTopics)

  if (suggestion.action === 'match' && suggestion.matchTopicId) {
    return await prisma.topic.findUnique({ where: { id: suggestion.matchTopicId } })
  }

  let topic

  if (suggestion.suggestion) {
    const topicData: any = {
      name: suggestion.suggestion.name,
      slug: slugify(suggestion.suggestion.name),
      icon: suggestion.suggestion.icon || getRandomIcon(),
      color: getRandomColor(),
    }

    if (suggestion.suggestion.parentId) {
      topicData.parentId = suggestion.suggestion.parentId
    }

    topic = await prisma.topic.create({ data: topicData })

    await prisma.topicSuggestion.create({
      data: {
        categoryName,
        parentId: suggestion.suggestion.parentId,
        icon: topic.icon,
        confidence: suggestion.confidence,
        articleCount: 1,
        status: 'APPROVED',
        mergedIntoId: topic.id,
      },
    })
  } else {
    topic = await prisma.topic.create({
      data: {
        name: categoryName,
        slug: slugify(categoryName),
        icon: getRandomIcon(),
        color: getRandomColor(),
      },
    })

    await prisma.topicSuggestion.create({
      data: {
        categoryName,
        icon: topic.icon,
        confidence: 0.5,
        articleCount: 1,
        status: 'APPROVED',
        mergedIntoId: topic.id,
      },
    })
  }

  return topic
}

async function ingestArticle(title: string, index: number) {
  console.log(`\n📖 [${index + 1}/${ARTICLES_TO_INGEST.length}] ${title}`)

  const summary = await fetchWikipediaSummary(title)
  if (!summary || !summary.extract) {
    console.log('  ⚠️ Article non trouvé ou vide, skip')
    return null
  }

  const categories = await fetchWikipediaCategories(title)
  console.log(`  🏷️ Catégories trouvées: ${categories.length}`)

  const existingTopics = await prisma.topic.findMany({
    select: { id: true, name: true, parentId: true },
  })

  const topicIds: string[] = []
  const processedCategories = new Set<string>()

  for (const category of categories) {
    if (processedCategories.has(category)) continue
    if (category.length < 3) continue

    const topic = await getOrCreateTopic(category, existingTopics)
    if (topic && !topicIds.includes(topic.id)) {
      topicIds.push(topic.id)
      processedCategories.add(category)
    }
  }

  if (topicIds.length === 0) {
    const defaultTopic = await prisma.topic.findFirst({ where: { parentId: null } })
    if (defaultTopic) {
      topicIds.push(defaultTopic.id)
    }
  }

  const existingSource = await prisma.source.findFirst({
    where: { title, type: 'WIKIPEDIA' },
  })

  let source

  if (existingSource) {
    source = existingSource
    console.log(`  ✓ Source existe déjà: ${title}`)
  } else {
    source = await prisma.source.create({
      data: {
        title,
        slug: slugify(title),
        type: 'WIKIPEDIA',
        url: summary.content_urls?.desktop?.page || `https://fr.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        coverUrl: summary.thumbnail?.source,
        description: summary.extract.substring(0, 200),
      },
    })
    console.log(`  ✓ Source créée`)
  }

  const existingIdeas = await prisma.idea.findMany({
    where: { sourceId: source.id },
  })

  if (existingIdeas.length >= 5) {
    console.log(`  ✓ ${existingIdeas.length} idées existantes, skip distillation`)
    return source
  }

  console.log('  🤖 Distillation des idées avec LLM...')

  const ideasData = await distillIdeas(title, summary.extract, source.url!, existingTopics)

  if (ideasData.length === 0) {
    console.log('  ⚠️ Aucune idée générée par le LLM')
    return source
  }

  for (let i = 0; i < Math.min(ideasData.length, 3); i++) {
    const ideaData = ideasData[i]

    const idea = await prisma.idea.create({
      data: {
        title: ideaData.title,
        content: ideaData.content,
        takeaway: ideaData.takeaway,
        slug: `${slugify(ideaData.title)}-${source.id}-${i}`,
        sourceId: source.id,
        orderIndex: i,
        ideaTopics: {
          create: [{ topic: { connect: { id: topicIds[0] } } }],
        },
      },
    })

    console.log(`  ✓ Idée ${i + 1}: ${ideaData.title}`)
  }

  return source
}

async function createCollections() {
  console.log('\n📦 Création des collections...')

  const collections = [
    {
      title: 'Prendre de meilleures décisions',
      description: 'Apprenez à faire les bons choix grâce aux modèles mentaux et à la psychologie décisionnelle.',
    },
    {
      title: 'Construire de bonnes habitudes',
      description: 'Les stratégies éprouvées pour développer des habitudes positives et durable.',
    },
    {
      title: 'Maîtriser ses émotions',
      description: 'Développez votre intelligence émotionnelle et apprenez à gérer vos réactions.',
    },
    {
      title: 'Penser comme un stratège',
      description: 'Modèles de pensée et frameworks pour une pensée stratégique et analytique.',
    },
    {
      title: 'Apprendre plus vite',
      description: 'Techniques et méthodes pour accélérer votre apprentissage et retenir l\'essentiel.',
    },
  ]

  const allIdeas = await prisma.idea.findMany({
    where: { isPublished: true },
    select: { id: true },
  })

  const allTopics = await prisma.topic.findMany({
    select: { id: true },
  })

  for (const collectionData of collections) {
    const existing = await prisma.collection.findUnique({
      where: { slug: slugify(collectionData.title) },
    })

    if (existing) {
      console.log(`  ✓ Collection existe: ${collectionData.title}`)
      continue
    }

    const shuffled = [...allIdeas].sort(() => Math.random() - 0.5)
    const ideaIds = shuffled.slice(0, 10).map(i => i.id)

    await prisma.collection.create({
      data: {
        ...collectionData,
        slug: slugify(collectionData.title),
        topics: {
          connect: allTopics.slice(0, 3).map(t => ({ id: t.id })),
        },
        isFeatured: true,
      },
    })

    console.log(`  ✓ Créé: ${collectionData.title} (${ideaIds.length} idées)`)
  }
}

async function main() {
  console.log('🚀 StashFru - Ingestion de contenu Wikipédia\n')

  await ensureRootTopics()

  const topics = await prisma.topic.findMany({
    select: { id: true, name: true, parentId: true },
  })

  console.log(`\n✅ ${topics.length} sujets en base`)

  for (let i = 0; i < ARTICLES_TO_INGEST.length; i++) {
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    await ingestArticle(ARTICLES_TO_INGEST[i], i)
  }

  const ideas = await prisma.idea.count()
  const sources = await prisma.source.count()
  const topicCount = await prisma.topic.count()

  console.log(`\n📊 Résumé:`)
  console.log(`  Sources: ${sources}`)
  console.log(`  Idées: ${ideas}`)
  console.log(`  Sujets: ${topicCount}`)

  await createCollections()
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
