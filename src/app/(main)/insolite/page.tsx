import type { Metadata } from 'next'
import { InsolitePageClient } from './insolite-page-client'

export const metadata: Metadata = {
  title: 'Articles insolites | MoinsBête',
  description: "Un article insolite à découvrir chaque jour, tiré des articles insolites de Wikipédia.",
  openGraph: {
    title: 'Articles insolites',
    description: "Un article insolite à découvrir chaque jour sur MoinsBête",
    type: 'website',
  },
}

export default function InsolitePage() {
  return (
    <div className="mx-auto flex min-h-[90vh] w-full flex-col items-center justify-start px-4 py-8 md:max-w-4xl md:p-6">
      <InsolitePageClient />
    </div>
  )
}
