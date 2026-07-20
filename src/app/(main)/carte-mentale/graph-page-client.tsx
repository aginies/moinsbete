'use client'

import { useState, useEffect } from 'react'
import { MindMap } from './mind-map'

interface GraphPageClientProps {
  userId: string
}

export function GraphPageClient({ userId }: GraphPageClientProps) {
  const [nodes, setNodes] = useState<any[]>([])
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadGraph() {
      setLoading(true)
      try {
        const response = await fetch(`/api/graph?limit=200`)
        const data = await response.json()
        if (data.error) {
          setError(data.error)
        } else {
          setNodes(data.nodes)
          setLinks(data.links)
        }
      } catch {
        setError('Erreur lors du chargement de la carte')
      } finally {
        setLoading(false)
      }
    }

    loadGraph()
  }, [userId])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Chargement de la carte mentale...</p>
      </div>
    )
  }

  if (error || nodes.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-lg text-muted-foreground">
          {error || 'Aucun historique — lisez des idées pour voir votre carte mentale'}
        </p>
      </div>
    )
  }

  return <MindMap nodes={nodes} links={links} />
}
