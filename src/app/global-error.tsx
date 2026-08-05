'use client'

import { ErrorPage } from '@/components/error-page'

export default function GlobalError() {
  return (
    <ErrorPage
      title="Une erreur est survenue"
      message="La page n&apos;a pas pu se charger. Veuillez réessayer."
    />
  )
}
