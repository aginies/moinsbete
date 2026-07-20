import type { UserRole as PrismaUserRole } from '@/generated/client'

import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: PrismaUserRole
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: PrismaUserRole
  }
}
