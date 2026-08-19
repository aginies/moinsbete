'use client'

import { CardShell } from '@/components/feed/card-shell'
import type { CardColorName, CardShape, CardBorderStyle, CardShadow } from '@/lib/card-theme'

const TEST_COLORS: CardColorName[] = ['teal', 'blue', 'purple', 'amber', 'green', 'rose', 'orange', 'emerald', 'indigo']

const SHAPES: CardShape[] = ['square', 'slight', 'default', 'round', 'pill']
const BORDERS: CardBorderStyle[] = ['none', 'thin', 'medium', 'thick', 'dashed', 'dotted', 'double']
const SHADOWS: CardShadow[] = ['none', 'sm', 'default', 'md', 'lg', 'xl', '2xl', 'inner']

const DummyContent = ({ label }: { label: string }) => (
  <div className="space-y-2">
    <h3 className="text-sm font-bold uppercase tracking-wide">{label}</h3>
    <p className="text-xs opacity-70">Card content goes here. This is a test card to preview layout variants.</p>
  </div>
)

export default function TestLayoutsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Card Layout Tester</h1>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold">Shape (border: medium, shadow: md)</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
          {SHAPES.map((shape, i) => (
            <CardShell key={shape} color={TEST_COLORS[i]} shape={shape} shadow="md">
              <DummyContent label={shape} />
            </CardShell>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold">Border (shape: round, shadow: md)</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-7">
          {BORDERS.map((border, i) => (
            <CardShell key={border} color={TEST_COLORS[i]} shape="round" borderStyle={border} shadow="md">
              <DummyContent label={border} />
            </CardShell>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold">Shadow (shape: round, border: medium)</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
          {SHADOWS.map((shadow, i) => (
            <CardShell key={shadow} color={TEST_COLORS[i]} shape="round" borderStyle="medium" shadow={shadow}>
              <DummyContent label={shadow} />
            </CardShell>
          ))}
        </div>
      </section>
    </div>
  )
}
