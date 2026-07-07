import 'dotenv/config'
import { prisma } from '../lib/db'
import { slugify } from '../lib/utils'
import { distillIdeas } from '../lib/llm'

const TOPICS_TO_GENERATE = [
  { name: 'Psychologie', count: 50 },
  { name: 'Philosophie', count: 50 },
  { name: 'Sciences cognitives', count: 50 },
  { name: 'Économie', count: 50 },
  { name: 'Communication', count: 50 },
  { name: 'Productivité', count: 50 },
  { name: 'Santé & Bien-être', count: 50 },
  { name: 'Créativité', count: 50 },
  { name: 'Leadership', count: 50 },
  { name: 'Histoire', count: 50 },
  { name: 'Finance & Argent', count: 50 },
  { name: 'Technologie & Innovation', count: 50 },
  { name: 'Sociologie', count: 50 },
  { name: 'Physique', count: 50 },
  { name: 'Cuisine & Alimentation', count: 50 },
  { name: 'Biologie & Évolution', count: 50 },
  { name: 'Mathématiques', count: 50 },
  { name: 'Art & Design', count: 50 },
  { name: 'Débat & Rhétorique', count: 50 },
  { name: 'Chats et chiens', count: 50 },
  { name: 'Golf', count: 50 },
  { name: 'Voitures', count: 50 },
]

const TOPIC_ARTICLES: Record<string, string[]> = {
  'Psychologie': ['Biais cognitifs', 'Heuristique', 'Dissonance cognitive', 'Intelligence émotionnelle', 'Autonomie psychologique', 'Théorie de l\'attachement', 'Conditionnement', 'Motivation', 'Stress', 'Croyances'],
  'Philosophie': ['Stoïcisme', 'Existentialisme', 'Épicurisme', 'Utilitarisme', 'Phénoménologie', 'Rationalisme', 'Empirisme', 'Nihilisme', 'Humanisme', 'Pragmatisme'],
  'Sciences cognitives': ['Neuroplasticité', 'Mémoire de travail', 'Apprentissage', 'Attention', 'Résolution de problèmes', 'Perception', 'Langage', 'Prise de décision', 'Conscience', 'Métacognition'],
  'Économie': ['Théorie des jeux', 'Aversion à la perte', 'Coût d\'opportunité', 'Incitations', 'Biens publics', 'Équilibre de Nash', 'Marchés', 'Inflation', 'Commerce international', 'Développement'],
  'Communication': ['Communication non violente', 'Écoute active', 'Narration', 'Persuasion', 'Non-verbal', 'Communication interculturelle', 'Médiation', 'Présentation', 'Réseaux sociaux', 'Journalisme'],
  'Productivité': ['Deep Work', 'Loi de Pareto', 'GTD', 'Pomodoro', 'Time blocking', 'Délegation', 'Priorisation', 'Flow', 'Habitudes', 'Gestion du stress'],
  'Santé & Bien-être': ['Sommeil', 'Exercice', 'Méditation', 'Nutrition', 'Résilience', 'Gestion du stress', 'Hormones', 'Microbiote', 'Lumière', 'Social'],
  'Créativité': ['Pensée latérale', 'Brainstorming', 'Design thinking', 'Inspiration', 'Pratique délibérée', 'Imagination', 'Art', 'Innovation', 'Collaboration', 'Curiosité'],
  'Leadership': ['Servant leadership', 'Vision', 'Délégation', 'Feedback', 'Intelligence émotionnelle', 'Changement', 'Culture d\'entreprise', 'Mentorat', 'Négociation', 'Stratégie'],
  'Histoire': ['Chute de Rome', 'Renaissance', 'Révolution française', 'Guerre froide', 'Révolution industrielle', 'Antiquité', 'Moyen-âge', 'Colonisation', 'Exploration', 'Diplomatie'],
  'Finance & Argent': ['Intérêt composé', 'Bourse', 'Inflation', 'Épargne', 'Cryptomonnaie', 'Investissement', 'Dettes', 'Budget', 'Assurance', 'Risque'],
  'Technologie & Innovation': ['Intelligence artificielle', 'Internet', 'Cloud', 'Cybersécurité', 'Blockchain', 'Robotique', '5G', 'Open source', 'Internet des objets', 'Informatique quantique'],
  'Sociologie': ['Capital social', 'Inégalité', 'Migration', 'Pouvoir', 'Culture', 'Éducation', 'Média', 'Urbanisation', 'Globalisation', 'Conformité'],
  'Physique': ['Mécanique quantique', 'Relativité', 'Thermodynamique', 'Électromagnétisme', 'Particules', 'Trous noirs', 'Énergie', 'Ondes', 'Cosmologie', 'Entropie'],
  'Cuisine & Alimentation': ['Réaction de Maillard', 'Fermentation', 'Épices', 'Nutrition', 'Gastronomie', 'Pain', 'Fromage', 'Jeûne', 'Umami', 'Conservation des aliments'],
  'Biologie & Évolution': ['ADN', 'Génétique', 'Microbiome', 'Cellule', 'Immunité', 'Écosystème', 'Biodiversité', 'Neurosciences', 'Anatomie', 'Sélection naturelle'],
  'Mathématiques': ['Théorème de Bayes', 'Nombres premiers', 'Fibonacci', 'Fractales', 'Probabilités', 'Statistiques', 'Logique', 'Topologie', 'Algèbre', 'Zéro'],
  'Art & Design': ['Renaissance', 'Impressionnisme', 'Bauhaus', 'Minimalisme', 'Photographie', 'Architecture', 'Design graphique', 'Couleur', 'Typographie', 'Perspective (arts plastiques)'],
  'Débat & Rhétorique': ['Logique', 'Argumentation', 'Propagande', 'Dialectique', 'Pensée critique', 'Rhétorique', 'Méthode socratique', 'Fallacieux', 'Éthique', 'Éloquence'],
  'Chats et chiens': ['Chat domestique', 'Chien', 'Comportement du chat', 'Comportement du chien', 'Socialisation du chaton', 'Socialisation du chiot', 'Éducation du chien', 'Langage corporel du chat', 'Langage corporel du chien', 'Intelligence du chien', 'Anxiété de séparation', 'Jeu chez les animaux domestiques', 'Alimentation du chat', 'Alimentation du chien', 'Race de chat', 'Race de chien', 'Domestication du chat', 'Domestication du chien', 'Comportement alimentaire félin', 'Comportement alimentaire canin'],
  'Golf': ['Golf', 'Vocabulaire_du_golf', 'Swing_de_golf', 'Matériel_de_golf', 'Règles_de_golf', 'Par_(golf)', 'Compétition_de_golf', 'Balle_de_golf', 'Terrain_de_golf', 'Histoire_du_golf', 'Étiquette_(golf)', 'Driving_range', 'Tee_(golf)', 'Fairway', 'Green_(golf)', 'Putter', 'Bunker_(sport)', 'Caddie', 'Handicap_(golf)', 'Jeu_de_golf'],
  'Voitures': ['Automobile', 'Sécurité_automobile', 'Toyota', 'Tesla,_Inc.', 'Voiture_électrique', 'Moteur_électrique', 'Carrosserie', 'Batterie_rechargeable', 'Conduite_autonome', 'Formule_1', 'Industrie_automobile', 'Crédit_à_la_consommation', 'Assurance_automobile', 'Permis_de_conduire', 'Hybride_(automobile)', 'Tuning', 'Motorisation', 'Transmission_(automobile)', 'Pneu', 'Climatisation'],
}

async function main() {
  console.log('🚀 Génération d\'idées par topic\n')

  let totalCreated = 0

  for (const topicData of TOPICS_TO_GENERATE) {
    console.log(`\n📚 ${topicData.name} (${topicData.count} idées)`)

    const topic = await prisma.topic.findUnique({
      where: { name: topicData.name },
    })

    if (!topic) {
      console.log(`  ⚠️ Topic introuvable: ${topicData.name}`)
      continue
    }

    // Count existing ideas for this topic
    const existingCount = await prisma.idea.count({
      where: {
        ideaTopics: {
          some: { topicId: topic.id },
        },
      },
    })

    const remaining = topicData.count - existingCount
    if (remaining <= 0) {
      console.log(`  ✓ ${topicData.count} idées existantes, skip`)
      continue
    }

    const articlesToTry = TOPIC_ARTICLES[topicData.name] || []
    let createdForTopic = 0

    for (const articleName of articlesToTry) {
      if (createdForTopic >= remaining) {
        console.log(`  ✓ Objectif atteint (${topicData.count} idées)`)
        break
      }

      // Fetch article
      const WIKIPEDIA_API = 'https://fr.wikipedia.org/api/rest_v1'
      let summary = null
      const variations = [
        articleName.replace(/ /g, '_'),
        articleName.replace(/ /g, '%20'),
        articleName,
      ]
      
      for (const v of variations) {
        try {
          const res = await fetch(`${WIKIPEDIA_API}/page/summary/${v}`, {
            headers: { 'User-Agent': 'MoinsBête/1.0 (contact: admin@stashfru.fr)' },
          })
          if (res.ok) {
            const data = await res.json()
            if (data.type !== 'disambiguation' && data.extract) {
              summary = data
              break
            }
          }
        } catch {
          // try next
        }
      }

      if (!summary?.extract) {
        console.log(`  ⚠️ Article non trouvé: ${articleName}`)
        continue
      }

      // Get existing topics for LLM context
      const existingTopics = await prisma.topic.findMany({
        select: { id: true, name: true },
      })

      // Distill ideas
      const ideasData = await distillIdeas(
        articleName,
        summary.extract,
        `https://fr.wikipedia.org/wiki/${encodeURIComponent(articleName)}`,
        existingTopics
      )

      if (ideasData.length === 0) {
        console.log(`  ⚠️ Aucune idée générée pour ${articleName}`)
        continue
      }

      for (const ideaData of ideasData) {
        if (await prisma.idea.count({
          where: { title: ideaData.title },
        }) > 0) {
          continue
        }

        const source = await prisma.source.upsert({
          where: { slug: slugify(articleName) },
          update: {},
          create: {
            title: articleName,
            slug: slugify(articleName),
            type: 'WIKIPEDIA',
            url: `https://fr.wikipedia.org/wiki/${encodeURIComponent(articleName)}`,
          },
        })

        try {
          await prisma.idea.create({
            data: {
              title: ideaData.title,
              content: ideaData.content,
              takeaway: ideaData.takeaway,
              slug: `${slugify(ideaData.title)}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              sourceId: source.id,
              ideaTopics: {
                create: [{ topicId: topic.id }],
              },
            },
          })
          totalCreated++
          createdForTopic++
          console.log(`  ✓ ${ideaData.title}`)
        } catch {
          // skip duplicates
        }
      }

      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }

  console.log(`\n✅ ${totalCreated} nouvelles idées créées`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
