'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

interface LobbyHeaderProps {
  isLoggedIn: boolean
}

export function LobbyHeader({ isLoggedIn }: LobbyHeaderProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const activeTab = searchParams.get('tab') || 'favoris'

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Lobby</h1>
        <p className="text-sm text-muted-foreground">Proposez des sujets, commentez et partagez des idées</p>
      </div>
      {isLoggedIn && activeTab === 'discuter' && (
        <Link href="/lobby/new">
          <span className="text-sm text-primary hover:underline">Proposer un sujet</span>
        </Link>
      )}
    </div>
  )
}
