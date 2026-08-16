import { searchCommonsFiles, fetchCommonsImageInfo, type CommonsImage } from './wikimedia-commons'
import { shuffle } from './utils'

export async function findRandomCommonsImage(
  searchTerms: string[],
  onFound?: (image: CommonsImage) => Promise<void> | void,
  onSearch?: (term: string) => void,
): Promise<CommonsImage | null> {
  const shuffled = shuffle(searchTerms)

  for (const term of shuffled) {
    onSearch?.(term)
    const files = await searchCommonsFiles(term)
    if (files.length === 0) continue

    const shuffledFiles = shuffle(files)
    const maxAttempts = Math.min(shuffledFiles.length, 5)

    for (let i = 0; i < maxAttempts; i++) {
      const image = await fetchCommonsImageInfo(shuffledFiles[i])
      if (image && image.imageUrl) {
        await onFound?.(image)
        return image
      }
    }
  }

  return null
}
