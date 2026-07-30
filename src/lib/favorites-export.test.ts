import { describe, it, expect } from 'vitest'
import { exportFavoritesToHtml, type ExportBookmarkItem } from './favorites-export'

function makeItem(overrides: Partial<ExportBookmarkItem> = {}): ExportBookmarkItem {
  return {
    type: 'IDEA',
    title: 'Test Idea',
    description: 'Test description',
    url: 'https://example.com',
    imageUrl: null,
    favoritedAt: '2025-01-15T10:00:00.000Z',
    meta: null,
    ...overrides,
  }
}

describe('exportFavoritesToHtml', () => {
  it('returns valid HTML document', () => {
    const items: ExportBookmarkItem[] = [makeItem()]
    const html = exportFavoritesToHtml(items, new Date('2025-01-15T12:00:00.000Z'))
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<html lang="fr">')
    expect(html).toContain('</html>')
  })

  it('includes export date in header', () => {
    const exportDate = new Date('2025-07-15T14:30:00.000Z')
    const items: ExportBookmarkItem[] = [makeItem()]
    const html = exportFavoritesToHtml(items, exportDate)
    expect(html).toContain('Exporté le')
  })

  it('includes footer with moinsbete.guibo.com link', () => {
    const items: ExportBookmarkItem[] = [makeItem()]
    const html = exportFavoritesToHtml(items, new Date())
    expect(html).toContain('moinsbete.guibo.com')
    expect(html).toContain('MoinsBête')
  })

  it('escapes HTML special characters in title', () => {
    const items: ExportBookmarkItem[] = [makeItem({ title: 'Test & "Quote" <Tag>' })]
    const html = exportFavoritesToHtml(items, new Date())
    expect(html).toContain('&amp;')
    expect(html).toContain('&quot;')
    expect(html).toContain('&lt;')
  })

  it('escapes HTML special characters in description', () => {
    const items: ExportBookmarkItem[] = [makeItem({ description: 'A <div> & more' })]
    const html = exportFavoritesToHtml(items, new Date())
    expect(html).toContain('&lt;div&gt;')
    expect(html).toContain('&amp;')
  })

  it('generates tab links for each category', () => {
    const items: ExportBookmarkItem[] = [
      makeItem({ type: 'IDEA' }),
      makeItem({ type: 'CNRS_NEWS' }),
    ]
    const html = exportFavoritesToHtml(items, new Date())
    expect(html).toContain('href="#idees"')
    expect(html).toContain('href="#cnrs-news"')
  })

  it('generates section divs for each category', () => {
    const items: ExportBookmarkItem[] = [
      makeItem({ type: 'IDEA' }),
      makeItem({ type: 'CNRS_NEWS' }),
    ]
    const html = exportFavoritesToHtml(items, new Date())
    expect(html).toContain('id="idees"')
    expect(html).toContain('id="cnrs-news"')
  })

  it('includes favorited date', () => {
    const items: ExportBookmarkItem[] = [makeItem({ favoritedAt: '2025-01-15T10:00:00.000Z' })]
    const html = exportFavoritesToHtml(items, new Date())
    expect(html).toContain('Favori le')
  })

  it('includes image when provided', () => {
    const items: ExportBookmarkItem[] = [makeItem({ imageUrl: 'https://example.com/img.jpg' })]
    const html = exportFavoritesToHtml(items, new Date())
    expect(html).toContain('<img src="https://example.com/img.jpg"')
  })

  it('includes link to original', () => {
    const items: ExportBookmarkItem[] = [makeItem({ url: 'https://example.com/article' })]
    const html = exportFavoritesToHtml(items, new Date())
    expect(html).toContain('href="https://example.com/article"')
  })

  it('handles empty items array', () => {
    const html = exportFavoritesToHtml([], new Date())
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('</html>')
  })

  it('includes bookmark type badge', () => {
    const items: ExportBookmarkItem[] = [makeItem({ type: 'IDEA' })]
    const html = exportFavoritesToHtml(items, new Date())
    expect(html).toContain('IDEA')
  })

  it('uses dark mode media query', () => {
    const items: ExportBookmarkItem[] = [makeItem()]
    const html = exportFavoritesToHtml(items, new Date())
    expect(html).toContain('prefers-color-scheme: dark')
  })

  it('includes CSS print styles', () => {
    const items: ExportBookmarkItem[] = [makeItem()]
    const html = exportFavoritesToHtml(items, new Date())
    expect(html).toContain('@media print')
  })

  it('includes dark mode CSS with .dark class', () => {
    const items: ExportBookmarkItem[] = [makeItem()]
    const html = exportFavoritesToHtml(items, new Date())
    expect(html).toContain('html.dark {')
    expect(html).toContain('html:not(.light)')
  })

  it('includes theme toggle button', () => {
    const items: ExportBookmarkItem[] = [makeItem()]
    const html = exportFavoritesToHtml(items, new Date())
    expect(html).toContain('id="theme-toggle"')
    expect(html).toContain('theme-toggle')
  })

  it('includes theme toggle JS', () => {
    const items: ExportBookmarkItem[] = [makeItem()]
    const html = exportFavoritesToHtml(items, new Date())
    expect(html).toContain('localStorage.getItem(\'export-theme\')')
    expect(html).toContain('localStorage.setItem(\'export-theme\'')
    expect(html).toContain('classList.add(\'dark\')')
    expect(html).toContain('classList.remove(\'dark\')')
  })
})
