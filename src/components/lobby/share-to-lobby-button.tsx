'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Share2, X, Search, User as UserIcon } from 'lucide-react'
import { shareResourceToLobby, unshareResourceFromLobby, isSharedResourceToLobby } from '@/actions/lobby-share-actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ShareToLobbyButtonProps {
  resourceId: string
  resourceType: string
  icon?: React.ReactNode
  className?: string
  meta?: Record<string, unknown>
}

interface User {
  id: string
  displayName: string | null
  email: string
  role: string
}

const RECENT_KEY = 'lobby_recent_shares'

function getRecentShares(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(RECENT_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function addRecentShare(userId: string) {
  if (typeof window === 'undefined') return
  try {
    const recent = getRecentShares().filter(id => id !== userId)
    recent.unshift(userId)
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 20)))
  } catch {
    // ignore
  }
}

function removeRecentShare(userId: string) {
  if (typeof window === 'undefined') return
  try {
    const recent = getRecentShares().filter(id => id !== userId)
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
  } catch {
    // ignore
  }
}

export function ShareToLobbyButton({ resourceId, resourceType, icon, className, meta }: ShareToLobbyButtonProps) {
  const [isShared, setIsShared] = useState(false)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [recentUserIds, setRecentUserIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [shareToCommunity, setShareToCommunity] = useState(false)
  const [checkingUserIds, setCheckingUserIds] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)
  const checkedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const key = `${resourceType}:${resourceId}`
    if (!checkedRef.current.has(key)) {
      checkedRef.current.add(key)
      isSharedResourceToLobby(resourceType, resourceId).then(setIsShared).catch(() => {})
    }
  }, [resourceType, resourceId])

  useEffect(() => {
    if (!open) return
    if (users.length > 0) return

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/lobby/users')
        const data = await res.json()
        setUsers(data.users || [])
      } catch {
        // ignore
      }
    }
    fetchUsers()
  }, [open, users.length])

  useEffect(() => {
    if (!open) return

    const fetchShareDetails = async () => {
      try {
        const res = await fetch('/api/lobby/share?resourceType=' + encodeURIComponent(resourceType) + '&resourceId=' + encodeURIComponent(resourceId) + '&details=true')
        const data = await res.json()
        setIsShared(data.shared || false)
        setShareToCommunity(data.shareToCommunity || false)
        setCheckingUserIds(new Set(data.sharedWithUserIds || []))
      } catch {
        // ignore
      }
    }
    fetchShareDetails()
  }, [open, resourceType, resourceId])

  useEffect(() => {
    setRecentUserIds(getRecentShares())
  }, [open])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const sortedUsers = useCallback((userList: User[]) => {
    const recentSet = new Set(recentUserIds)
    return [...userList].sort((a, b) => {
      const aRecent = recentSet.has(a.id) ? recentUserIds.indexOf(a.id) : 999
      const bRecent = recentSet.has(b.id) ? recentUserIds.indexOf(b.id) : 999
      return aRecent - bRecent
    })
  }, [recentUserIds])

  const filteredUsers = sortedUsers(users).filter(user => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (user.displayName || '').toLowerCase().includes(q) || user.email.toLowerCase().includes(q)
  })

  const toggleUser = useCallback((user: User) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.id === user.id)
      if (exists) {
        return prev.filter(u => u.id !== user.id)
      }
      return [...prev, user]
    })
  }, [])

  const handleToggle = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      if (isShared) {
        await unshareResourceFromLobby(resourceType, resourceId)
        setIsShared(false)
        setShareToCommunity(false)
        setSelectedUsers([])
        setCheckingUserIds(new Set())
        setUsers([])
        setSearchQuery('')
        setOpen(false)
        toast.success('Retiré du lobby')
      } else {
        await shareResourceToLobby(resourceType, resourceId, meta as any)
        setIsShared(true)
        setShareToCommunity(true)
        setOpen(false)
        toast.success('Partagé au lobby')
      }
    } catch {
      toast.error('Erreur lors du partage')
    } finally {
      setLoading(false)
    }
  }, [isShared, resourceId, resourceType, loading, meta])

  const handleShareToSelected = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      const userIds = selectedUsers.map(u => u.id)
      if (userIds.length > 0) {
        await shareResourceToLobby(resourceType, resourceId, meta as any, userIds)
      }
      setIsShared(true)
      setCheckingUserIds(new Set(userIds))
      setShareToCommunity(true)
      setSelectedUsers([])
      for (const userId of userIds) {
        addRecentShare(userId)
      }
      setRecentUserIds(getRecentShares())
      setOpen(false)
      toast.success('Partagé')
    } catch {
      toast.error('Erreur lors du partage')
    } finally {
      setLoading(false)
    }
  }, [loading, selectedUsers, resourceType, resourceId, meta])

  const handleUnshareFromUser = useCallback(async (userId: string) => {
    try {
      await unshareResourceFromLobby(resourceType, resourceId, userId)
      setCheckingUserIds(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
      setSelectedUsers(prev => prev.filter(u => u.id !== userId))
      removeRecentShare(userId)
      setRecentUserIds(getRecentShares())
      if (checkingUserIds.size <= 1 && !shareToCommunity) {
        const res = await fetch('/api/lobby/share?resourceType=' + encodeURIComponent(resourceType) + '&resourceId=' + encodeURIComponent(resourceId))
        const data = await res.json()
        setIsShared(data.shared || false)
      }
    } catch {
      toast.error('Erreur lors du retrait')
    }
  }, [resourceType, resourceId, checkingUserIds, shareToCommunity])

  const handleUnshareCommunity = useCallback(async () => {
    try {
      await unshareResourceFromLobby(resourceType, resourceId)
      setShareToCommunity(false)
      setSelectedUsers([])
      setCheckingUserIds(new Set())
      const res = await fetch('/api/lobby/share?resourceType=' + encodeURIComponent(resourceType) + '&resourceId=' + encodeURIComponent(resourceId))
      const data = await res.json()
      setIsShared(data.shared || false)
    } catch {
      toast.error('Erreur lors du retrait')
    }
  }, [resourceType, resourceId])

  const isAnyoneShared = isShared || checkingUserIds.size > 0 || shareToCommunity

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setSelectedUsers([])
      setSearchQuery('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <button
            type="button"
            className={cn(
              'rounded-full px-2 py-1.5 flex items-center gap-1 opacity-60 hover:opacity-100 hover:bg-muted transition-all',
              isAnyoneShared ? 'text-green-500' : 'text-muted-foreground',
              className || ''
            )}
            disabled={loading}
            title={isAnyoneShared ? 'Gérer le partage' : 'Partager au lobby'}
          >
            {icon || <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />}
            <span className="text-xs">Lobby</span>
          </button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="sr-only">Partager au lobby</DialogTitle>
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Partager au lobby</h3>

          {isAnyoneShared ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Share2 className="h-4 w-4 text-green-500" />
                <span>Partagé au lobby</span>
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={handleToggle} disabled={loading}>
                {loading ? '...' : 'Départager'}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>

              <button
                type="button"
                className="w-full flex items-center gap-2 rounded-md p-2 text-sm hover:bg-muted transition-colors text-left cursor-pointer"
                onClick={handleToggle}
              >
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">Tous les utilisateurs</p>
                  <p className="text-xs text-muted-foreground">Partager avec toute la communauté</p>
                </div>
              </button>

              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredUsers.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    className={cn(
                      'w-full flex items-center gap-2 rounded-md p-2 text-sm hover:bg-muted transition-colors text-left cursor-pointer border-l-2',
                      selectedUsers.find(u => u.id === user.id)
                        ? 'border-l-green-500 bg-muted'
                        : 'border-l-transparent'
                    )}
                    onClick={() => toggleUser(user)}
                  >
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium">{(user.displayName || user.email)[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.displayName || user.email}</p>
                    </div>
                    {recentUserIds.includes(user.id) && (
                      <Badge variant="outline" className="h-4 text-[10px] px-1">Récent</Badge>
                    )}
                    {selectedUsers.find(u => u.id === user.id) && (
                      <Badge variant="secondary" className="h-4 text-[10px] px-1">OK</Badge>
                    )}
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">Aucun utilisateur trouvé</p>
                )}
              </div>

              {selectedUsers.length > 0 && (
                <Button size="sm" className="w-full" onClick={handleShareToSelected}>
                  Partager avec {selectedUsers.length} utilisateur{selectedUsers.length > 1 ? 's' : ''}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
