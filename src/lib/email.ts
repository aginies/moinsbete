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

export async function sendShareNotificationEmail(to: string, toName: string, sharerName: string, title: string, resourceType?: string) {
  console.log('[EMAIL] sendShareNotificationEmail:', { to, toName, sharerName, title, resourceType })

  const lobbyUrl = 'https://moinsbete.guibo.com/fr/lobby?tab=partage'
  const accountUrl = 'https://moinsbete.guibo.com/fr/mon-compte'

  const typeLabels: Record<string, string> = {
    NEWS: 'un article',
    SAVIEZ_VOUS: 'un fait saviez-vous',
    IMAGE_DU_JOUR: 'une image du jour',
    IMAGE_WIKIMEDIA: 'une image Wikimedia',
    IMAGE_WIKILOVES: 'une image Wiki Loves',
    PROVERBE: 'un proverbe',
    IDEA: 'une idée',
  }
  const contentType = typeLabels[resourceType || ''] || 'un contenu'

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `${sharerName} vous a partagé ${contentType} sur MoinsBête`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <p>Bonjour ${toName},</p>
          <p><strong>${sharerName}</strong> vous a partagé ${contentType} :</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 6px;">
            <p style="margin: 0; color: #333;">"${title}"</p>
          </div>
          <div style="margin: 30px 0;">
            <a href="${lobbyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 6px;">
              Voir le lobby
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Vous ne souhaitez plus recevoir ces notifications ? Désactivez-les dans <a href="${accountUrl}" style="color: #0070f3;">Mon compte</a>.
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send share notification email:', error)
    return { success: false, error }
  }
}
