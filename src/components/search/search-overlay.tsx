'use client'

import { useEffect } from 'react'
import { SearchBar } from './search-bar'

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  useEffect(() => {
    if (!isOpen) return

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <div
        className="fixed top-[56px] left-0 right-0 z-50 bg-background border-b border-border/40 shadow-lg"
      >
        <div className="mx-auto max-w-3xl px-4 py-4">
          <SearchBar onClose={onClose} />
        </div>
      </div>
    </>
  )
}
