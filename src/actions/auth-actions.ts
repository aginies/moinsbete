'use server'

import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { encode, decode } from 'next-auth/jwt'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { headers } from 'next/headers'
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_REGISTER_MAX, RATE_LIMIT_LOGIN_MAX, SESSION_COOKIE_MAX_AGE_MS, SESSION_MAX_AGE_SECONDS } from '@/lib/constants'

export async function registerAction(formData: {
  email: string
  password: string
  displayName: string
}) {
  const { email, password, displayName } = formData

  const headersList = await headers()
  const clientId = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  if (!checkRateLimit(`register:${clientId}`, RATE_LIMIT_REGISTER_MAX, RATE_LIMIT_WINDOW_MS)) {
    return { error: 'Trop de tentatives. Réessayez dans 60 secondes.' }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'Cet email est déjà utilisé' }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName,
    },
  })

  return { success: true }
}

export async function loginAction(formData: {
  email: string
  password: string
}) {
  const headersList = await headers()
  const clientId = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  if (!checkRateLimit(`login:${clientId}`, RATE_LIMIT_LOGIN_MAX, RATE_LIMIT_WINDOW_MS)) {
    return { error: 'Trop de tentatives. Réessayez dans 60 secondes.' }
  }

  const user = await prisma.user.findUnique({ where: { email: formData.email } })

  if (!user) {
    return { error: 'Email ou mot de passe incorrect' }
  }

  const isValid = await bcrypt.compare(formData.password, user.passwordHash)

  if (!isValid) {
    return { error: 'Email ou mot de passe incorrect' }
  }

  // Create JWT token
  const token = await encode({
    token: {
      id: user.id,
      name: user.displayName,
      email: user.email,
      picture: undefined,
      sub: user.id,
    },
    secret: process.env.NEXTAUTH_SECRET || 'k9sF2mNpQ7xR4wL8vB3jH6tY0cA5dE1gI9oU2iP7aS4fG',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })

  // Set session cookie
  const cookieStore = await cookies()
  const cookieName = process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
  const cookieExpires = new Date()
  cookieExpires.setTime(cookieExpires.getTime() + SESSION_COOKIE_MAX_AGE_MS)

  cookieStore.set(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    expires: cookieExpires,
  })

  return { success: true }
}

export async function logoutAction(formData?: FormData) {
  const cookieStore = await cookies()
  const cookieName = 'next-auth.session-token'
  
  cookieStore.delete(cookieName)
  
  return { success: true }
}

export async function changePasswordAction(formData: FormData) {
  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string

  if (newPassword.length < 8) {
    return { error: 'Le mot de passe doit contenir au moins 8 caractères' }
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { error: 'Non connecté' }
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id as string } })
  if (!user) {
    return { error: 'Utilisateur non trouvé' }
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isValid) {
    return { error: 'Mot de passe actuel incorrect' }
  }

  const newHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  })

  return { success: true }
}
