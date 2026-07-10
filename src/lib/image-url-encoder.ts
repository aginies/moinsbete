interface ImageData {
  imageUrl: string
  description: string
  fileUrl: string
  date: string
}

function base64UrlEncode(str: string): string {
  // Convert UTF-8 characters to safe 8-bit representation before encoding
  const utf8Bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
    return String.fromCharCode(parseInt(p1, 16))
  })
  
  return btoa(utf8Bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlDecode(str: string): string {
  let base64 = str
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    
  while (base64.length % 4) {
    base64 += '='
  }
  
  const raw = atob(base64)
  
  // Convert 8-bit representation back to UTF-8 characters
  return decodeURIComponent(
    Array.prototype.map.call(raw, (c: string) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join('')
  )
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
