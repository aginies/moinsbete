import NextAuth, { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getServerSession } from 'next-auth/next'
import { prisma } from './db'
import bcrypt from 'bcryptjs'
import { decode } from 'next-auth/jwt'
import { cookies } from 'next/headers'

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

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          role: user.role,
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
    jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.sub = user.id
        token.role = (user as any).role
      }
      return token
    },
    session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}

export const { handlers } = NextAuth(authOptions)

export async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('__Secure-next-auth.session-token') || cookieStore.get('next-auth.session-token')
  if (!sessionCookie) {
    console.log('[getSession] No session cookie found')
    return null
  }

  const secret = process.env.NEXTAUTH_SECRET || 'k9sF2mNpQ7xR4wL8vB3jH6tY0cA5dE1gI9oU2iP7aS4fG'
  try {
    const token = await decode({
      token: sessionCookie.value,
      secret,
    })

    if (!token?.sub) {
      console.log('[getSession] Token has no sub:', token)
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { role: true },
    })

    return {
      user: {
        id: token.sub,
        email: token.email as string,
        name: token.name as string,
        role: user?.role ?? 'USER',
      },
      expires: token.exp ? new Date((token.exp as number) * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  } catch (err) {
    console.error('[getSession] decode error:', err.message)
    return null
  }
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return null
  return { id: user.id, email: user.email, name: user.displayName }
}
