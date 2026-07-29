import { CitationsPageClient } from './citations-page-client'
import { getSession } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function CitationsPage() {
  const session = await getSession()
  const t = await getTranslations('pages.citations')
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'fr'

  return (
    <CitationsPageClient
      userId={session?.user?.id}
      title={t('title')}
      locale={locale}
    />
  )
}
