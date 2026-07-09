import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'
import { radioFranceDocs } from '../src/data/radio-france'

const prisma = new PrismaClient()

async function main() {
  const docs = radioFranceDocs
  const bookmarks = await prisma.bookmark.findMany({
    where: { type: 'RADIO_FRANCE' },
    select: { id: true, resourceId: true },
  })

  let updated = 0
  for (const bookmark of bookmarks) {
    const doc = docs.find(d => d.id === bookmark.resourceId)
    if (doc) {
      await prisma.bookmark.update({
        where: { id: bookmark.id },
        data: {
          meta: {
            title: doc.title,
            description: doc.description,
            url: doc.url,
            radio: doc.radio,
            section: doc.section,
            image: doc.image,
          },
        },
      })
      updated++
    }
  }

  console.log(`Updated ${updated} favorites`)
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
