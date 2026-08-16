import type { Metadata } from 'next'
import { ApodClient } from './apod-client'

export const metadata: Metadata = {
  title: 'APOD | MoinsBête',
  description: "L'astronomie en image chaque jour avec l'APOD de la NASA. Image du jour et archive sur MoinsBête.",
  openGraph: {
    title: 'APOD',
    description: "L'astronomie en image chaque jour avec l'APOD de la NASA",
    type: 'website',
  },
}

export default async function ApodPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams
  const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : undefined

  return (
    <div className="mx-auto flex min-h-[90vh] w-full flex-col items-center justify-start px-4 py-8 md:max-w-4xl md:p-6">
      <ApodClient initialDate={date} />
    </div>
  )
}
