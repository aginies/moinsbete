interface ImageData {
  imageUrl: string
  description: string
  fileUrl: string
  date: string
}

function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlDecode(str: string): string {
  let base64 = str
    .replace(/-/g, '/')
    .replace(/_/g, '=')
  while (base64.length % 4) {
    base64 += '='
  }
  return atob(base64)
}

export function encodeImageToUrl(imageData: ImageData): string {
  const json = JSON.stringify(imageData)
  return base64UrlEncode(json)
}

export function decodeImageFromUrl(encoded: string): ImageData | null {
  try {
    const json = base64UrlDecode(encoded)
    const data = JSON.parse(json) as ImageData
    if (data.imageUrl && data.description && data.fileUrl && data.date) {
      return data
    }
    return null
  } catch {
    return null
  }
}
