import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateSlug(title: string): string {
  const slug = slugify(title)
  const timestamp = Date.now().toString().slice(-6)
  return `${slug}-${timestamp}`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}

export const TOPIC_ICONS = [
  '🧠', '📚', '💡', '🎯', '🔬', '💰', '🏛️', '🗣️',
  '💡', '🧘', '🌱', '⚡', '📜', '🤝', '🎨', '🏃',
  '👑', '🔑', '🌟', '📈', '🤖', '🌍', '💎', '🔥',
]

export const TOPIC_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#2563eb', '#7c3aed', '#c026d3', '#db2777',
]

export function getRandomIcon(): string {
  return TOPIC_ICONS[Math.floor(Math.random() * TOPIC_ICONS.length)]
}

export function getRandomColor(): string {
  return TOPIC_COLORS[Math.floor(Math.random() * TOPIC_COLORS.length)]
}
