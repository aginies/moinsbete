import { sleep } from '../lib/cache-helpers'

const API_BASE = 'http://localhost:3000'

interface FetchProgress {
  status: 'idle' | 'fetching' | 'done' | 'stopped'
  progress?: string
  currentPage?: string
  total?: number
  added?: number
  perPage?: number
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
  console.log('📚 Récupération de tous les proverbes...')
  
  const startResult = await startFetch()
  console.log(`Démarré : ${JSON.stringify(startResult)}`)
  
  if (startResult.status === 'done') {
    console.log(`\n✅ Terminé !`)
    console.log(`  Total de proverbes : ${startResult.total}`)
    console.log(`  Ajoutés : ${startResult.added}`)
    return
  }
  
  let prevProgress = ''
  while (true) {
    await sleep(2000)
    
    const progress = await pollProgress()
    
    if (progress.status === 'fetching') {
      const proverbCount = progress.perPage != null ? `, ${progress.perPage} proverbe${progress.perPage > 1 ? 's' : ''}` : ''
      const totalCount = progress.total != null ? ` (total : ${progress.total})` : ''
      const newLine = `  Récupération de la page ${progress.progress} : ${progress.currentPage || ''}${proverbCount}${totalCount}...`
      if (newLine !== prevProgress) {
        console.log(newLine)
        prevProgress = newLine
      }
    } else if (progress.status === 'done' || progress.status === 'stopped') {
      const icon = progress.status === 'done' ? '✅' : '⚠️'
      console.log(`\n${icon} ${progress.status === 'done' ? 'Terminé !' : 'Arrêté !'}`)
      console.log(`  Total de proverbes : ${progress.total}`)
      console.log(`  Ajoutés : ${progress.added}`)
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
