const { PrismaClient } = require('../src/generated/client')
const facts = require('/tmp/wiki_facts_clean.json')

const prisma = new PrismaClient()

async function main() {
  // Delete existing facts
  await prisma.saviezVousFact.deleteMany()
  
  // Insert new facts
  const inserted = await prisma.saviezVousFact.createMany({
    data: facts.map(text => ({ text })),
  })
  
  console.log(`Inserted ${inserted.count} facts`)
  
  // Verify
  const count = await prisma.saviezVousFact.count()
  console.log(`Total facts in DB: ${count}`)
  
  const sample = await prisma.saviezVousFact.findMany({ take: 3 })
  console.log('---')
  for (const f of sample) {
    console.log(f.text.substring(0, 80))
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
