import { prisma } from '../src/lib/db'
import { slugify } from '../src/lib/utils'

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
  { name: 'Voitures', icon: '🚗', color: '#ef4444', description: 'Automobiles, technologie et industrie automobile' },
  { name: 'Finance & Argent', icon: '💰', color: '#ff6b35', description: 'Gestion personnelle, investissement et compréhension de l\'argent' },
  { name: 'Technologie & Innovation', icon: '💻', color: '#3b82f6', description: 'Numérique, intelligence artificielle et cycles d\'innovation' },
  { name: 'Sociologie', icon: '👥', color: '#14b8a6', description: 'Dynamiques de groupe, structures et comportements collectifs' },
  { name: 'Physique', icon: '⚛️', color: '#8b5cf6', description: 'Lois de l\'univers, paradoxes et découvertes fondamentales' },
  { name: 'Cuisine & Alimentation', icon: '🍳', color: '#f97316', description: 'Science culinaire, techniques et cultures alimentaires' },
  { name: 'Biologie & Évolution', icon: '🧬', color: '#22c55e', description: 'Vie, adaptation, sélection naturelle et systèmes biologiques' },
  { name: 'Mathématiques', icon: '🔢', color: '#ec4899', description: 'Paradoxes, théorèmes, probabilités et logique' },
  { name: 'Art & Design', icon: '🎨', color: '#ef4444', description: 'Mouvements artistiques, principes visuels et créativité' },
  { name: 'Débat & Rhétorique', icon: '🎤', color: '#a855f7', description: 'Art de convaincre, logique et argumentation structurée' },
  { name: 'En forme 40+', icon: '💪', color: '#f97316', description: "Rester physiquement et cognitivement actif après 40 et 50 ans" },
]

async function main() {
  console.log('🌱 Seed initial - Sujets racine')

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
      console.log(`  ✓ ${topicData.name}`)
    } else {
      console.log(`  - ${topicData.name} (existe déjà)`)
    }
  }

  const count = await prisma.topic.count()
  console.log(`\n✅ ${count} sujets en base`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
