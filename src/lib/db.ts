import 'dotenv/config'

if (process.env.NODE_ENV === 'development' && process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.includes('guibo.com')) {
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
}

import { PrismaClient } from '../generated/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
