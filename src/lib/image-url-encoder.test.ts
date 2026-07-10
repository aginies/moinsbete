import { describe, it, expect } from 'vitest'
import { encodeImageToUrl, decodeImageFromUrl } from './image-url-encoder'

describe('Image URL Encoder', () => {
  const sampleASCII = {
    imageUrl: 'https://example.com/image.jpg',
    description: 'A beautiful sunny day with clear blue sky.',
    fileUrl: 'https://example.com/file.jpg',
    date: '2026-07-10',
  }

  const sampleFrench = {
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Image.jpg',
    description: 'Une magnifique journée ensoleillée avec un ciel bleu très clair, des nuages et un château d\'eau.',
    fileUrl: 'https://commons.wikimedia.org/wiki/File:Image.jpg',
    date: '10 juillet 2026',
  }

  it('successfully encodes and decodes standard ASCII data', () => {
    const encoded = encodeImageToUrl(sampleASCII)
    expect(encoded).toBeTypeOf('string')
    expect(encoded).not.toContain('+')
    expect(encoded).not.toContain('/')
    expect(encoded).not.toContain('=')

    const decoded = decodeImageFromUrl(encoded)
    expect(decoded).toEqual(sampleASCII)
  })

  it('successfully encodes and decodes French/UTF-8 data with accents', () => {
    const encoded = encodeImageToUrl(sampleFrench)
    expect(encoded).toBeTypeOf('string')
    expect(encoded).not.toContain('+')
    expect(encoded).not.toContain('/')
    expect(encoded).not.toContain('=')

    const decoded = decodeImageFromUrl(encoded)
    expect(decoded).toEqual(sampleFrench)
  })

  it('handles invalid or corrupted encoded strings gracefully by returning null', () => {
    // Completely invalid base64
    expect(decodeImageFromUrl('invalid-base64-string!@#')).toBeNull()

    // Valid base64 but invalid JSON structure
    const badJsonBase64 = btoa('{"invalid":"json"}')
    expect(decodeImageFromUrl(badJsonBase64)).toBeNull()

    // Valid JSON but missing required fields
    const missingFieldsJson = btoa(JSON.stringify({ imageUrl: 'https://ex.com' }))
    expect(decodeImageFromUrl(missingFieldsJson)).toBeNull()
  })
})
