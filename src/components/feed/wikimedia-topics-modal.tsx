'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, X, Check, Eye, EyeOff } from 'lucide-react'

interface Topic {
  id: string
  label: string
  icon: string
  searchTerms: string[]
  enabled: boolean
  active: boolean
  default: boolean
}

interface WikimediaTopicsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  topics: Topic[]
  activeTopics: string[]
  userId?: string
  onActiveTopicsChange: (topics: string[]) => void
  onToggleActive: (topicId: string) => void
  onRefresh?: () => Promise<void>
}

export function WikimediaTopicsModal({
  open,
  onOpenChange,
  topics,
  activeTopics,
  userId,
  onActiveTopicsChange,
  onToggleActive,
  onRefresh,
}: WikimediaTopicsModalProps) {
  const [localTopics, setLocalTopics] = useState<Topic[]>(topics)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newSearchTerms, setNewSearchTerms] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setLocalTopics(topics)
    setHasChanges(false)
  }, [topics, open])

  const markChanged = () => setHasChanges(true)

  const toggleActive = async (topicId: string) => {
    markChanged()
    onToggleActive(topicId)
    onActiveTopicsChange(
      activeTopics.includes(topicId)
        ? activeTopics.filter(id => id !== topicId)
        : [...activeTopics, topicId]
    )
  }

  const toggleEnabled = async (topicId: string) => {
    markChanged()
    const topic = localTopics.find(t => t.id === topicId)
    if (!topic) return
    
    setLocalTopics(prev =>
      prev.map(t =>
        t.id === topicId
          ? { ...t, enabled: !t.enabled }
          : t
      )
    )
    
    if (userId) {
      fetch('/api/wikimedia-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_enabled', topicId, enabled: topic.enabled }),
      }).catch(() => {})
    }
  }

  const addTopic = async () => {
    if (!newLabel.trim() || !newSearchTerms.trim()) return
    const terms = newSearchTerms.split(',').map(t => t.trim()).filter(Boolean)
    
    if (userId) {
      const res = await fetch('/api/wikimedia-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_custom', label: newLabel.trim(), icon: '📌', searchTerms: terms }),
      })
      if (res.ok) {
        markChanged()
        const data = await res.json()
        setLocalTopics(data.topics)
        setNewLabel('')
        setNewSearchTerms('')
        setShowAddForm(false)
        return
      }
    }
    
    markChanged()
    const newTopic: Topic = {
      id: `custom-${Date.now()}`,
      label: newLabel.trim(),
      icon: '📌',
      searchTerms: terms,
      enabled: true,
      active: true,
      default: false,
    }
    setLocalTopics(prev => [...prev, newTopic])
    setNewLabel('')
    setNewSearchTerms('')
    setShowAddForm(false)
  }

  const deleteTopic = async (topicId: string) => {
    markChanged()
    setLocalTopics(prev => prev.filter(t => t.id !== topicId))
    
    if (userId) {
      await fetch('/api/wikimedia-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_custom', topicId }),
      }).catch(() => {})
    }
  }

  const handleClose = () => {
    if (hasChanges && onRefresh) {
      onRefresh()
    }
    setHasChanges(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📂 Gérer les catégories Wikimedia</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mb-4">
          <p className="text-xs text-muted-foreground">
            Active/désactive les catégories affichées et utilisées pour la recherche.
          </p>
        </div>

        <div className="space-y-2">
          {localTopics.map(topic => (
            <div
              key={topic.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <span className="text-xl shrink-0">{topic.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{topic.label}</p>
                <p className="text-[10px] text-muted-foreground truncate" title={topic.searchTerms.join(', ')}>
                  {topic.searchTerms.slice(0, 3).join(', ')}{topic.searchTerms.length > 3 ? '…' : ''}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleActive(topic.id)}
                  className={`p-1.5 rounded-md transition-colors ${
                    activeTopics.includes(topic.id)
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                  title={activeTopics.includes(topic.id) ? 'Actif — cliquer pour désactiver' : 'Inactif — cliquer pour activer'}
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleEnabled(topic.id)}
                  className={`p-1.5 rounded-md transition-colors ${
                    topic.enabled
                      ? 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                  title={topic.enabled ? 'Visible — cliquer pour masquer' : 'Masqué — cliquer pour afficher'}
                >
                  {topic.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                {!topic.default && (
                  <button
                    type="button"
                    onClick={() => deleteTopic(topic.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {showAddForm ? (
          <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
            <div>
              <Label className="text-xs">Nom</Label>
              <Input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="Ma catégorie"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Mots-clés de recherche (séparés par virgule)</Label>
              <Input
                value={newSearchTerms}
                onChange={e => setNewSearchTerms(e.target.value)}
                placeholder="chat, kitten, feline"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addTopic}>
                <Plus className="h-4 w-4 mr-1" /> Ajouter
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                <X className="h-4 w-4 mr-1" /> Annuler
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Ajouter une catégorie
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
