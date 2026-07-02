import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'
import facts from '/tmp/wiki_facts_with_urls.json'

const prisma = new PrismaClient()

async function main() {
  // Delete existing facts
  await prisma.saviezVousFact.deleteMany()
  
  // Insert new facts with URLs
  const data = (facts as Array<{ text: string; url: string | null }>).map(f => ({
    text: f.text,
    sourceUrl: f.url,
  }))
  
  const inserted = await prisma.saviezVousFact.createMany({
    data,
  })
  
  console.log(`Inserted ${inserted.count} facts`)
  
  // Verify
  const count = await prisma.saviezVousFact.count()
  console.log(`Total facts in DB: ${count}`)
  
  const sample = await prisma.saviezVousFact.findMany({ take: 5 })
  console.log('---')
  for (const f of sample) {
    console.log(f.text.substring(0, 60))
    console.log(`  URL: ${f.sourceUrl}`)
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
