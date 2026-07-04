import NextAuth, { AuthOptions } from 'next-auth'
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
      select: { id: true, email: true, displayName: true, role: true },
    })

    if (!user) {
      return null
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        role: user.role,
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  } catch {
    return null
  }
}

