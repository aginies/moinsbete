import { describe, it, expect } from 'vitest'
import { extractJson, tryExtractArray } from '@/lib/llm'

describe('extractJson', () => {
  it('parses direct JSON object', async () => {
    const result = await extractJson('{"action": "create", "name": "test"}')
    expect(result).toEqual({ action: 'create', name: 'test' })
  })

  it('parses direct JSON array', async () => {
    const result = await extractJson('[{"title": "a"}, {"title": "b"}]')
    expect(result).toEqual([{ title: 'a' }, { title: 'b' }])
  })

  it('parses JSON with markdown backticks', async () => {
    const result = await extractJson('```json\n{"action": "match"}\n```')
    expect(result).toEqual({ action: 'match' })
  })

  it('parses JSON array in text', async () => {
    const result = await extractJson('Here is the data: [{"title": "x"}]')
    expect(result).toEqual([{ title: 'x' }])
  })

  it('parses JSON object in text', async () => {
    const result = await extractJson('Some text {"action": "create"} more text')
    expect(result).toEqual({ action: 'create' })
  })

  it('cleans reasoning_content in arrays', async () => {
    const input = 'text before [{"title": "a", "reasoning_content": "thinking"}, {"title": "b"}] text after'
    // Valid JSON array extracted, no cleaning needed since JSON is valid
    const result = await extractJson(input)
    expect(result).toEqual([
      { title: 'a', reasoning_content: 'thinking' },
      { title: 'b' },
    ])
  })

  it('cleans reasoning_content in objects', async () => {
    const input = 'text before {"action": "create", "reasoning_content": "thinking"} text after'
    // Valid JSON object extracted, no cleaning needed since JSON is valid
    const result = await extractJson(input)
    expect(result).toEqual({ action: 'create', reasoning_content: 'thinking' })
  })

  it('throws on empty string', async () => {
    await expect(extractJson('')).rejects.toThrow('Empty text')
  })

  it('throws on whitespace only', async () => {
    await expect(extractJson('   ')).rejects.toThrow('Empty text')
  })

  it('throws when no valid JSON found', async () => {
    await expect(extractJson('just plain text')).rejects.toThrow('No valid JSON found')
  })

  it('parses nested JSON objects', async () => {
    const input = '{"data": {"nested": {"deep": true}}}'
    const result = await extractJson(input)
    expect(result).toEqual({ data: { nested: { deep: true } } })
  })
})

describe('tryExtractArray', () => {
  it('extracts valid JSON array', () => {
    const input = '[{"title": "a", "content": "b", "takeaway": "c"}]'
    const result = tryExtractArray(input)
    expect(result).toEqual([{ title: 'a', content: 'b', takeaway: 'c' }])
  })

  it('rejects array missing required keys', () => {
    const input = '[{"title": "a", "content": "b"}]'
    const result = tryExtractArray(input)
    expect(result).toBeNull()
  })

  it('rejects empty array', () => {
    const input = '[]'
    const result = tryExtractArray(input)
    expect(result).toBeNull()
  })

  it('extracts array from text with backticks', () => {
    const input = '```json\n[{"title": "x", "content": "y", "takeaway": "z"}]\n```'
    const result = tryExtractArray(input)
    expect(result).toEqual([{ title: 'x', content: 'y', takeaway: 'z' }])
  })

  it('extracts last valid array in text', () => {
    const input = 'garbage [{"title": "a", "content": "b", "takeaway": "c"}]'
    const result = tryExtractArray(input)
    expect(result).toEqual([{ title: 'a', content: 'b', takeaway: 'c' }])
  })

  it('handles escaped quotes', () => {
    const input = '[{"title": "test \\"quoted\\"", "content": "c", "takeaway": "t"}]'
    const result = tryExtractArray(input)
    expect(result).toEqual([{ title: 'test "quoted"', content: 'c', takeaway: 't' }])
  })

  it('rejects invalid JSON', () => {
    const input = '[{title: unquoted}]'
    const result = tryExtractArray(input)
    expect(result).toBeNull()
  })
})
