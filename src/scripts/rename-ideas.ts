import 'dotenv/config'
import { prisma } from '../lib/db'
import * as fs from 'fs'
import * as path from 'path'

const BATCH_SIZE = 50
const CHECKPOINT_FILE = path.join(process.cwd(), 'rename-checkpoint.json')

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

function parseNewTitle(title: string, content: string): string {
  // Get complete sentences from content
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
  if (sentences.length === 0) return title.substring(0, 100)
  
  // Use first substantial sentence
  const firstComplete = sentences[0].trim()
  if (!firstComplete) return title.substring(0, 100)
  
  // Try to extract subject: description pattern
  const match = firstComplete.match(/^(.+?)\s+(est|désigne|correspond|représente|se définit|signifie)\s+(.+)$/i)
  if (match) {
    let subject = match[1].trim()
    let desc = match[3].trim()
    
    // Clean subject: remove articles
    subject = subject.replace(/^(Le|La|Les|Un|Une|L|Le|La)\s+/i, '').trim()
    
    // Clean desc: remove leading filler words
    desc = desc.replace(/^(bien plus|simplement|juste|un|une|les|la|le)\s+/i, '').trim()
    
    // Build title: subject: description
    let newTitle = `${subject}: ${desc}`
    
    // Ensure complete sentence ending
    if (!newTitle.endsWith('.') && !newTitle.endsWith('!') && !newTitle.endsWith('?')) {
      newTitle = `${newTitle}.`
    }
    
    // Truncate to 100 chars max, at word boundary
    if (newTitle.length > 100) {
      const truncated = newTitle.substring(0, 97) + '...'
      return truncated
    }
    
    return newTitle
  }
  
  // Pattern 2: Extract first 3-4 meaningful words as subject + first complete thought
  const words = firstComplete.split(/\s+/)
  if (words.length >= 4) {
    const subject = words.slice(0, 3).join(' ')
    const desc = words.slice(3, 10).join(' ')
    let newTitle = `${subject}: ${desc}.`
    
    // Truncate to 100 chars
    if (newTitle.length > 100) {
      newTitle = newTitle.substring(0, 97) + '...'
    }
    
    return newTitle
  }
  
  // Fallback: first sentence truncated to 100 chars
  return firstComplete.substring(0, 100)
}

async function main() {
  const checkpoint = loadCheckpoint()
  
  console.log('🏷️ Amélioration des titres génériques (template-based)\n')
  
  let ideas = await prisma.idea.findMany({
    where: {
      isPublished: true,
      OR: [
        { title: { startsWith: 'Définition' } },
        { title: { startsWith: 'Nature' } },
        { title: { startsWith: 'Origine' } },
      ],
    },
    select: {
      id: true,
      title: true,
      content: true,
    },
    orderBy: { createdAt: 'asc' },
  })
  
  // Resume: skip already processed
  if (checkpoint.processedIds.length > 0) {
    ideas = ideas.filter(i => !checkpoint.processedIds.includes(i.id))
    console.log(`Resume mode: ${ideas.length} ideas remaining (skipped ${checkpoint.processedIds.length})\n`)
  }
  
  console.log(`Found ${ideas.length} ideas with generic titles\n`)
  
  if (ideas.length === 0) {
    console.log('✅ All ideas have specific titles!')
    if (fs.existsSync(CHECKPOINT_FILE)) {
      fs.unlinkSync(CHECKPOINT_FILE)
    }
    return
  }
  
  let processed = 0
  let renamed = 0
  let unchanged = 0
  const total = ideas.length
  const startTime = Date.now()
  
  for (let i = 0; i < ideas.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(total / BATCH_SIZE)
    const batch = ideas.slice(i, i + BATCH_SIZE)
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
    const etaSeconds = Number(((Date.now() - startTime) / (processed + 1) * (total - (processed + 1))).toFixed(0))
    const hours = Math.floor(etaSeconds / 3600)
    const minutes = Math.floor((etaSeconds % 3600) / 60)
    const seconds = Math.round(etaSeconds % 60)
    const etaStr = hours > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}m` : minutes > 0 ? `${minutes}m${seconds}s` : `${seconds}s`
    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} ideas) [${Math.round((processed / total) * 100)}%] ETA: ${etaStr}`)
    
    for (const idea of batch) {
      processed++
      const progress = `${processed}/${total}`
      const pct = Math.round((processed / total) * 100)
      console.log(`  [${progress}] ${idea.title} [${pct}%]`)
      
      const newTitle = parseNewTitle(idea.title, idea.content)
      
      if (!newTitle || newTitle === idea.title) {
        console.log(`    ✓ Title unchanged, skipping`)
        unchanged++
        checkpoint.processedIds.push(idea.id)
        saveCheckpoint(checkpoint)
        continue
      }
      
      try {
        await prisma.idea.update({
          where: { id: idea.id },
          data: {
            title: newTitle,
          },
        })
        renamed++
        checkpoint.processedIds.push(idea.id)
        console.log(`    ✓ ${idea.title} → ${newTitle}`)
      } catch (updateError) {
        console.error(`    ❌ Update failed:`, updateError)
      }
    }
    
    if (i + BATCH_SIZE < ideas.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
  console.log('\n=== Résumé ===')
  console.log(`Duration: ${elapsed}s`)
  console.log(`Total ideas processed: ${processed}`)
  console.log(`Renamed: ${renamed}`)
  console.log(`Unchanged (skipped): ${unchanged}`)
  
  const remaining = await prisma.idea.count({
    where: {
      isPublished: true,
      OR: [
        { title: { startsWith: 'Définition' } },
        { title: { startsWith: 'Nature' } },
        { title: { startsWith: 'Origine' } },
      ],
    },
  })
  console.log(`Remaining generic titles: ${remaining}`)
  console.log(`Checkpoint saved to: ${CHECKPOINT_FILE}`)
  
  if (remaining === 0) {
    console.log('\n🎉 All ideas renamed! Checkpoint file will be removed on next run.')
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
