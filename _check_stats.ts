import 'dotenv/config'
import { PrismaClient } from './src/generated/client'

const prisma = new PrismaClient()

async function main() {
  const enhanced = await prisma.idea.count({
    where: { isPublished: true, isEnhanced: true },
  })
  
  const total = await prisma.idea.count({
    where: { isPublished: true },
  })
  
  const remaining = await prisma.idea.count({
    where: { isPublished: true, isEnhanced: false },
  })
  
  console.log(`Total published ideas: ${total}`)
  console.log(`Enhanced: ${enhanced}`)
  console.log(`Remaining: ${remaining}`)
  
  // Check content distribution
  const allIdeas = await prisma.idea.findMany({
    select: { content: true },
    where: { isPublished: true },
  })
  
  const short = allIdeas.filter(i => i.content.length < 500)
  const medium = allIdeas.filter(i => i.content.length >= 500 && i.content.length < 1000)
  const long = allIdeas.filter(i => i.content.length >= 1000)
  
  console.log(`\nContent distribution:`)
  console.log(`< 500 chars: ${short.length}`)
  console.log(`500-999 chars: ${medium.length}`)
  console.log(`1000+ chars: ${long.length}`)
  console.log(`Avg: ${Math.round(allIdeas.reduce((s, i) => s + i.content.length, 0) / allIdeas.length)} chars`)
  
  await prisma.$disconnect()
}

main()
