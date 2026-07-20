import { sleep } from '../lib/cache-helpers'

const API_BASE = 'http://localhost:3000'

interface FetchProgress {
  status: 'idle' | 'fetching' | 'done' | 'stopped'
  progress?: string
  currentPage?: string
  total?: number
  added?: number
}

async function pollProgress(): Promise<FetchProgress> {
  const res = await fetch(`${API_BASE}/api/proverbes?action=fetch-all`, {
    method: 'GET',
    signal: AbortSignal.timeout(30000),
  })
  return res.json() as Promise<FetchProgress>
}

async function startFetch(): Promise<FetchProgress> {
  const res = await fetch(`${API_BASE}/api/proverbes?action=fetch-all`, {
    method: 'POST',
    signal: AbortSignal.timeout(10000),
  })
  return res.json() as Promise<FetchProgress>
}

async function main() {
  console.log('📚 Starting fetch all proverbs...')
  
  const startResult = await startFetch()
  console.log(`Started: ${JSON.stringify(startResult)}`)
  
  if (startResult.status === 'done') {
    console.log(`\n✅ Done!`)
    console.log(`  Total proverbs: ${startResult.total}`)
    console.log(`  Added: ${startResult.added}`)
    return
  }
  
  let prevProgress = ''
  while (true) {
    await sleep(2000)
    
    const progress = await pollProgress()
    
    if (progress.status === 'fetching') {
      if (progress.progress !== prevProgress) {
        console.log(`  Fetching page ${progress.progress}: ${progress.currentPage || ''}...`)
        prevProgress = progress.progress || ''
      }
    } else if (progress.status === 'done' || progress.status === 'stopped') {
      const icon = progress.status === 'done' ? '✅' : '⚠️'
      console.log(`\n${icon} ${progress.status === 'done' ? 'Done!' : 'Stopped!'}`)
      console.log(`  Total proverbs: ${progress.total}`)
      console.log(`  Added: ${progress.added}`)
      break
    }
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch(e => {
    console.error('Error:', e)
    process.exit(1)
  })
