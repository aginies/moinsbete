import Link from 'next/link'
import { BookOpen, ArrowLeft, Mail } from 'lucide-react'

export default function ConfidentialitePage() {
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
        <h1 className="text-3xl font-heading font-bold">Politique de confidentialité</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-xl font-semibold">1. Données collectées</h2>
          <p className="text-muted-foreground">
            MoinsBête collecte un minimum d&apos;informations nécessaires au fonctionnement du service.
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
              <p className="text-sm text-muted-foreground">
                <strong>Compte :</strong> identifiant, email et mot de passe haché. Ce sont des données non privées.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
              <p className="text-sm text-muted-foreground">
                <strong>Données de navigation :</strong> favoris, historique de lecture, sujets suivis, préférences de cartes et progression (streak).
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
              <p className="text-sm text-muted-foreground">
                <strong>Partages :</strong> contenu partagé via le Lobby est visible par la communauté.
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
                <strong>Pas d&apos;analytics :</strong> aucun outil d&apos;analyse tiers (Google Analytics, etc.) ni pistage.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">!</span>
              <p className="text-sm text-muted-foreground">
                <strong>Pas de partage de données :</strong> vos informations ne sont pas vendues à des tiers.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">!</span>
              <p className="text-sm text-muted-foreground">
                <strong>Pas de publicité :</strong> ni publicité, ni tracking publicitaire.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">3. Cookies et session</h2>
          <p className="text-muted-foreground">
            MoinsBête utilise un cookie JWT de session pour l&apos;authentification.
            Ce cookie est nécessaire et ne contient aucune donnée personnelle identifiable.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Stocké localement sur votre appareil. Expire après 30 jours d&apos;inactivité.
            La déconnexion le supprime.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">4. Stockage</h2>
          <p className="text-muted-foreground">
            Base de données libsql hébergée sur un serveur personnel chez Scaleway.
            Les fichiers sont traités en mémoire volatile, non uploadés sur des serveurs externes.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">5. Sécurité</h2>
          <p className="text-muted-foreground">
            Mots de passe hachés avant stockage. Sessions JWT avec vérification CSRF.
            Données sur infrastructure dédiée.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">6. Suppression et désactivation de compte</h2>
          <p className="text-muted-foreground">
            Vous pouvez consulter vos données via votre page de profil.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            L&apos;administrateur peut désactiver ou supprimer un compte à tout moment, sans préavis ni notification.
            Les données de compte (identifiant, email, mot de passe haché) sont des données non privées
            et un compte désactivé n&apos;est pas nécessairement supprimé du serveur.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">7. Modifications</h2>
          <p className="text-muted-foreground">
            Cette politique peut être mise à jour ponctuellement.
            La date de dernière mise à jour est affichée en haut de cette page.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">8. Nous contacter</h2>
          <p className="text-muted-foreground">
            Pour toute question concernant cette politique :
          </p>
          <div className="mt-3 flex items-center gap-2 text-primary">
            <Mail className="h-4 w-4" />
            <a href="mailto:moinsbete@ginies.org" className="hover:underline">
              moinsbete@ginies.org
            </a>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Auteur : Antoine Giniès
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
        <Link href="/a-propos" className="hover:underline">← Retour à la page À propos</Link>
      </div>
    </div>
  )
}
