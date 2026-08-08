import { prisma } from '@/lib/db'

export function runCacheScript(scrapeFn: () => Promise<any>): void {
  scrapeFn()
    .then(() => {
      console.log('Done!')
      process.exit(0)
    })
    .catch(e => {
      console.error('Erreur:', e)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
