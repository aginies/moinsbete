import Link from 'next/link'
import { BookOpen, ArrowLeft, Mail } from 'lucide-react'

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-2xl md:p-6">
      <Link
        href="/a-propos"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la page À propos
      </Link>

      <div className="mb-8 text-center">
        <BookOpen className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h1 className="text-3xl font-heading font-bold">Mentions légales</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-xl font-semibold">Éditeur</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              <strong>Antoine Giniès</strong>, personne physique
            </p>
            <p>
              Domicilié : <strong>31600 Muret, France</strong>
            </p>
            <p>
              Email :{' '}
              <a
                href="mailto:moinsbete@ginies.org"
                className="text-primary hover:underline"
              >
                moinsbete@ginies.org
              </a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Directeur de la publication</h2>
          <p className="text-muted-foreground">
            Antoine Giniès
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Hébergeur</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              Serveur personnel hébergé chez{' '}
              <a
                href="https://www.scaleway.com/en/dedibox/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Scaleway
              </a>
            </p>
            <p>
              Domaine : <strong>moinsbete.guibo.com</strong>
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Propriété intellectuelle</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              Le contenu du site (structure, design, textes originaux) est sous licence{' '}
              <a
                href="https://www.gnu.org/licenses/agpl-3.0.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                AGPL-3.0
              </a>
              .
            </p>
            <p>
              Les contenus tiers proviennent de Wikipédia (CC BY-SA), CNRS, Radio France, Pixabay, Wikimedia Commons et d&apos;autres sources ouvertes.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Données personnelles</h2>
          <p className="text-muted-foreground">
            Pour plus d&apos;informations sur la collecte et l&apos;utilisation de vos données personnelles, consultez notre{' '}
            <Link href="/confidentialite" className="text-primary hover:underline">
              Politique de confidentialité
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Cookies</h2>
          <p className="text-muted-foreground">
            MoinsBête utilise un cookie JWT de session pour l&apos;authentification.
            Ce cookie expire après 30 jours d&apos;inactivité.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Conditions d&apos;utilisation</h2>
          <p className="text-muted-foreground">
            En utilisant MoinsBête, vous acceptez nos conditions d&apos;utilisation décrites dans la page{' '}
            <Link href="/a-propos" className="text-primary hover:underline">
              À propos
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Responsabilité</h2>
          <p className="text-muted-foreground">
            Le service MoinsBête est offert en l&apos;état et peut être interrompu à tout moment sans préavis.
            Antoine Giniès ne saurait être tenu responsable de dommages indirects liés à l&apos;utilisation du service.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
        <Link href="/a-propos" className="hover:underline">← Retour à la page À propos</Link>
      </div>
    </div>
  )
}
