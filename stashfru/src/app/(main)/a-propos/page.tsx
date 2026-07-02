import Link from 'next/link'
import { BookOpen, ArrowLeft } from 'lucide-react'

export default function AproposPage() {
  return (
    <div className="mx-auto max-w-2xl p-4 pb-20 md:p-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Accueil
      </Link>

      <div className="mb-8 text-center">
        <BookOpen className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h1 className="text-3xl font-heading font-bold">MoinsBête</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Remplacez le scroll infini par l&apos;apprentissage rapide
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-xl font-semibold">Qu&apos;est-ce que MoinsBête ?</h2>
          <p className="text-muted-foreground">
            MoinsBête est une application d&apos;apprentissage rapide en français.
            Nous transformons les connaissances issues de livres, d&apos;articles et de Wikipédia
            en idées digestibles que vous pouvez apprendre en quelques minutes par jour.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Comment ça marche ?</h2>
          <div className="space-y-3">
            {[
              'Scrollez votre feed d\'idées quotidiennes',
              'Sauvegardez les idées qui vous inspirent',
              'Suivez des sujets qui vous passionnent',
              'Suivez votre plan d\'apprentissage personnalisé',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <p className="text-sm">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Les sujets</h2>
          <p className="text-muted-foreground">
            Explorez des sujets variés : psychologie, philosophie, productivité,
            sciences cognitives, économie, histoire, communication, créativité,
            santé et bien-être, leadership, et bien plus encore.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Les sujets sont automatiquement détectés et ajoutés quand du nouveau contenu est ingéré.
            Vous pouvez suggérer de nouveaux sujets via l&apos;interface d&apos;administration.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Source des contenus</h2>
          <p className="text-muted-foreground">
            Nos idées sont extraites de sources francophones, principalement Wikipédia en français,
            et distillées par intelligence artificielle pour vous offrir le meilleur de chaque source.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">100% gratuit</h2>
     <p className="text-muted-foreground">
          MoinsBête est gratuit. Pas de publicité, pas d'abonnement.
            Juste de l'apprentissage de qualité, sans friction.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">L'auteur</h2>
    <p className="text-muted-foreground">
          MoinsBête a été créé par <strong>Antoine Giniès</strong>.
            Le projet s'inspire de la philosophie Deep Stash, popularisée par
            <a
              href="https://fr.wikipedia.org/wiki/Deep_Stash"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Deep Stash
            </a>
            , une méthode d'apprentissage rapide qui consiste à collecter et
            retenir les idées clés issues de livres, d'articles et d'autres
            sources de connaissance.
          </p>
          <p className="mt-3 text-muted-foreground">
            L'objectif est de remplacer le scroll infini des réseaux sociaux par
            un apprentissage actif et intentionnel. Chaque idée est conçue pour
            être digérée en quelques minutes, tout en restant mémorable et
            actionnable.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">← Retour à l&apos;accueil</Link>
      </div>
    </div>
  )
}
