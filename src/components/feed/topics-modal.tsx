'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'

export interface TopicBase {
  id: string
  label: string
  icon: string
  active: boolean
}

interface TopicsModalProps<T extends TopicBase> {
  open: boolean
  onOpenChange: (open: boolean) => void
  topics: T[]
  onToggleActive: (topicId: string) => void | Promise<void>
  title: string
  color: 'rose' | 'indigo'
}

const COLOR_MAP = {
  rose: {
    active: 'bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700',
  },
  indigo: {
    active: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700',
  },
}

export function TopicsModal<T extends TopicBase>({ open, onOpenChange, topics, onToggleActive, title, color }: TopicsModalProps<T>) {
  const t = useTranslations('feed')
  const [localTopics, setLocalTopics] = useState<T[]>(topics)
  const prevTopicsRef = useRef(topics)

  useEffect(() => {
    if (prevTopicsRef.current !== topics) {
      setLocalTopics(topics)
      prevTopicsRef.current = topics
    }
  }, [topics, open])

  const toggle = async (topicId: string) => {
    setLocalTopics(prev => prev.map(tp => tp.id === topicId ? { ...tp, active: !tp.active } : tp))
    await onToggleActive(topicId)
  }

  if (!open) return null

  const colors = COLOR_MAP[color]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 w-[90vw] sm:w-[500px] max-h-[80vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
        <button
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onOpenChange(false)}
          aria-label={t('close')}
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold mb-4 pr-8">{title}</h2>
        <div className="space-y-2">
          {localTopics.map(topic => (
            <button
              key={topic.id}
              onClick={() => toggle(topic.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                topic.active
                  ? colors.active
                  : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-gray-700 opacity-60'
              }`}
            >
              <span className="text-xl">{topic.icon}</span>
              <span className="text-sm font-medium">{topic.label}</span>
              <span className="ml-auto text-xs">{topic.active ? 'Actif' : 'Inactif'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
