import { AuthOptions, JWT } from 'next-auth'
import { Session } from 'next-auth/core/types'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { decode } from 'next-auth/jwt'

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        let email = ''
        let password = ''

        if (typeof credentials === 'object' && !Array.isArray(credentials) && credentials !== null) {
          email = (credentials as { email?: unknown }).email as string || ''
          password = (credentials as { password?: unknown }).password as string || ''
        }

        if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email },
        })

        // Timing-constant: always run bcrypt.compare
        const defaultHash = '$2a$12$' + '0'.repeat(53)
        const compareHash = user?.passwordHash ?? defaultHash
        const isPasswordValid = await bcrypt.compare(password, compareHash)

        if (!isPasswordValid) {
          return null
        }

        if (!user?.enabled) {
          return null
        }

        return {
          id: user!.id,
          email: user!.email,
          name: user!.displayName,
          role: user!.role,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt: async ({ token, user }: { token: JWT; user?: { id: string; role?: string } }) => {
      if (user) {
        token.sub = user.id
        token.role = user.role
      }
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { enabled: true },
        })
        if (!dbUser?.enabled) {
          return null
        }
      }
      return token
    },
    session: ({ session, token }: { session: Session; token: JWT }) => {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('__Secure-next-auth.session-token') || cookieStore.get('next-auth.session-token')
  
  if (!sessionCookie) {
    return null
  }

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    return null
  }

  try {
    const session = await decode({
      token: sessionCookie.value,
      secret,
    })

    if (!session?.sub) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, email: true, displayName: true, role: true, enabled: true },
    })

    if (!user || !user.enabled) {
      return null
    }

    const expires = (session.exp && typeof session.exp === 'number')
      ? new Date(session.exp * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        role: user.role,
      },
      expires,
    }
  } catch {
    return null
  }
}

