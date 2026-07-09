export interface IdeaTopic {
  id: string
  name: string
  slug: string
  icon: string
  color: string
}

export interface IdeaSource {
  title: string
  type: string
  url?: string | null
  coverUrl?: string | null
}

export interface Idea {
  id: string
  title: string
  content: string
  takeaway: string
  slug: string
  saviezVous?: string | null
  source: IdeaSource
  topics: IdeaTopic[]
  viewedAt?: string
}

export type CompactIdea = Pick<Idea, 'id' | 'title' | 'slug' | 'topics' | 'source'> & { viewedAt?: string }
