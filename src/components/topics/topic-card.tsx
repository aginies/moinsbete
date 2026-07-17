'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { toast } from 'sonner'
import { Topic } from '@/generated/client'
import { toggleTopic } from '@/actions/bookmark-actions'

interface TopicCardProps {
  topic: Topic & {
    _count?: { ideas: number }
    children?: Topic[]
  }
  isFollowing?: boolean
  onToggle?: () => void
  isAuthenticated?: boolean
  allSelected?: boolean
}

export const TopicCard = React.memo(function TopicCardInner({ topic, isFollowing: initialFollowing = false, onToggle, isAuthenticated, allSelected }: TopicCardProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    if (!isAuthenticated) {
      toast('Connectez-vous pour suivre un sujet, ajouter des favoris, voir uniquement les fiches que vous n\'avez pas vues, et consulter votre historique.', {
        action: {
          label: 'Connexion',
          onClick: () => window.location.href = '/login',
        },
      })
      return
    }
    setLoading(true)
    const newState = allSelected ? false : !following
    setFollowing(newState)
    
    const result = await toggleTopic(topic.id)
    if (result.error) {
      console.error('[TopicCard] Toggle error:', result.error)
      setFollowing(following)
    } else {
      onToggle?.()
    }
    setLoading(false)
  }

  return (
    <div className={`group rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-border hover:shadow-md ${following ? '' : 'opacity-75'}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{topic.icon}</span>
          <Link href={`/sujets/${topic.slug}`} className="font-heading font-semibold text-foreground group-hover:text-primary">
            {topic.name}
          </Link>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={`rounded-full p-2 transition-colors hover:bg-muted ${following ? 'text-primary' : 'text-muted-foreground'} ${loading ? 'animate-pulse' : ''}`}
        >
          <Bookmark className={`h-5 w-5 ${following ? 'fill-current' : ''}`} />
        </button>
      </div>

      {topic.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {topic.description}
        </p>
      )}

      {topic.children && topic.children.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {topic.children.slice(0, 3).map((child) => (
            <span
              key={child.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground"
            >
              {child.icon} {child.name}
            </span>
          ))}
          {topic.children.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{topic.children.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )
})
