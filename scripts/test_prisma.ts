import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'

const prisma = new PrismaClient()

async function main() {
  const count = await prisma.saviezVousFact.count()
  console.log('Count:', count)
  
  const facts = await prisma.saviezVousFact.findMany({
    select: {
      id: true,
      text: true,
      sourceUrl: true,
      createdAt: true,
    },
  })
  console.log('Found:', facts.length)
  if (facts.length > 0) {
    console.log('First:', JSON.stringify(facts[0], null, 2))
  }
}

main()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect())
