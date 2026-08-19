import type { Metadata } from 'next'
import { AirCrashPageClient } from './air-crash-page-client'

export const metadata: Metadata = {
  title: 'Air Crash Investigation | MoinsBête',
  description: "Chaque jour, plongez dans l'enquête d'un accident aérien, avec la fiche ASN et l'article complet.",
  openGraph: {
    title: 'Air Crash Investigation',
    description: "Chaque jour, plongez dans l'enquête d'un accident aérien sur MoinsBête",
    type: 'website',
  },
}

export default function AirCrashPage() {
  return (
    <div className="mx-auto flex min-h-[90vh] w-full flex-col items-center justify-start px-4 py-8 md:max-w-4xl md:p-6">
      <AirCrashPageClient />
    </div>
  )
}
