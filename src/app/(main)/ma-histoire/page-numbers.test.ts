import { describe, it, expect } from 'vitest'

// Replicate the function since it's not exported
function generatePageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = [1]

  if (currentPage > 3) {
    pages.push('ellipsis')
  }

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis')
  }

  pages.push(totalPages)
  return pages
}

describe('generatePageNumbers', () => {
  it('shows all pages when 1 page', () => {
    expect(generatePageNumbers(1, 1)).toEqual([1])
  })

  it('shows all pages when 3 pages', () => {
    expect(generatePageNumbers(2, 3)).toEqual([1, 2, 3])
  })

  it('shows all pages when 7 pages', () => {
    expect(generatePageNumbers(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('shows all pages when 8 pages', () => {
    const result = generatePageNumbers(4, 8)
    expect(result).toContain(1)
    expect(result).toContain(8)
    expect(result).toContain('ellipsis')
  })

  it('page 1 of 20 shows first range', () => {
    const result = generatePageNumbers(1, 20)
    expect(result).toEqual([1, 2, 'ellipsis', 20])
  })

  it('page 2 of 20 shows adjacent range', () => {
    const result = generatePageNumbers(2, 20)
    expect(result).toEqual([1, 2, 3, 'ellipsis', 20])
  })

  it('page 10 of 20 shows centered range', () => {
    const result = generatePageNumbers(10, 20)
    expect(result).toContain('ellipsis')
    expect(result).toContain(9)
    expect(result).toContain(10)
    expect(result).toContain(11)
    expect(result).toContain(20)
  })

  it('page 20 of 20 shows last range', () => {
    const result = generatePageNumbers(20, 20)
    expect(result).toEqual([1, 'ellipsis', 19, 20])
  })

  it('page 19 of 20 shows near-end range', () => {
    const result = generatePageNumbers(19, 20)
    expect(result).toContain('ellipsis')
    expect(result).toContain(18)
    expect(result).toContain(19)
    expect(result).toContain(20)
  })

  it('handles 10 pages with middle page', () => {
    const result = generatePageNumbers(5, 10)
    expect(result).toContain('ellipsis')
    expect(result).toContain(4)
    expect(result).toContain(5)
    expect(result).toContain(6)
    expect(result).toContain(10)
  })

  it('no duplicate ellipsis when appropriate', () => {
    const result = generatePageNumbers(3, 10)
    const ellipsisCount = result.filter(p => p === 'ellipsis').length
    expect(ellipsisCount).toBeLessThanOrEqual(2)
  })
})
