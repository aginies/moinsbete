'use server'

import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { encode, decode } from 'next-auth/jwt'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function registerAction(formData: {
  email: string
  password: string
  displayName: string
}) {
  const { email, password, displayName } = formData

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
    secret: process.env.NEXTAUTH_SECRET || 'stashfru-secret-change-in-production',
    maxAge: 30 * 24 * 60 * 60,
  })

  // Set session cookie
  const cookieStore = await cookies()
  const cookieName = 'next-auth.session-token'
  const cookieExpires = new Date()
  cookieExpires.setTime(cookieExpires.getTime() + 30 * 24 * 60 * 60 * 1000)

  cookieStore.set(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: false,
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

  if (newPassword.length < 6) {
    return { error: 'Le mot de passe doit contenir au moins 6 caractères' }
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
