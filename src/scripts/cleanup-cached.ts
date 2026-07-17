import 'dotenv/config'
import { prisma } from '../lib/db'
import { cleanupExpired } from '../lib/cache-helpers'

async function main() {
  console.log('🧹 Cleanup expired cached data...')
  
  const counts = await cleanupExpired()
  
  console.log(`✅ Cleanup terminé:`)
  console.log(`  CNRS articles supprimés: ${counts.cnrs}`)
  console.log(`  Radio episodes supprimés: ${counts.radio}`)
  console.log(`  Wikipedia images supprimés: ${counts.wiki}`)
  
  const remaining = await Promise.all([
    prisma.cachedCnrsArticle.count(),
    prisma.cachedRadioEpisode.count(),
    prisma.cachedWikipediaImage.count(),
  ])
  
  console.log(`\n📊 Total restant en cache:`)
  console.log(`  CNRS: ${remaining[0]}`)
  console.log(`  Radio France: ${remaining[1]}`)
  console.log(`  Wikipedia Image: ${remaining[2]}`)
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
