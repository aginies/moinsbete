'use client'

import { ErrorPage } from '@/components/error-page'

export default function FiveHundred() {
  return (
    <ErrorPage
      title="Erreur serveur"
      message="Une erreur inattendue s&apos;est produite. Veuillez réessayer."
    />
  )
}
