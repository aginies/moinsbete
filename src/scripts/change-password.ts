import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  const [email, newPassword] = process.argv.slice(2)

  if (!email || !newPassword) {
    console.log('Usage: tsx src/scripts/change-password.ts <email> <newPassword>')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    console.log(`User not found: ${email}`)
    process.exit(1)
  }

  const hash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { email },
    data: { passwordHash: hash },
  })

  console.log(`Password updated for: ${email}`)
}

main()
