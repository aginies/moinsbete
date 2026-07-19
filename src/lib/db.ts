import 'dotenv/config'

if (process.env.NODE_ENV === 'development' && process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.includes('guibo.com')) {
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
}

import { PrismaClient } from '../generated/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (!globalForPrisma.prisma) {
  // SQLite Performance Optimizations
  prisma.$executeRawUnsafe('PRAGMA journal_mode=WAL;').catch(() => {})
  prisma.$executeRawUnsafe('PRAGMA synchronous=NORMAL;').catch(() => {})
  prisma.$executeRawUnsafe('PRAGMA busy_timeout=5000;').catch(() => {})
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
