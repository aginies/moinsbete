import { describe, it, expect } from 'vitest'
import { IDEAS } from '@/scripts/seed-ideas'

describe('IDEAS seed data', () => {
  it('has at least 10 ideas', () => {
    expect(IDEAS.length).toBeGreaterThan(10)
  })

  it('each idea has required fields', () => {
    for (const idea of IDEAS) {
      expect(idea.title).toBeDefined()
      expect(typeof idea.title).toBe('string')
      expect(idea.title.length).toBeGreaterThan(0)

      expect(idea.content).toBeDefined()
      expect(typeof idea.content).toBe('string')
      expect(idea.content.length).toBeGreaterThan(0)

      expect(idea.takeaway).toBeDefined()
      expect(typeof idea.takeaway).toBe('string')
      expect(idea.takeaway.length).toBeGreaterThan(0)

      expect(idea.sourceTitle).toBeDefined()
      expect(typeof idea.sourceTitle).toBe('string')
      expect(idea.sourceTitle.length).toBeGreaterThan(0)

      expect(idea.topicNames).toBeDefined()
      expect(Array.isArray(idea.topicNames)).toBe(true)
      expect(idea.topicNames.length).toBeGreaterThan(0)
    }
  })

  it('all titles are unique', () => {
    const titles = IDEAS.map(i => i.title)
    const uniqueTitles = new Set(titles)
    expect(uniqueTitles.size).toBe(titles.length)
  })

  it('all topic names are non-empty strings', () => {
    for (const idea of IDEAS) {
      for (const topic of idea.topicNames) {
        expect(typeof topic).toBe('string')
        expect(topic.length).toBeGreaterThan(0)
      }
    }
  })

  it('has ideas from multiple topic categories', () => {
    const topics = new Set<string>()
    for (const idea of IDEAS) {
      for (const topic of idea.topicNames) {
        topics.add(topic)
      }
    }
    expect(topics.size).toBeGreaterThan(3)
  })
})
