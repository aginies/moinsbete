import Link from 'next/link'

export default function LobbyAboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Link href="/lobby" className="text-sm text-primary hover:underline">
          ← Retour au Lobby
        </Link>
      </div>

      <h1 className="mb-2 text-3xl font-bold">Le Lobby — Guide</h1>
      <p className="mb-8 text-muted-foreground">
        Le Lobby est un espace communautaire qui permet de partager et découvrir du contenu avec d&apos;autres utilisateurs.
      </p>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Les 4 onglets du Lobby</h2>

        <div className="mb-6 space-y-2">
          <h3 className="text-lg font-medium">1. Favoris</h3>
          <p className="text-muted-foreground">
            Affiche les favoris que la communauté a partagés publiquement. Chaque utilisateur peut choisir
            de partager ses favoris avec tout le monde. Pour qu&apos;un contenu apparaisse ici, il doit d&apos;abord
            être ajouté aux favoris personnels de l&apos;utilisateur. Les contenus partagés incluent les idées,
            faits surprenants, images du jour, images Wikimedia et Wiki Loves.
          </p>
        </div>

        <div className="mb-6 space-y-2">
          <h3 className="text-lg font-medium">2. Avec vous</h3>
          <p className="text-muted-foreground">
            Contenu qu&apos;un autre utilisateur a spécifiquement partagé avec vous. Vous voyez ici uniquement
            ce qui a été envoyé à votre compte. Vous pouvez ajouter ces contenus à vos propres favoris
            ou les explorer selon les goûts de vos camarades.
          </p>
        </div>

        <div className="mb-6 space-y-2">
          <h3 className="text-lg font-medium">3. J&apos;ai partagé</h3>
          <p className="text-muted-foreground">
            Liste de tous les contenus que vous avez partagés à des utilisateurs spécifiques.
            Quand vous partagez un favori, vous pouvez choisir de le partager à toute la communauté
            (visible dans l&apos;onglet Favoris) ou sélectionner des destinataires précis.
            Cet onglet montre vos partages ciblés.
          </p>
        </div>

        <div className="mb-6 space-y-2">
          <h3 className="text-lg font-medium">4. Discuter</h3>
          <p className="text-muted-foreground">
            Forum communautaire pour partager des idées d&apos;amélioration de l&apos;application, suggérer
            de nouveaux sujets, proposer des modifications ou discuter avec la communauté.
            Vous pouvez créer une suggestion et voir les commentaires des autres utilisateurs.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Comment partager du contenu</h2>
        <div className="space-y-2">
          <p className="text-muted-foreground">
            Sur chaque carte de contenu (idée, image, fait, proverbe, etc.), un bouton de partage
            permet d&apos;envoyer le contenu au Lobby. Vous avez deux options :
          </p>
          <ul className="list-inside list-disc text-muted-foreground space-y-1">
            <li><strong>Partager avec la communauté</strong> — le contenu apparaît dans l&apos;onglet Favoris du Lobby, visible par tous</li>
            <li><strong>Partager avec des utilisateurs spécifiques</strong> — le contenu apparaît uniquement dans l&apos;onglet &quot;Avec vous&quot; des destinataires sélectionnés et dans votre onglet &quot;J&apos;ai partagé&quot;</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Bon à savoir</h2>
        <div className="space-y-2">
          <ul className="list-inside list-disc text-muted-foreground space-y-1">
            <li>Un contenu partagé publiquement doit d&apos;abord être dans vos favoris personnels</li>
            <li>Vous pouvez retirer un partage à tout moment depuis votre page &quot;J&apos;ai partagé&quot;</li>
            <li>Les contenus partagés restent visibles même si vous supprimez votre favori d&apos;origine</li>
            <li>L&apos;onglet &quot;Avec vous&quot; montre uniquement les partages reçus, pas les vôtres</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
