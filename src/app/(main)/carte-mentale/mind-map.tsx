'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { IdeaModal } from './idea-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Minus, Search, X, Target } from 'lucide-react'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

interface MindMapProps {
  nodes: Array<{
    id: string
    label: string
    group: 'topic' | 'idea'
    color: string
    icon?: string
    size: number
    content?: string
    takeaway?: string
    slug?: string
  }>
  links: Array<{
    source: string
    target: string
  }>
}

export function MindMap({ nodes, links }: MindMapProps) {
  const fgRef = useRef<any>(null)
  const [selectedNode, setSelectedNode] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredNodes, setFilteredNodes] = useState(nodes)
  const [filteredLinks, setFilteredLinks] = useState(links)
  const [showSearch, setShowSearch] = useState(false)
  const [hasCentered, setHasCentered] = useState(false)

  const handleEngineStop = useCallback(() => {
    if (!hasCentered && fgRef.current) {
      fgRef.current.zoomToFit(400, 50)
      // Cap the zoom level to prevent zooming in too much when there are few elements
      setTimeout(() => {
        if (fgRef.current && fgRef.current.zoom() > 1.8) {
          fgRef.current.zoom(1.8, 200)
        }
      }, 450)
      setHasCentered(true)
    }
  }, [hasCentered])

  useEffect(() => {
    setHasCentered(false)
  }, [searchQuery, nodes.length, links.length])

  useEffect(() => {
    if (fgRef.current) {
      const chargeForce = fgRef.current.d3Force('charge')
      if (chargeForce) {
        chargeForce.distanceMax(100)
      }
      const linkForce = fgRef.current.d3Force('link')
      if (linkForce) {
        linkForce.distance(100)
      }
    }
  }, [nodes.length, links.length])

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchedNodes = nodes.filter(n => n.label.toLowerCase().includes(query))
      const matchedIds = new Set(matchedNodes.map(n => n.id))
      const matchedLinks = links.filter(l => matchedIds.has(l.source) && matchedIds.has(l.target))
      setFilteredNodes(matchedNodes)
      setFilteredLinks(matchedLinks)
    } else {
      setFilteredNodes(nodes)
      setFilteredLinks(links)
    }
  }, [searchQuery, nodes, links])

  const handleNodeClick = useCallback((node: any) => {
    if (node.group === 'idea') {
      setSelectedNode(node)
    }
  }, [])

  const handleZoomIn = useCallback(() => {
    const fg = fgRef.current
    if (fg) {
      const zoom = fg.zoom()
      fg.zoom(zoom + 0.3)
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    const fg = fgRef.current
    if (fg) {
      const zoom = fg.zoom()
      fg.zoom(zoom - 0.3)
    }
  }, [])

  const [cursorStyle, setCursorStyle] = useState<'pointer' | 'grab'>('grab')

  const handleNodeHover = useCallback((node: any) => {
    setCursorStyle(node ? 'pointer' : 'grab')
  }, [])

  // Calculate degrees (number of connections) to size the topic halos dynamically
  const nodeDegrees = useMemo(() => {
    const degrees = new Map<string, number>()
    filteredLinks.forEach(l => {
      const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source
      const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target
      degrees.set(sourceId, (degrees.get(sourceId) || 0) + 1)
      degrees.set(targetId, (degrees.get(targetId) || 0) + 1)
    })
    return degrees
  }, [filteredLinks])

  // Sort nodes so topics are drawn first (in the background), meaning halos sit behind ideas
  const sortedNodes = useMemo(() => {
    return [...filteredNodes].sort((a, b) => {
      if (a.group === 'topic' && b.group !== 'topic') return -1
      if (a.group !== 'topic' && b.group === 'topic') return 1
      return 0
    })
  }, [filteredNodes])

  return (
    <div className="relative">
      <div className="h-[70vh] w-full rounded-lg border bg-card" style={{ cursor: cursorStyle }}>
        <ForceGraph2D
          ref={fgRef}
          graphData={{ nodes: sortedNodes, links: filteredLinks }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const size = node.size || 10
            const isTopic = node.group === 'topic'
            const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
            const nodeX = node.x ?? 0
            const nodeY = node.y ?? 0

            // 0. Draw Topic Halo (Bubble) behind everything
            if (isTopic) {
              const degree = nodeDegrees.get(node.id ? String(node.id) : '') || 1
              // Base radius + extra padding per connected idea
              const haloRadius = (size / 2) + 25 + (degree * 4.5)
              
              ctx.save()
              ctx.beginPath()
              ctx.arc(nodeX, nodeY, haloRadius, 0, 2 * Math.PI, false)
              ctx.fillStyle = node.color || '#6b7280'
              ctx.globalAlpha = isDarkMode ? 0.12 : 0.08
              ctx.fill()
              // Soft border for the halo
              ctx.lineWidth = 1 / globalScale
              ctx.strokeStyle = node.color || '#6b7280'
              ctx.globalAlpha = isDarkMode ? 0.3 : 0.2
              ctx.stroke()
              ctx.restore()
            }

            // 1. Draw node circle
            ctx.beginPath()
            ctx.arc(nodeX, nodeY, size / 2, 0, 2 * Math.PI, false)
            ctx.fillStyle = node.color || '#6b7280'
            ctx.fill()

            // Circle border
            ctx.strokeStyle = isDarkMode ? '#1e293b' : '#ffffff'
            ctx.lineWidth = 1.5 / globalScale
            ctx.stroke()

            // 2. Draw topic emoji inside
            if (isTopic && node.icon) {
              ctx.font = `${size * 0.55}px sans-serif`
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText(node.icon, nodeX, nodeY)
            }

            // 3. Draw text label below node
            // Only draw text if we are zoomed in enough to prevent cluttering
            if (globalScale > 0.25) {
              const fontSize = isTopic ? 12 / globalScale : 9 / globalScale
              ctx.font = `${isTopic ? 'bold' : 'normal'} ${fontSize}px sans-serif`
              ctx.textAlign = 'center'
              ctx.textBaseline = 'top'
              ctx.fillStyle = isDarkMode ? '#e2e8f0' : '#1e293b'

              const label = node.label || ''
              const textY = nodeY + (size / 2) + (3 / globalScale)

              // Text wrapping
              const maxLineLength = isTopic ? 12 : 20
              const words = label.split(' ')
              let currentLine = ''
              const lines = []

              for (const word of words) {
                if ((currentLine + ' ' + word).length > maxLineLength) {
                  if (currentLine) lines.push(currentLine.trim())
                  currentLine = word
                } else {
                  currentLine += ' ' + word
                }
              }
              if (currentLine) lines.push(currentLine.trim())

              const maxLines = isTopic ? 2 : 2
              const displayedLines = lines.slice(0, maxLines)
              if (lines.length > maxLines) {
                displayedLines[maxLines - 1] += '...'
              }

              const lineHeight = fontSize * 1.15
              displayedLines.forEach((line, index) => {
                ctx.fillText(line, nodeX, textY + index * lineHeight)
              })
            }
          }}
          linkColor={() => '#94a3b8'}
          linkWidth={1.5}
          linkCurvature={0.2}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          backgroundColor="transparent"
          cooldownTicks={100}
          enablePanInteraction={true}
          enableZoomInteraction={true}
          onEngineStop={handleEngineStop}
        />
      </div>

      <div className="absolute right-4 top-4 flex flex-col gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomIn}
          className="bg-card/90 backdrop-blur"
          title="Zoomer"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomOut}
          className="bg-card/90 backdrop-blur"
          title="Dézoomer"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (fgRef.current) {
              fgRef.current.zoomToFit(400, 50)
              setTimeout(() => {
                if (fgRef.current && fgRef.current.zoom() > 1.8) {
                  fgRef.current.zoom(1.8, 200)
                }
              }, 450)
            }
          }}
          className="bg-card/90 backdrop-blur"
          title="Recentrer"
        >
          <Target className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowSearch(!showSearch)}
          className="bg-card/90 backdrop-blur"
          title="Rechercher"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {showSearch && (
        <div className="absolute right-4 top-16 w-64">
          <div className="relative">
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card/90 backdrop-blur pr-8"
              autoFocus
            />
            {searchQuery && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {selectedNode && (
        <IdeaModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  )
}
