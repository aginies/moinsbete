'use client'

import { useState, useEffect } from 'react'
import { createTopicAction, updateTopicAction, deleteTopicAction } from '@/actions/topic-actions'
import { Topic } from '@/generated/prisma'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getRandomIcon, getRandomColor } from '@/lib/utils'
import { toast } from 'sonner'

interface TopicFormProps {
  topic?: Topic | null
  topics: Topic[]
  onSubmit: () => void
}

export function TopicForm({ topic, topics, onSubmit }: TopicFormProps) {
  const [name, setName] = useState(topic?.name || '')
  const [icon, setIcon] = useState(topic?.icon || getRandomIcon())
  const [description, setDescription] = useState(topic?.description || '')
  const [color, setColor] = useState(topic?.color || getRandomColor())
  const [parentId, setParentId] = useState(topic?.parentId || '')
  const [loading, setLoading] = useState(false)

  const rootTopics = topics.filter(t => !t.parentId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (topic) {
        await updateTopicAction(topic.id, {
          name,
          icon,
          description,
          color,
          parentId: parentId || null,
        })
        toast.success('Sujet mis à jour')
      } else {
        await createTopicAction({ name, icon, description, color, parentId: parentId || undefined })
        toast.success('Sujet créé')
      }

      setName('')
      setDescription('')
      setParentId('')
      setIcon(getRandomIcon())
      setColor(getRandomColor())
      onSubmit()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce sujet ?')) return

    try {
      await deleteTopicAction(id)
      toast.success('Sujet supprimé')
      onSubmit()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border/60 bg-card p-6">
        <h3 className="text-lg font-semibold">
          {topic ? 'Modifier le sujet' : 'Nouveau sujet'}
        </h3>

        <div className="space-y-2">
          <Label htmlFor="name">Nom du sujet</Label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Intelligence artificielle"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="icon">Icône (emoji)</Label>
            <Input
              id="icon"
              value={icon}
              onChange={e => setIcon(e.target.value)}
              placeholder="🤖"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Couleur</Label>
            <Input
              id="color"
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description du sujet..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="parent">Sujet parent (optionnel)</Label>
          <select
            id="parent"
            value={parentId}
            onChange={e => setParentId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Aucun (sujet racine)</option>
            {rootTopics.map(t => (
              <option key={t.id} value={t.id}>
                {t.icon} {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Sauvegarde...' : topic ? 'Mettre à jour' : 'Créer le sujet'}
          </Button>
          {topic && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setName(topic.name)
                setIcon(topic.icon)
                setDescription(topic.description || '')
                setColor(topic.color)
                setParentId(topic.parentId || '')
              }}
            >
              Annuler
            </Button>
          )}
        </div>
      </form>

      {topic && (
        <Button
          variant="destructive"
          onClick={() => handleDelete(topic.id)}
          className="w-full"
        >
          Supprimer ce sujet
        </Button>
      )}
    </div>
  )
}
