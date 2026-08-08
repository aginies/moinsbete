'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteConfirmationDialogProps {
  suggestionTitle: string
  onConfirm: () => Promise<void>
  trigger: React.ReactNode
}

export function DeleteConfirmationDialog({ suggestionTitle, onConfirm, trigger }: DeleteConfirmationDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    await onConfirm()
    setIsDeleting(false)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div onClick={() => setIsOpen(true)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Supprimer la suggestion</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer « {suggestionTitle} » ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
