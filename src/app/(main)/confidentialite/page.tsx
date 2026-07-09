import Link from 'next/link'
import { BookOpen, ArrowLeft, Mail } from 'lucide-react'

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-2xl md:p-6">
      <Link
        href="/a-propos"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hidden md:inline-flex"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la page À propos
      </Link>

      <div className="mb-8 text-center">
        <BookOpen className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h1 className="text-3xl font-heading font-bold">Politique de confidentialité</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-xl font-semibold">1. Collecte et utilisation des données</h2>
          <p className="text-muted-foreground">
            MoinsBete collecte un minimum d'informations nécessaires au fonctionnement de l'application.
            Votre vie privée est une priorité.
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
              <p className="text-sm text-muted-foreground">
                <strong>Compte utilisateur :</strong> email et mot de passe haché sont stockés dans notre base de données.
                Le nom d'affichage est optionnel.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
              <p className="text-sm text-muted-foreground">
                <strong>Données de navigation :</strong> historique de lecture, favoris, sujets suivis et préférences
                (actualités CNRS activées ou non) sont stockés pour personnaliser votre expérience.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
              <p className="text-sm text-muted-foreground">
                <strong>Suivi d'activité :</strong> les idées que vous avez lues et votre série de jours actifs
                (streak) sont enregistrés pour vous offrir un suivi de progression.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">2. Données non collectées</h2>
          <div className="mt-3 space-y-2">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">!</span>
              <p className="text-sm text-muted-foreground">
                <strong>Pas d'analytics :</strong> nous n'utilisons aucun outil d'analyse tiers (Google Analytics, etc.)
                ni de pistage.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">!</span>
              <p className="text-sm text-muted-foreground">
                <strong>Pas de partage de données :</strong> vos informations ne sont pas vendues ou partagées
                avec des tiers.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">!</span>
              <p className="text-sm text-muted-foreground">
                <strong>Pas de publicité :</strong> il n'y a ni publicité, ni tracking publicitaire.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">3. Cookies et session</h2>
          <p className="text-muted-foreground">
            MoinsBete utilise un cookie de session (JWT) pour maintenir votre connexion.
            Ce cookie est nécessaire pour l'authentification et ne contient aucune donnée personnelle identifiable.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Le cookie est stocké localement sur votre appareil et expire après 30 jours d'inactivité.
            Vous pouvez vous déconnecter à tout moment pour le supprimer.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">4. Stockage des données</h2>
          <p className="text-muted-foreground">
            Toutes les données sont stockées dans une base de données locale (SQLite/libsql) hébergée sur
            notre infrastructure. Les fichiers sont traités en mémoire volatile et ne sont pas uploadés
            sur des serveurs externes.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">5. Sécurité des données</h2>
          <p className="text-muted-foreground">
            Les mots de passe sont hachés avant stockage. La session utilise des tokens JWT sécurisés
            avec vérification CSRF. Les données sont stockées sur notre infrastructure dédiée.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">6. Vos droits</h2>
          <p className="text-muted-foreground">
            Vous pouvez consulter et gérer vos données via votre page de profil.
            Pour toute question concernant vos données personnelles, contactez-nous à{' '}
            <a
              href="mailto:moinsbete@ginies.org"
              className="text-primary hover:underline"
            >
              moinsbete@ginies.org
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">7. Modifications de la politique</h2>
          <p className="text-muted-foreground">
            Nous pouvons mettre à jour cette politique de confidentialité de temps en temps.
            Toute modification sera reflétée par la nouvelle date de mise à jour en haut de cette page.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">8. Nous contacter</h2>
          <p className="text-muted-foreground">
            Pour toute question ou suggestion concernant cette politique de confidentialité, n'hésitez pas
            à nous contacter.
          </p>
          <div className="mt-3 flex items-center gap-2 text-primary">
            <Mail className="h-4 w-4" />
            <a href="mailto:moinsbete@ginies.org" className="hover:underline">
              moinsbete@ginies.org
            </a>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Auteur : Antoine Ginies
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
        <Link href="/a-propos" className="hover:underline">← Retour à la page À propos</Link>
      </div>
    </div>
  )
}
