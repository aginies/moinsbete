import 'dotenv/config'
import { prisma } from '../lib/db'
import { expandIdeas } from '../lib/llm'

const BATCH_SIZE = 20
const DELAY_MS = 50

async function main() {
  console.log('🚀 Enhancement des idées courtes\n')

  const ideas = await prisma.idea.findMany({
    where: {
      isPublished: true,
      isEnhanced: false,
    },
    select: {
      id: true,
      title: true,
      content: true,
      takeaway: true,
    },
    orderBy: { content: 'asc' },
  })

  console.log(`Found ${ideas.length} ideas with short content\n`)

  // Filter by content length < 700
  const shortIdeas = ideas.filter(i => i.content.length < 700)
  console.log(`Filtered to ${shortIdeas.length} ideas with < 700 chars\n`)

  if (shortIdeas.length === 0) {
    console.log('✅ All ideas already have sufficient content!')
    return
  }

  let processed = 0
  let expanded = 0
  let failed = 0
  let skipped = 0

  for (let i = 0; i < shortIdeas.length; i += BATCH_SIZE) {
    const batch = shortIdeas.slice(i, i + BATCH_SIZE)
    console.log(`\n📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(shortIdeas.length / BATCH_SIZE)} (${batch.length} ideas)`)

    for (const idea of batch) {
      processed++
      console.log(`  [${processed}/${shortIdeas.length}] ${idea.title} (${idea.content.length} chars)`)

      const expandedContent = await expandIdeas(idea.title, idea.content, idea.takeaway)

      if (!expandedContent) {
        console.log(`    ⚠️ LLM failed to expand`)
        failed++
        continue
      }

      if (expandedContent.length < 700) {
        console.log(`    ⚠️ Expanded content too short: ${expandedContent.length} chars`)
        console.log(`    Content: ${expandedContent.substring(0, 100)}...`)
        failed++
        continue
      }

      if (expandedContent.length === idea.content.length && expandedContent === idea.content) {
        console.log(`    ✓ Content unchanged, skipping`)
        skipped++
        await prisma.idea.update({
          where: { id: idea.id },
          data: { isEnhanced: true },
        })
        continue
      }

      try {
        await prisma.idea.update({
          where: { id: idea.id },
          data: {
            content: expandedContent,
            isEnhanced: true,
          },
        })
        expanded++
        console.log(`    ✓ Expanded to ${expandedContent.length} chars`)
      } catch (updateError) {
        console.error(`    ❌ Update failed:`, updateError)
        failed++
      }
    }

    if (i + BATCH_SIZE < shortIdeas.length) {
      console.log(`  ⏳ Waiting ${DELAY_MS}ms...`)
      await new Promise(resolve => setTimeout(resolve, DELAY_MS))
    }
  }

  console.log('\n=== Résumé ===')
  console.log(`Total ideas processed: ${processed}`)
  console.log(`Successfully expanded: ${expanded}`)
  console.log(`Skipped (unchanged): ${skipped}`)
  console.log(`Failed: ${failed}`)

  const remaining = await prisma.idea.count({
    where: { isPublished: true, isEnhanced: false },
  })
  console.log(`Remaining short ideas: ${remaining}`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
