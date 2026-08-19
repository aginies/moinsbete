import Link from 'next/link'
import { BookOpen, ArrowLeft } from 'lucide-react'
import { getAproposStats } from '@/actions/apropos-stats-actions'

export default async function AproposPage() {
  const stats = await getAproposStats()
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

      <nav className="mb-8 rounded-lg border border-border/60 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Sommaire</h2>
        <ul className="space-y-1.5 text-sm">
          <li><a href="#apropos" className="text-primary hover:underline">À propos</a></li>
          <li><a href="#utilisation" className="text-primary hover:underline">Utilisation</a></li>
          <li><a href="#contenus" className="text-primary hover:underline">Contenus</a></li>
          <li><a href="#communaute" className="text-primary hover:underline">Communauté</a></li>
          <li><a href="#chiffres" className="text-primary hover:underline">En chiffres</a></li>
          <li><a href="#sources" className="text-primary hover:underline">Sources des contenus</a></li>
          <li><a href="#auteur" className="text-primary hover:underline">Auteur &amp; infrastructure</a></li>
          <li><a href="#mentions" className="text-primary hover:underline">Mentions légales</a></li>
          <li><a href="#conditions" className="text-primary hover:underline">Conditions d&apos;utilisation</a></li>
        </ul>
      </nav>

      <div className="space-y-6">
        {/* ——— À PROPOS ——— */}
        <section id="apropos">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Qu&apos;est-ce que MoinsBête ?</h2>
          <p className="text-muted-foreground">
            MoinsBête est une application d&apos;apprentissage rapide en français. Nous transformons les connaissances issues de Wikipédia, d&apos;articles scientifiques, de livres et de podcasts en idées digestibles que vous pouvez apprendre en quelques minutes par jour.
          </p>
          <p className="mt-2 text-muted-foreground">
            L&apos;objectif est de remplacer le scroll infini des réseaux sociaux par
            un apprentissage actif et intentionnel. Chaque idée est conçue pour
            être digérée en quelques minutes, tout en restant mémorable et
            actionnable.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">100% gratuit</h2>
          <p className="text-muted-foreground">
            MoinsBête est gratuit. Pas de publicité, pas d&apos;abonnement.
            Juste de l&apos;apprentissage de qualité, sans friction.
          </p>
        </section>

        {/* ——— UTILISATION ——— */}
        <section id="utilisation" className="pt-6 border-t border-border/40">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Utilisation</h2>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Les sujets</h3>
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

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Collections</h3>
            <p className="text-muted-foreground">
              Explorez des collections thématiques curatées d&apos;idées sur des sujets précis.
              Chaque collection regroupe les meilleures idées d&apos;un domaine pour un apprentissage
              structuré et approfondi.
            </p>
          </section>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Carte mentale</h3>
            <p className="text-muted-foreground">
              Visualisez les liens entre vos idées et vos sujets favoris grâce à la carte mentale interactive.
              Cette représentation graphique vous aide à comprendre comment les connaissances s&apos;articulent
              entre elles et à découvrir de nouvelles connexions.
            </p>
            <p className="mt-2 text-xs text-muted-foreground/70">Visible uniquement sur mobile.</p>
          </section>
        </section>

        {/* ——— CONTENUS ——— */}
        <section id="contenus" className="pt-6 border-t border-border/40">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Contenus</h2>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Le saviez-vous ?</h3>
            <p className="text-muted-foreground">
              Découvrez des faits surprenants et méconnus issus de Wikipédia. Chaque jour, de nouvelles anecdotes
              sont sélectionnées pour éveiller votre curiosité. Vous pouvez sauvegarder vos faits préférés
              dans vos favoris et les réviser via notre système de répétition espacée.
            </p>
          </section>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Proverbes</h3>
            <p className="text-muted-foreground">
              Explorez une collection de proverbes français et de proverbes du monde entier.
              Les proverbes sont récupérés depuis Wiktionary et vérifiés pour garantir leur authenticité.
              Vous pouvez sauvegarder vos proverbes préférés dans vos favoris et les réviser via notre système de répétition espacée.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Accédez à la section Proverbes pour naviguer par catégorie, rechercher des proverbes par mot-clé,
              et découvrir des proverbes au hasard. Chaque proverbe peut être partagé avec la communauté.
            </p>
          </section>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Portail Lexical — Mot du jour</h3>
            <p className="text-muted-foreground">
              Découvrez un nouveau mot français chaque jour via le Portail Lexical.
              Chaque carte présente la définition du TLFi, les entries du Wiktionnaire,
              l&apos;étymologie historique avec des dates d&apos;attestation, et des exemples
              d&apos;usage dans la littérature française.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Accédez au portail lexical complet pour rechercher n&apos;importe quel mot,
              consulter ses définitions détaillées et explorer son histoire linguistique.
              Les mots peuvent être sauvegardés dans vos favoris Lexique pour y revenir plus tard.
            </p>
          </section>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Images &amp; visuels</h3>
            <p className="text-muted-foreground">
              MoinsBête propose deux sections dédiées aux images : l&apos;Image du jour, une photo sélectionnée
              quotidiennement depuis Wikimedia Commons, et la galerie Wikimedia pour explorer des milliers
              d&apos;images libres de droits. Cliquez sur une image pour la voir en grand et partagez vos préférées.
            </p>
          </section>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Espace — Image du jour NASA</h3>
            <p className="text-muted-foreground">
              Chaque jour, une image astronomique sélectionnée par la NASA (Astronomy Picture of the Day) :
              galaxies, nébuleuses, planètes, missions spatiales et phénomènes célestes, avec une explication
              rédigée par des astronomes. Parcourez les jours précédents en swipant, et retrouvez vos images
              préférées dans vos favoris.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Les images sont fournies par l&apos;API publique de la NASA et mises en cache 30 jours.
            </p>
          </section>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Documentaires Radio France</h3>
            <p className="text-muted-foreground">
              Découvrez des documentaires audio de qualité depuis Radio France.
              Chaque jour, une carte vous propose un documentaire aléatoire parmi nos
              collections sélectionnées : histoires, sciences, arts, société et plus encore.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Sauvegardez vos documentaires préférés dans vos favoris et retrouvez-les
              facilement dans l&apos;onglet Documentaires Radio France de votre page favoris.
            </p>
          </section>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Vidéos Pixabay</h3>
            <p className="text-muted-foreground">
              Découvrez des vidéos d&apos;ambiance de haute qualité gratuites depuis Pixabay.
              Vous pouvez naviguer entre de nombreuses catégories (Nature, Pluie, Ciel, Coucher de soleil, Forêt, Océan, Espace, Paysage, Montagne, Oiseau)
              pour personnaliser votre expérience d&apos;apprentissage d&apos;une touche apaisante.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Sauvegardez vos vidéos d&apos;ambiance préférées dans vos favoris et retrouvez-les
              facilement dans l&apos;onglet Pixabay de votre page favoris.
            </p>
          </section>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Actualités mondiales</h3>
            <p className="text-muted-foreground">
              La carte NEWS propose des actualités internationales provenant de FreeNewsAPI.
              Les articles sont classés par catégories (monde, entreprise, technologie, sport, etc.)
              et mis à jour automatiquement cinq fois par jour.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Les articles sont mis en cache pendant 24 heures. En mode développement,
              un fichier JSON statique sert de repli. Vous pouvez filtrer par catégorie
              et sauvegarder vos articles préférés dans vos favoris.
            </p>
          </section>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Citations</h3>
            <p className="text-muted-foreground">
              Découvrez des citations célèbres issues de Wikiquote. Chaque jour, une citation du jour est sélectionnée,
              et des collections thématiques par thème et par auteur permettent d'explorer la sagesse des grands penseurs.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Sauvegardez vos citations préférées dans vos favoris et retrouvez-les
              facilement dans l'onglet Citations de votre page favoris.
            </p>
          </section>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Portail Wikipédia</h3>
            <p className="text-muted-foreground">
              Explorez les meilleurs articles de Wikipédia sélectionnés par les portails thématiques.
              Chaque carte présente un article de qualité avec un extrait et une image illustrative.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Sauvegardez vos articles préférés dans vos favoris et retrouvez-les
              facilement dans l'onglet Portail Wikipédia de votre page favoris.
            </p>
          </section>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Articles insolites</h3>
            <p className="text-muted-foreground">
              Découvrez des articles insolites de Wikipédia — ces articles courts, surprenants,
              ou simplement amusants qui font la particularité de l'encyclopédie.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Sauvegardez vos articles insolites préférés dans vos favoris et retrouvez-les
              facilement dans l'onglet Insolite de votre page favoris.
            </p>
          </section>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Formule 1</h3>
            <p className="text-muted-foreground">
              Suivez l&apos;actualité de la Formule 1 : résultats, classements pilotes et constructeurs,
              ainsi que des faits intéressants sur le monde de la automobile.
            </p>
          </section>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Air Crash Investigation</h3>
            <p className="text-muted-foreground">
              Chaque jour, une enquête sur un accident d&apos;avion historique, tirée de Wikipédia :
              plus de 230 enquêtes couvrant les grands accidents et incidents aériens depuis les années 1930.
              Chaque carte renvoie vers la fiche de l&apos;accident sur Aviation Safety Network, la base de
              données de référence sur la sécurité aérienne, pour approfondir l&apos;enquête officielle.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Sauvegardez vos enquêtes préférées dans vos favoris et retrouvez-les
              facilement dans l&apos;onglet Air Crash Investigation de votre page favoris.
            </p>
          </section>
        </section>

        {/* ——— COMMUNAUTÉ ——— */}
        <section id="communaute" className="pt-6 border-t border-border/40">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Communauté</h2>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Le Lobby</h3>
            <p className="text-muted-foreground">
              Le Lobby est un espace communautaire avec quatre onglets : les favoris partagés par la communauté, les contenus partagés avec vous, vos partages vers d&apos;autres utilisateurs, et un forum de discussion.
            </p>
            <h4 className="mt-4 mb-2 text-base font-medium text-foreground/80">Favoris partagés</h4>
            <p className="text-muted-foreground">
              Chaque utilisateur peut partager ses favoris avec la communauté. Pour qu&apos;un contenu apparaisse dans les favoris partagés,
              il doit d&apos;abord être ajouté aux favoris de l&apos;utilisateur. Les favoris incluent les idées, faits surprenants, images du jour,
              images Wikimedia et Wiki Loves, images NASA APOD, citations, articles Portail Wikipédia, articles insolites et enquêtes Air Crash.
            </p>
            <h4 className="mt-4 mb-2 text-base font-medium text-foreground/80">Partagé avec vous</h4>
            <p className="text-muted-foreground">
              Cet onglet affiche les contenus qu&apos;un autre utilisateur a spécifiquement partagés avec vous. Vous pouvez les ajouter à vos favoris
              ou les découvrir selon les goûts de vos camarades.
            </p>
            <h4 className="mt-4 mb-2 text-base font-medium text-foreground/80">Ce que j&apos;ai partagé</h4>
            <p className="text-muted-foreground">
              Consultez ici tous les contenus que vous avez partagés à des utilisateurs spécifiques. Quand vous partagez un favori,
              vous pouvez choisir de le partager à toute la communauté ou sélectionner des destinataires précis.
            </p>
            <h4 className="mt-4 mb-2 text-base font-medium text-foreground/80">Discuter</h4>
            <p className="text-muted-foreground">
              L&apos;onglet Discuter est un espace pour partager des idées d&apos;amélioration de l&apos;application, suggérer de nouveaux sujets,
              proposer des modifications ou simplement discuter avec la communauté.
            </p>
          </section>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Partagez tout le contenu</h3>
            <p className="text-muted-foreground">
              Chaque idée, fait, image, article du CNRS, article NEWS, article F1, documentaire Radio France, vidéo Pixabay, citation, article Portail Wikipédia, article insolite, image NASA APOD, enquête Air Crash et page de MoinsBête peut être partagée
              facilement. Utilisez le bouton de partage pour envoyer du contenu par email, réseaux sociaux
              ou copier le lien directement.
            </p>
          </section>
        </section>

        {/* ——— EN CHIFFRES ——— */}
        <section id="chiffres" className="pt-6 border-t border-border/40">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">En chiffres</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.ideas.toLocaleString('fr-FR')}</div>
              <div className="text-sm text-muted-foreground">Idées publiées</div>
            </div>
            <div className="rounded-lg border border-border/60 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.cnrs.toLocaleString('fr-FR')}</div>
              <div className="text-sm text-muted-foreground">Articles CNRS</div>
            </div>
            <div className="rounded-lg border border-border/60 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.radio.toLocaleString('fr-FR')}</div>
              <div className="text-sm text-muted-foreground">Épisodes radio</div>
            </div>
            <div className="rounded-lg border border-border/60 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.news.toLocaleString('fr-FR')}</div>
              <div className="text-sm text-muted-foreground">Articles NEWS</div>
            </div>
            <div className="rounded-lg border border-border/60 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.f1.toLocaleString('fr-FR')}</div>
              <div className="text-sm text-muted-foreground">Articles F1</div>
            </div>
            <div className="rounded-lg border border-border/60 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.portailWiki.toLocaleString('fr-FR')}</div>
              <div className="text-sm text-muted-foreground">Articles Portail Wikipédia</div>
            </div>
            <div className="rounded-lg border border-border/60 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.wikiImages.toLocaleString('fr-FR')}</div>
              <div className="text-sm text-muted-foreground">Images Wikipédia</div>
            </div>
            <div className="rounded-lg border border-border/60 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.wikiLoves.toLocaleString('fr-FR')}</div>
              <div className="text-sm text-muted-foreground">Images Wiki Loves</div>
            </div>
            <div className="rounded-lg border border-border/60 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.saviezVous.toLocaleString('fr-FR')}</div>
              <div className="text-sm text-muted-foreground">Le saviez-vous ?</div>
            </div>
            <div className="rounded-lg border border-border/60 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.proverbes.toLocaleString('fr-FR')}</div>
              <div className="text-sm text-muted-foreground">Proverbes</div>
            </div>
            <div className="rounded-lg border border-border/60 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.citations.toLocaleString('fr-FR')}</div>
              <div className="text-sm text-muted-foreground">Citations</div>
            </div>
            <div className="rounded-lg border border-border/60 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.insolite.toLocaleString('fr-FR')}</div>
              <div className="text-sm text-muted-foreground">Articles insolites</div>
            </div>
            <div className="rounded-lg border border-border/60 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.apod.toLocaleString('fr-FR')}</div>
              <div className="text-sm text-muted-foreground">Images NASA APOD</div>
            </div>
            <div className="rounded-lg border border-border/60 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.airCrash.toLocaleString('fr-FR')}</div>
              <div className="text-sm text-muted-foreground">Enquêtes Air Crash</div>
            </div>
          </div>
        </section>

        {/* ——— SOURCES ——— */}
        <section id="sources" className="pt-6 border-t border-border/40">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Sources des contenus</h2>
          <p className="text-muted-foreground">
           Le contenu de MoinsBête provient de multiples sources de qualité en français :
              Wikipédia, Wiktionary, le journal du CNRS, FreeNewsAPI, Wikimedia Commons,
              Radio France, Pixabay, la Formule 1 (FIA), Wiki Loves, le Portail Lexical,
             Wikiquote, les articles insolites de Wikipédia, la NASA (APOD) et
             Aviation Safety Network (ASN).
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
            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="mb-1 font-semibold">Wiki Loves</h3>
              <p className="text-sm text-muted-foreground">Images du patrimoine mondial</p>
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
              <h3 className="mb-1 font-semibold">Formule 1</h3>
              <p className="text-sm text-muted-foreground">Actualité automobile</p>
              <a
                href="https://www.fia.com/f1"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                fia.com/f1 →
              </a>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="mb-1 font-semibold">Portail Lexical</h3>
              <p className="text-sm text-muted-foreground">Dictionnaires et étymologie</p>
              <a
                href="https://www.portail-lexical.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                portail-lexical.fr →
              </a>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="mb-1 font-semibold">Wikiquote</h3>
              <p className="text-sm text-muted-foreground">Citations célèbres</p>
              <a
                href="https://fr.wikiquote.org"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                fr.wikiquote.org →
              </a>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="mb-1 font-semibold">Articles insolites</h3>
              <p className="text-sm text-muted-foreground">Articles surprenants de Wikipédia</p>
              <a
                href="https://fr.wikipedia.org/wiki/Wikipédia:Articles_insolites"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                wikipédia:articles_insolites →
              </a>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="mb-1 font-semibold">TLFi</h3>
              <p className="text-sm text-muted-foreground">Trésor de la Langue Française informatisé</p>
              <a
                href="https://atlas.atilf.fr/tlfi/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                atlas.atilf.fr/tlfi →
              </a>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="mb-1 font-semibold">NASA APOD</h3>
              <p className="text-sm text-muted-foreground">Astronomy Picture of the Day</p>
              <a
                href="https://apod.nasa.gov/apod/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                apod.nasa.gov →
              </a>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="mb-1 font-semibold">Aviation Safety Network</h3>
              <p className="text-sm text-muted-foreground">Enquêtes sur les accidents d&apos;aviation</p>
              <a
                href="https://aviation-safety.net"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                aviation-safety.net →
              </a>
            </div>
          </div>
        </section>

        {/* ——— AUTEUR & INFRASTRUCTURE ——— */}
        <section id="auteur" className="pt-6 border-t border-border/40">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">L&apos;auteur &amp; infrastructure</h2>
          <p className="text-muted-foreground">
            MoinsBête a été créé par <strong>Antoine Giniès</strong>.
            Le projet s&apos;inspire de la philosophie Deep Stash, popularisée par&nbsp;
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
            Le service MoinsBête est hébergé sur un serveur loué personnellement par Antoine Giniès à des fins personnelles.
            Ce service est offert en l&apos;état et peut être arrêté à tout moment sans annonce préalable.
          </p>
          <p className="mt-3 text-muted-foreground">
            Ceci est un projet de développement à usage personnel uniquement. Le contenu, les fonctionnalités et l&apos;interface peuvent changer sans préavis. L&apos;application n&apos;est pas encore prête pour une utilisation en production.
          </p>
        </section>

        {/* ——— MENTIONS LÉGALES ——— */}
        <section id="mentions" className="pt-6 border-t border-border/40">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Mentions légales</h2>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Licence</h3>
            <p className="text-muted-foreground">
              Ce programme est un logiciel libre: vous pouvez le redistribuer et/ou le modifier conformément aux clauses de la Licence Publique Générale Affero GNU telle que publiée par la Free Software Foundation; soit la version 3 de la Licence, soit (à votre choix) toute version ultérieure.
            </p>
            <p className="mt-2 text-muted-foreground">
              Consultez la licence complète sur{' '}
              <a
                href="https://www.gnu.org/licenses/agpl-3.0.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                gnu.org/licenses/agpl-3.0.html
              </a>
              .
            </p>
          </section>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Code source</h3>
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
          </section>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Vie privée</h3>
            <p className="text-muted-foreground">
              <Link href="/confidentialite" className="text-primary hover:underline">
                Politique de confidentialité
              </Link>
            </p>
          </section>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Cookies</h3>
            <p className="text-muted-foreground">
              MoinsBête utilise un cookie JWT de session pour l&apos;authentification.
              Voir la section cookies dans les{' '}
              <Link href="/mentions-legales" className="text-primary hover:underline">
                mentions légales
              </Link>{' '}
              pour plus de détails.
            </p>
          </section>

          <section className="mt-4">
            <h3 className="mb-2 text-lg font-medium text-foreground/90">Contact</h3>
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
         </section>

         {/* ——— CONDITIONS D'UTILISATION ——— */}
         <section id="conditions" className="pt-6 border-t border-border/40">
           <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Conditions d&apos;utilisation</h2>
           <p className="text-muted-foreground">
             MoinsBête est un service gratuit à usage personnel. Le contenu provient de sources externes et est résumé pour faciliter la lecture. Aucune garantie d&apos;exactitude n&apos;est apportée. Le service peut être modifié ou interrompu à tout moment.
           </p>
           <p className="mt-2 text-muted-foreground">
             Pour le texte complet :{' '}
             <Link href="/conditions-utilisation" className="text-primary hover:underline">
               Conditions d&apos;utilisation complètes
             </Link>
             .
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
