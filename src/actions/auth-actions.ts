'use server'

import { signIn, signOut } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

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

  await signIn('credentials', {
    email,
    password,
    redirect: false,
  })

  return { success: true }
}

export async function loginAction(formData: {
  email: string
  password: string
}) {
  try {
    await signIn('credentials', {
      email: formData.email,
      password: formData.password,
      redirect: false,
    })
    return { success: true }
  } catch {
    return { error: 'Email ou mot de passe incorrect' }
  }
}

export async function logoutAction() {
  await signOut({ redirect: false })
}
