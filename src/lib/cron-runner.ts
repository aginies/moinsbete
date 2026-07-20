import cron, { ScheduledTask } from 'node-cron'

const CRON_SCHEDULE = '0 4 * * *'
const API_URL = process.env.NEXTAUTH_URL 
  ? `${process.env.NEXTAUTH_URL}/api/cron/cache`
  : `http://localhost:3000/api/cron/cache`

let isRunning = false
let task: ScheduledTask | null = null

async function runCron() {
  if (isRunning) {
    console.log('[cron] Cron already running, skipping')
    return
  }
  
  isRunning = true
  console.log(`[cron] Running cache cron at ${new Date().toISOString()}...`)
  
  try {
    const res = await fetch(API_URL, {
      headers: { 'X-Forwarded-For': '127.0.0.1' },
    })
    
    if (res.ok) {
      const data = await res.json()
      console.log(`[cron] Cache cron completed: ${JSON.stringify(data)}`)
    } else {
      console.error(`[cron] Cache cron failed with status ${res.status}`)
    }
  } catch (error) {
    console.error(`[cron] Cache cron error:`, error)
  } finally {
    isRunning = false
  }
}

export function startCron() {
  if (task) {
    console.log('[cron] Cron already started')
    return task
  }
  
  task = cron.schedule(CRON_SCHEDULE, runCron, {
    timezone: 'Europe/Paris',
  })
  
  console.log(`[cron] Cron started: ${CRON_SCHEDULE} (Europe/Paris) -> ${API_URL}`)
  
  return task
}

export function stopCron() {
  if (task) {
    task.stop()
    task = null
    console.log('[cron] Cron stopped')
  }
}

// Auto-start on import (singleton)
startCron()
