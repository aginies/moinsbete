'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface LobbyHeaderProps {
  isLoggedIn: boolean
}

export function LobbyHeader({ isLoggedIn }: LobbyHeaderProps) {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'favoris'

  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Lobby</h1>
      </div>
      {isLoggedIn && activeTab === 'discuter' && (
        <Link href="/lobby/new">
          <span className="text-sm text-primary hover:underline">Proposer un sujet</span>
        </Link>
      )}
    </div>
  )
}
