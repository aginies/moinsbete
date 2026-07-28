import Link from 'next/link'
import { BookOpen, ArrowLeft, Mail } from 'lucide-react'

export default function ConditionsUtilisationPage() {
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
        <h1 className="text-3xl font-heading font-bold">Conditions d&apos;utilisation</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-xl font-semibold">1. Acceptation des conditions</h2>
          <p className="text-muted-foreground">
            En utilisant MoinsBête, vous acceptez les présentes conditions d&apos;utilisation.
            Si vous n&apos;êtes pas d&apos;accord avec l&apos;une d&apos;elles, vous pouvez cesser d&apos;utiliser le service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">2. Utilisation du service</h2>
          <p className="text-muted-foreground">
            MoinsBête est un service gratuit à usage personnel. Vous pouvez consulter le contenu, sauvegarder des favoris
            et partager du contenu avec d&apos;autres utilisateurs.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Une connexion est requise pour synchroniser vos favoris, suivre votre progression et accéder au Lobby.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Aucune restriction d&apos;âge n&apos;est imposée pour l&apos;utilisation du service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">3. Contenu</h2>
          <p className="text-muted-foreground">
            Le contenu de MoinsBête provient de sources externes : Wikipédia (CC BY-SA), CNRS, FreeNewsAPI,
            Radio France, Pixabay, Wikimedia Commons, Wiki Loves, Portail Lexical et d&apos;autres sources ouvertes.
            Il est résumé et structuré pour faciliter la lecture.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Le contenu est fourni tel quel. Aucune garantie d&apos;exactitude, d&apos;exhaustivité ou d&apos;actualité n&apos;est apportée.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">4. Compte utilisateur</h2>
          <p className="text-muted-foreground">
            Vous êtes responsable de la conservation de vos identifiants de connexion.
            Un compte = une personne.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">5. Désactivation de compte</h2>
          <p className="text-muted-foreground">
            L&apos;administrateur peut désactiver ou supprimer tout compte utilisateur à tout moment,
            sans préavis ni notification préalable, pour quelque raison que ce soit.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Les données de compte se limitent à un identifiant, une adresse email et un mot de passe haché.
            Ce sont des données non privées. Un compte désactivé n&apos;est pas nécessairement supprimé du serveur.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">6. Partage &amp; Lobby</h2>
          <p className="text-muted-foreground">
            Le contenu que vous partagez via le Lobby est visible par la communauté.
            Vous pouvez supprimer vos partages à tout moment.
            Les autres utilisateurs peuvent ajouter vos favoris à leurs collections.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">7. Limites du service</h2>
          <p className="text-muted-foreground">
            Le service est fourni en l&apos;état. Il peut être interrompu, modifié ou arrêté à tout moment sans préavis.
            Aucune garantie de disponibilité continue n&apos;est apportée.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Les données de contenu sont mises en cache pour une durée variable : jusqu&apos;à 48h pour les actualités, 30 jours pour les images, 7 jours pour les articles Wikipédia. Les proverbes et faits utilisent des caches courts en mémoire.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">8. Modifications</h2>
          <p className="text-muted-foreground">
            Ces conditions peuvent être modifiées à tout moment sans préavis.
            La date de dernière mise à jour est affichée en haut de cette page.
            Votre utilisation continue du service après modification vaut acceptation.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">9. Nous contacter</h2>
          <p className="text-muted-foreground">
            Pour toute question concernant ces conditions d&apos;utilisation :
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
