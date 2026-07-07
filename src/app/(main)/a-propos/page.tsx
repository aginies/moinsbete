import Link from 'next/link'
import { BookOpen, ArrowLeft } from 'lucide-react'

export default function AproposPage() {
  return (
    <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-2xl md:p-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Accueil
      </Link>

      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-amber-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          AMÉLIORATION EN COURS DE LA DB DES SUJETS
        </div>
        <div className="mt-1 text-sm font-medium text-amber-700">
          AUCUNE SAUVEGARDE NE SERA EFFECTUÉE PENDANT CETTE MAJ
        </div>
      </div>

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
              'Consultez votre historique de lecture',
              'Suivez des sujets qui vous passionnent',
              'Découvrez des informations aléatoires',
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
        Toutes les informations de MoinsBête proviennent de Wikipédia.
        L'IA résume l'idée principale pour offrir un contenu clair et digeste.
      </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Découvrez nos sources sur{' '}
            <a
              href="https://fr.wikipedia.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Wikipédia en français
            </a>
            .
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
          <h2 className="mb-3 text-xl font-semibold">Licence</h2>
          <p className="text-muted-foreground">
            Ce programme est un logiciel libre: vous pouvez le redistribuer et/ou le modifier conformément aux clauses de la Licence Publique Générale GNU telle que publiée par la Free Software Foundation; soit la version 3 de la Licence, soit (à votre choix) toute version ultérieure.
          </p>
          <p className="mt-2 text-muted-foreground">
            Consultez la licence complète sur{' '}
            <a
              href="https://www.gnu.org/licenses/gpl-3.0.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              gnu.org/licenses/gpl-3.0.html
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">L'auteur</h2>
    <p className="text-muted-foreground">
          MoinsBête a été créé par <strong>Antoine Giniès</strong>.
            Le projet s'inspire de la philosophie Deep Stash, popularisée par 
            <a
              href="https://deepstash.com"
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
