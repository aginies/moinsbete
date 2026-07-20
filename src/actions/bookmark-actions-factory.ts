import type { BookmarkManager } from '@/lib/bookmark-manager'
import type { BookmarkManagerActions } from '@/actions/bookmark-manager'
import { createBookmarkManagerActions } from '@/actions/bookmark-manager'

export function createBookmarkActions<Doc extends { id: string }>(
  manager: BookmarkManager<Doc>,
): BookmarkManagerActions<Doc> {
  return createBookmarkManagerActions(manager)
}
