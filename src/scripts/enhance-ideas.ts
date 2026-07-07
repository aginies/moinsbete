import 'dotenv/config'
import { prisma } from '../lib/db'
import { expandIdeas } from '../lib/llm'
import * as fs from 'fs'
import * as path from 'path'

const BATCH_SIZE = 20
const DELAY_MS = 50
const MAX_RETRIES = 3
const CHECKPOINT_FILE = path.join(process.cwd(), 'enhance-checkpoint.json')

interface Checkpoint {
  processedIds: string[]
  failedIds: string[]
  startTime: string
  lastUpdated: string
}

function loadCheckpoint(): Checkpoint {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'))
    }
  } catch { }
  return { processedIds: [], failedIds: [], startTime: new Date().toISOString(), lastUpdated: new Date().toISOString() }
}

function saveCheckpoint(checkpoint: Checkpoint) {
  checkpoint.lastUpdated = new Date().toISOString()
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2))
}

function parseArgs(): { resume?: boolean; batch?: number; retry?: boolean } {
  const args = process.argv.slice(2)
  return {
    resume: args.includes('--resume'),
    batch: args.find(a => a.startsWith('--batch=')) ? parseInt(args.find(a => a.startsWith('--batch='))!.split('=')[1]) : undefined,
    retry: args.includes('--retry'),
  }
}

async function processIdea(idea: { id: string; title: string; content: string; takeaway: string }, retry: boolean = false): Promise<{ success: boolean; expandedContent: string | null; attempt: number }> {
  let attempt = 0
  let expandedContent: string | null = null

  while (attempt < MAX_RETRIES) {
    attempt++
    expandedContent = await expandIdeas(idea.title, idea.content, idea.takeaway)
    
    if (expandedContent && expandedContent.length >= 700) {
      return { success: true, expandedContent, attempt }
    }
    
    if (attempt < MAX_RETRIES) {
      console.log(`    🔄 Retry ${attempt}/${MAX_RETRIES}...`)
      await new Promise(resolve => setTimeout(resolve, DELAY_MS * 10))
    }
  }
  
  return { success: false, expandedContent, attempt }
}

async function main() {
  const args = parseArgs()
  const checkpoint = loadCheckpoint()
  
  console.log('🚀 Enhancement des idées courtes\n')
  
  let ideas = await prisma.idea.findMany({
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
  
  // Filter by content length < 700
  let shortIdeas = ideas.filter(i => i.content.length < 700)
  
  // Resume: skip already processed
  if (args.resume) {
    shortIdeas = shortIdeas.filter(i => !checkpoint.processedIds.includes(i.id))
    console.log(`Resume mode: ${shortIdeas.length} ideas remaining (skipped ${checkpoint.processedIds.length})\n`)
  }
  
  // Retry mode: add failed ideas back
  if (args.retry) {
    const failedIdeas = await prisma.idea.findMany({
      where: { id: { in: checkpoint.failedIds } },
      select: { id: true, title: true, content: true, takeaway: true },
    })
    shortIdeas = [...shortIdeas, ...failedIdeas]
    console.log(`Retry mode: ${failedIdeas.length} failed ideas added\n`)
  }
  
  console.log(`Found ${ideas.length} ideas with short content`)
  console.log(`Filtered to ${shortIdeas.length} ideas with < 700 chars\n`)
  
  if (shortIdeas.length === 0) {
    console.log('✅ All ideas already have sufficient content!')
    fs.unlinkSync(CHECKPOINT_FILE)
    return
  }
  
  let processed = 0
  let expanded = 0
  let failed = 0
  let skipped = 0
  const total = shortIdeas.length
  const startTime = Date.now()
  
  for (let i = 0; i < shortIdeas.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(total / BATCH_SIZE)
    const batch = shortIdeas.slice(i, i + BATCH_SIZE)
    
    // Batch mode
    if (args.batch && args.batch !== batchNum) continue
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
    const eta = ((Date.now() - startTime) / (processed + 1) * (total - (processed + 1))).toFixed(0)
    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} ideas) [${Math.round((processed / total) * 100)}%] ETA: ${eta}s`)
    
    for (const idea of batch) {
      processed++
      const progress = `${processed}/${total}`
      const pct = Math.round((processed / total) * 100)
      console.log(`  [${progress}] ${idea.title} (${idea.content.length} chars) [${pct}%]`)
      
      const result = await processIdea(idea)
      
      if (!result.success) {
        console.log(`    ⚠️ Failed after ${result.attempt} attempt(s)`)
        failed++
        checkpoint.failedIds.push(idea.id)
        saveCheckpoint(checkpoint)
        continue
      }
      
      if (result.expandedContent!.length === idea.content.length && result.expandedContent === idea.content) {
        console.log(`    ✓ Content unchanged, skipping`)
        skipped++
        await prisma.idea.update({
          where: { id: idea.id },
          data: { isEnhanced: true },
        })
        checkpoint.processedIds.push(idea.id)
        saveCheckpoint(checkpoint)
        continue
      }
      
      try {
        await prisma.idea.update({
          where: { id: idea.id },
          data: {
            content: result.expandedContent!,
            isEnhanced: true,
          },
        })
        expanded++
        checkpoint.processedIds.push(idea.id)
        saveCheckpoint(checkpoint)
        console.log(`    ✓ Expanded to ${result.expandedContent!.length} chars (${result.attempt} attempt(s))`)
      } catch (updateError) {
        console.error(`    ❌ Update failed:`, updateError)
        failed++
        checkpoint.failedIds.push(idea.id)
        saveCheckpoint(checkpoint)
      }
    }
    
    if (i + BATCH_SIZE < shortIdeas.length) {
      console.log(`  ⏳ Waiting ${DELAY_MS}ms...`)
      await new Promise(resolve => setTimeout(resolve, DELAY_MS))
    }
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
  console.log('\n=== Résumé ===')
  console.log(`Duration: ${elapsed}s`)
  console.log(`Total ideas processed: ${processed}`)
  console.log(`Successfully expanded: ${expanded}`)
  console.log(`Skipped (unchanged): ${skipped}`)
  console.log(`Failed: ${failed}`)
  
  const remaining = await prisma.idea.count({
    where: { isPublished: true, isEnhanced: false },
  })
  console.log(`Remaining short ideas: ${remaining}`)
  console.log(`Checkpoint saved to: ${CHECKPOINT_FILE}`)
  
  if (remaining === 0 && failed === 0) {
    console.log('\n🎉 All ideas enhanced! Checkpoint file will be removed on next full run.')
    fs.unlinkSync(CHECKPOINT_FILE)
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
