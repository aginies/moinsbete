import { NextResponse } from 'next/server'
import cron from 'node-cron'

export async function GET() {
  const schedule = '0 6,12,15,16,21 * * *'
  const task = cron.schedule(schedule, () => {})
  
  const nextRuns = task.getNextRuns(5).map(d => d.toISOString())
  
  task.stop()
  
  return NextResponse.json({
    schedule,
    timezone: 'Europe/Paris',
    nextRuns,
    now: new Date().toISOString(),
    status: 'ok'
  })
}
