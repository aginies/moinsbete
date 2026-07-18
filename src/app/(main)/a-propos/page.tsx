import Link from 'next/link'
import { BookOpen, ArrowLeft } from 'lucide-react'

export default function AproposPage() {
  return (
    <div className="mx-auto w-full px-0 py-4 pb-20 md:max-w-2xl md:p-6">
      <Link
        href="/"
        className="mb-6 hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:inline-flex"
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
            MoinsBête est une application d&apos;apprentissage rapide en français. Nous transformons les connaissances issues de Wikipédia, d&apos;articles scientifiques, de livres et de podcasts en idées digestibles que vous pouvez apprendre en quelques minutes par jour. Vous pouvez aussi accéder aux actualités du CNRS, découvrir des faits surprenants, explorer des images de Wikimedia Commons, écouter des documentaires Radio France et regarder des vidéos relaxantes Pixabay.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Comment ça marche ?</h2>
          <div className="space-y-3">
            {[
              'Scrollez votre feed d\'idées quotidiennes',
              'Consultez votre historique de lecture',
              'Suivez des sujets qui vous passionnent',
              'Découvrez des faits surprenants dans "Le saviez-vous ?"',
              'Explorez des images quotidiennes de Wikimedia Commons',
              'Regardez des vidéos relaxantes Pixabay',
              'Écoutez des documentaires Radio France',
              'Visualisez vos sujets dans la carte mentale',
              'Suivez votre progression avec les streaks',
              'Partagez vos contenus favoris',
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
            Le contenu de MoinsBête provient de multiples sources enrichies par l&apos;intelligence artificielle :
            Wikipédia en français pour les idées et faits, le journal du CNRS pour les actualités scientifiques,
            Wikimedia Commons pour les images, Radio France pour les documentaires audio, et Pixabay pour les vidéos relaxantes d&apos;ambiance.
            L&apos;IA analyse, résume et structure le contenu pour offrir des idées claires et digestes.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="mb-1 font-semibold">Wikipédia</h3>
              <p className="text-sm text-muted-foreground">Idées et faits vérifiés</p>
              <a
                href="https://fr.wikipedia.org"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                fr.wikipedia.org →
              </a>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="mb-1 font-semibold">CNRS</h3>
              <p className="text-sm text-muted-foreground">Actualités de la recherche</p>
              <a
                href="https://lejournal.cnrs.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                lejournal.cnrs.fr →
              </a>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="mb-1 font-semibold">Wikimedia Commons</h3>
              <p className="text-sm text-muted-foreground">Images libres de droits</p>
              <a
                href="https://commons.wikimedia.org"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                commons.wikimedia.org →
              </a>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="mb-1 font-semibold">Radio France</h3>
              <p className="text-sm text-muted-foreground">Documentaires audio</p>
              <a
                href="https://www.radiofrance.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                radiofrance.fr →
              </a>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="mb-1 font-semibold">Pixabay</h3>
              <p className="text-sm text-muted-foreground">Vidéos libres de droits</p>
              <a
                href="https://pixabay.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                pixabay.com →
              </a>
            </div>
          </div>
        </section>

       <section>
          <h2 className="mb-3 text-xl font-semibold">Partagez tout le contenu</h2>
          <p className="text-muted-foreground">
            Chaque idée, fait, image, article du CNRS, documentaire Radio France, vidéo Pixabay et page de MoinsBête peut être partagée
            facilement. Utilisez le bouton de partage pour envoyer du contenu par email, réseaux sociaux
            ou copier le lien directement.
          </p>
       </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Le saviez-vous ?</h2>
          <p className="text-muted-foreground">
            Découvrez des faits surprenants et méconnus issus de Wikipédia. Chaque jour, de nouvelles anecdotes
            sont sélectionnées pour éveiller votre curiosité. Vous pouvez sauvegarder vos faits préférés
            dans vos favoris et les réviser via notre système de répétition espacée.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Images &amp; visuels</h2>
          <p className="text-muted-foreground">
            MoinsBête propose deux sections dédiées aux images : l&apos;Image du jour, une photo sélectionnée
            quotidiennement depuis Wikimedia Commons, et la galerie Wikimedia pour explorer des milliers
            d&apos;images libres de droits. Cliquez sur une image pour la voir en grand et partagez vos préférées.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Collections</h2>
          <p className="text-muted-foreground">
            Explorez des collections thématiques curatées d&apos;idées sur des sujets précis.
            Chaque collection regroupe les meilleures idées d&apos;un domaine pour un apprentissage
            structuré et approfondi.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Carte mentale</h2>
          <p className="text-muted-foreground">
            Visualisez les liens entre vos idées et vos sujets favoris grâce à la carte mentale interactive.
            Cette représentation graphique vous aide à comprendre comment les connaissances s&apos;articulent
            entre elles et à découvrir de nouvelles connexions.
          </p>
        </section>

        <section>
           <h2 className="mb-3 text-xl font-semibold">Révision par répétition espacée</h2>
           <p className="text-muted-foreground">
             MoinsBête utilise la répétition espacée pour vous aider à retenir les idées importantes.
             Quand vous bookmark une idée, elle entre automatiquement dans votre cycle de révision.
           </p>
           <p className="mt-2 text-sm text-muted-foreground">
             Accédez à l'onglet Révision pour revoir les idées au moment optimal.
             Chaque idée est notée selon votre niveau de mémorisation :
             "Encore" pour celles que vous avez oubliées, "Difficile", "Bon" ou "Facile" pour celles que vous retenez.
             L'algorithme ajuste automatiquement les intervalles entre les révisions pour optimiser la mémorisation à long terme.
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
          <h2 className="mb-3 text-xl font-semibold">Documentaires Radio France</h2>
          <p className="text-muted-foreground">
            Découvrez des documentaires audio de qualité depuis Radio France.
            Chaque jour, une carte vous propose un documentaire aléatoire parmi nos
            collections sélectionnées : histoires, sciences, arts, société et plus encore.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Sauvegardez vos documentaires préférés dans vos favoris et retrouvez-les
            facilement dans l'onglet Documentaires Radio France de votre page favoris.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Vidéos Pixabay</h2>
          <p className="text-muted-foreground">
            Découvrez des vidéos relaxantes et d&apos;ambiance de haute qualité gratuites depuis Pixabay.
            Vous pouvez naviguer entre de nombreuses catégories (Nature, Pluie, Ciel, Coucher de soleil, Forêt, Océan, Espace, Paysage, Montagne, Oiseau)
            pour personnaliser votre expérience d&apos;apprentissage d&apos;une touche apaisante.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Sauvegardez vos vidéos d&apos;ambiance préférées dans vos favoris et retrouvez-les
            facilement dans l&apos;onglet Pixabay de votre page favoris.
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
          <h2 className="mb-3 text-xl font-semibold">Code source</h2>
          <p className="text-muted-foreground">
            Le code source de MoinsBête est disponible sur{' '}
            <a
              href="https://github.com/aginies/moinsbete"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub
            </a>
            .
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Le dépôt est actuellement privé en attendant la résolution de quelques problèmes de sécurité.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Contact</h2>
          <p className="text-muted-foreground">
            Pour réinitialiser votre mot de passe ou partager un retour sur MoinsBête,
            envoyez un email à{' '}
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
          <h2 className="mb-3 text-xl font-semibold">Vie privée</h2>
          <p className="text-muted-foreground">
            <Link href="/confidentialite" className="text-primary hover:underline">
              Politique de confidentialité
            </Link>
          </p>
        </section>

        <section>
            <h2 className="mb-3 text-xl font-semibold">L'auteur</h2>
    <p className="text-muted-foreground">
          MoinsBête a été créé par <strong>Antoine Giniès</strong>.
            Le projet s&apos;inspire de la philosophie Deep Stash, popularisée par 
            <a
              href="https://deepstash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Deep Stash
            </a>
            , une méthode d&apos;apprentissage rapide qui consiste à collecter et
            retenir les idées clés issues de livres, d&apos;articles et d&apos;autres
            sources de connaissance.
          </p>
          <p className="mt-3 text-muted-foreground">
            L&apos;objectif est de remplacer le scroll infini des réseaux sociaux par
            un apprentissage actif et intentionnel. Chaque idée est conçue pour
            être digérée en quelques minutes, tout en restant mémorable et
            actionnable. Le contenu est soigneusement sélectionné et enrichi depuis
            Wikipédia, le CNRS, Wikimedia Commons, Radio France et d&apos;autres sources
            de qualité en français.
          </p>
        </section>

        <section>
           <h2 className="mb-3 text-xl font-semibold">Infrastructure</h2>
           <p className="text-muted-foreground">
             Le service MoinsBete est hébergé sur un serveur loué personnellement par Antoine Giniès à des fins personnelles.
             Ce service est offert en l'état et peut être arrêté à tout moment sans annonce préalable.
           </p>
         </section>

      </div>

      <div className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
        <Link href="/confidentialite" className="hover:underline">Politique de confidentialité</Link>
        <span className="hidden md:inline">{' · '}</span>
        <Link href="/" className="hidden md:inline hover:underline">← Retour à l&apos;accueil</Link>
      </div>
    </div>
  )
}
