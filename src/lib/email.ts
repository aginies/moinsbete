import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const EMAIL_FROM = process.env.EMAIL_FROM || 'Moins Bete <noreply@moinsbete.com>'

export async function sendResetEmail(to: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password/${token}`

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
          <p>Bonjour,</p>
          <p>Vous avez demandé une réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour en définir un nouveau :</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 6px;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Ce lien expire dans 1 heure.</p>
          <p style="color: #666; font-size: 14px;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send reset email:', error)
    return { success: false, error }
  }
}
