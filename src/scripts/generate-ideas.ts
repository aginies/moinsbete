import 'dotenv/config'
import { prisma } from '../lib/db'
import { slugify } from '../lib/utils'
import { distillIdeas } from '../lib/llm'

const TOPICS_TO_GENERATE = [
  { name: 'Psychologie', count: 60 },
  { name: 'Philosophie', count: 60 },
  { name: 'Sciences cognitives', count: 60 },
  { name: 'Économie', count: 60 },
  { name: 'Communication', count: 60 },
  { name: 'Productivité', count: 60 },
  { name: 'Santé & Bien-être', count: 60 },
  { name: 'Créativité', count: 60 },
  { name: 'Leadership', count: 60 },
  { name: 'Histoire', count: 60 },
  { name: 'Finance & Argent', count: 60 },
  { name: 'Technologie & Innovation', count: 60 },
  { name: 'Sociologie', count: 60 },
  { name: 'Physique', count: 60 },
  { name: 'Cuisine & Alimentation', count: 60 },
  { name: 'Biologie & Évolution', count: 60 },
  { name: 'Mathématiques', count: 60 },
  { name: 'Art & Design', count: 60 },
  { name: 'Débat & Rhétorique', count: 60 },
  { name: 'Chats et chiens', count: 60 },
  { name: 'Golf', count: 60 },
  { name: 'Voitures', count: 60 },
  { name: 'En forme 40+', count: 60 },
]

const TOPIC_ARTICLES: Record<string, string[]> = {
  'Psychologie': [
    'Biais cognitifs', 'Heuristique', 'Dissonance cognitive', 'Intelligence émotionnelle', 'Autonomie psychologique',
    'Théorie de l\'attachement', 'Conditionnement', 'Motivation', 'Stress', 'Croyances',
    'Biais de confirmation', 'Effet Dunning-Kruger', 'Biais des survivants', 'Psychologie cognitive', 'Charge cognitive',
    'Psychologie évolutionniste', 'Conditionnement classique', 'Conditionnement opérant', 'Théorie de l\'apprentissage sociale', 'Intelligence multiple',
    'Thérapie cognitivo-comportementale', 'Syndrome de stress post-traumatique', 'Psychologie positive', 'Angoisse', 'Processus cognitif',
    'Schéma (psychologie)', 'Cognition sociale', 'Autobiographie (mémoire)', 'Théorie de l\'esprit', 'Biais de genre'
  ],
  'Philosophie': [
    'Stoïcisme', 'Existentialisme', 'Épicurisme', 'Utilitarisme', 'Phénoménologie',
    'Rationalisme', 'Empirisme', 'Nihilisme', 'Humanisme', 'Pragmatisme',
    'Éthique', 'Morale', 'Métaphysique', 'Épistémologie', 'Ontologie',
    'Raison', 'Volonté (philosophie)', 'Conscience (philosophie)', 'Liberté (philosophie)', 'Vérité',
    'Justice', 'Beau (philosophie)', 'Absurde (philosophie)', 'Rationalisme (philosophie)', 'Empirisme (philosophie)',
    'Stoïcisme (philosophie)', 'Épicurisme (philosophie)', 'Spinoza', 'Nietzsche', 'Heidegger'
  ],
  'Sciences cognitives': [
    'Neuroplasticité', 'Mémoire de travail', 'Apprentissage', 'Attention', 'Résolution de problèmes',
    'Perception', 'Langage', 'Prise de décision', 'Conscience', 'Métacognition',
    'Cognition', 'Neurosciences cognitives', 'Sciences cognitives', 'Psychologie cognitive', 'Fonctions exécutives',
    'Apprentissage (neurosciences)', 'Perception (psychologie)', 'Langage (psychologie)', 'Attention (psychologie)', 'Linguistique cognitive',
    'Neuropsychologie', 'Imagerie cérébrale', 'Cortex préfrontal', 'Hippocampe', 'Synapse',
    'Plasticité cérébrale', 'Théorie de l\'esprit', 'Modèle mental', 'Expérience de la prison de Stanford', 'Pensée de groupe'
  ],
  'Économie': [
    'Théorie des jeux', 'Aversion à la perte', 'Coût d\'opportunité', 'Incitations', 'Biens publics',
    'Équilibre de Nash', 'Marchés', 'Inflation', 'Commerce international', 'Développement',
    'Économie politique', 'Politique économique', 'Macroéconomie', 'Microéconomie', 'Économie comportementale',
    'Économie du travail', 'Économie internationale', 'Économie publique', 'Économie monétaire', 'Thésaurisation',
    'Richesse', 'Travail (économie)', 'Capital (économie)', 'Produit intérieur brut', 'Parité de pouvoir d\'achat',
    'Déflation', 'Dette publique', 'Mondialisation', 'Oligopole', 'Monopole'
  ],
  'Communication': [
    'Communication non violente', 'Écoute active', 'Narration', 'Persuasion', 'Non-verbal',
    'Communication interculturelle', 'Médiation', 'Présentation', 'Réseaux sociaux', 'Journalisme',
    'Communication humaine', 'Communication non verbale', 'Communication de masse', 'Communication organisationnelle', 'Communication interpersonnelle',
    'Sémiologie', 'Discours', 'Symbolisme', 'Pragmatique linguistique', 'Parole (communication)',
    'Communication visuelle', 'Communication politique', 'Communication scientifique', 'Communication thérapeutique', 'Communication d\'urgence',
    'Communication à risque', 'Argumentation', 'Rhétorique', 'Éloquence', 'Persuasion (communication)'
  ],
  'Productivité': [
    'Deep Work', 'Loi de Pareto', 'GTD', 'Pomodoro', 'Time blocking',
    'Délegation', 'Priorisation', 'Flow', 'Habitudes', 'Gestion du stress',
    'Productivité', 'Productivité marginale', 'Efficacité', 'Efficience', 'Organisation du travail',
    'Tâche (travail)', 'Méthode agile', 'Lean management', 'Six Sigma', 'Kanban',
    'Toyota Production System', 'Fordisme', 'Taylorisme', 'Motivation (psychologie)', 'Rendement',
    'Optimisation', 'Automatisation', 'Workflow', 'Gestion de projet', 'Auto-discipline'
  ],
  'Santé & Bien-être': [
    'Sommeil', 'Exercice', 'Méditation', 'Nutrition', 'Résilience',
    'Gestion du stress', 'Hormones', 'Microbiote', 'Lumière', 'Social',
    'Santé', 'Santé publique', 'Qualité de vie', 'Nutrition (science)', 'Méditation (spiritualité)',
    'Stress (biologie)', 'Système immunitaire', 'Vitamine', 'Antioxydant', 'Probiotique',
    'Régime alimentaire', 'Obésité', 'Maladie cardiovasculaire', 'Hypertension artérielle', 'Diabète',
    'Rêve', 'Métabolisme', 'Minéral', 'Oméga-3', 'Vitamine D'
  ],
  'Créativité': [
    'Pensée latérale', 'Brainstorming', 'Design thinking', 'Inspiration', 'Pratique délibérée',
    'Imagination', 'Art', 'Innovation', 'Collaboration', 'Curiosité',
    'Créativité', 'Processus créatif', 'Idéation', 'Pensée divergente', 'Pensée convergente',
    'Pensée créative', 'Création artistique', 'Pensée analogique', 'Thinking outside the box', 'Inspiration (psychologie)',
    'Imagination (psychologie)', 'Flow (psychologie)', 'Motivation intrinsèque', 'Heuristique', 'Design thinking',
    'Art (esthétique)', 'Curiosité (psychologie)', 'Générosité', 'Esprit critique', 'Pensée créative'
  ],
  'Leadership': [
    'Servant leadership', 'Vision', 'Délégation', 'Feedback', 'Intelligence émotionnelle',
    'Changement', 'Culture d\'entreprise', 'Mentorat', 'Négociation', 'Stratégie',
    'Leadership', 'Leadership situationnel', 'Leadership transformationnel', 'Leadership authentique', 'Styles de management',
    'Autorité', 'Pouvoir (sociologie)', 'Motivation (psychologie)', 'Coaching', 'Gestion du changement',
    'Organisation (société)', 'Équipe', 'Communication interpersonnelle', 'Intelligence collective', 'Servant leadership',
    'Vision', 'Délégation', 'Feedback', 'Culture d\'entreprise', 'Négociation'
  ],
  'Histoire': [
    'Chute de Rome', 'Renaissance', 'Révolution française', 'Guerre froide', 'Révolution industrielle',
    'Antiquité', 'Moyen-âge', 'Colonisation', 'Exploration', 'Diplomatie',
    'Histoire', 'Histoire de l\'humanité', 'Histoire de la France', 'Histoire de l\'Europe', 'Histoire de l\'Asie',
    'Traité (relations internationales)', 'Empire', 'Révolution', 'Monarchie', 'République',
    'Civilisation', 'Dynastie', 'Féodalisme', 'Lumières (philosophie)', 'Antiquité',
    'Moyen Âge', 'Époque moderne', 'Période contemporaine', 'Seconde Guerre mondiale', 'Première Guerre mondiale'
  ],
  'Finance & Argent': [
    'Intérêt composé', 'Bourse', 'Inflation', 'Épargne', 'Cryptomonnaie',
    'Investissement', 'Dettes', 'Budget', 'Assurance', 'Risque',
    'Action (finance)', 'Obligations', 'Fonds d\'investissement', 'Marché financier', 'Taux d\'intérêt',
    'Dividende', 'Capital-risque', 'Assurance-vie', 'Patrimoine', 'Revenu',
    'Fiscalité', 'Banque', 'Crédit', 'Monnaie', 'Trésorerie',
    'Comptabilité', 'Bilan (comptabilité)', 'Investissement boursier', 'Active management', 'Hedge fund'
  ],
  'Technologie & Innovation': [
    'Intelligence artificielle', 'Internet', 'Cloud', 'Cybersécurité', 'Blockchain',
    'Robotique', '5G', 'Open source', 'Internet des objets', 'Informatique quantique',
    'Logiciel', 'Matériel informatique', 'Réseaux informatiques', 'Base de données', 'Algorithmique',
    'Deep learning', 'Machine learning', 'Traitement du langage naturel', 'Vision par ordinateur', 'Nanotechnologie',
    'Imprimerie 3D', 'Biotechnologie', 'Énergie renouvelable', 'Numérique', 'Web 2.0',
    'API', 'Microservice', 'Conteneur (informatique)', 'Virtualisation', 'Edge computing'
  ],
  'Sociologie': [
    'Capital social', 'Inégalité', 'Migration', 'Pouvoir', 'Culture',
    'Éducation', 'Média', 'Urbanisation', 'Globalisation', 'Conformité',
    'Société', 'Socialisation', 'Stratification sociale', 'Mouvement social', 'Deviance',
    'Classe sociale', 'Identité sociale', 'Norme sociale', 'Institution', 'Famille (sociologie)',
    'Religion (sociologie)', 'Travail (sociologie)', 'Urbanisme', 'Démographie', 'Criminalité',
    'Délinquance', 'Jeunesse (sociologie)', 'Genre (sciences sociales)', 'Racisme', 'Ségrégation sociale'
  ],
  'Physique': [
    'Mécanique quantique', 'Relativité', 'Thermodynamique', 'Électromagnétisme', 'Particules',
    'Trous noirs', 'Énergie', 'Ondes', 'Cosmologie', 'Entropie',
    'Mécanique classique', 'Mécanique des fluides', 'Optique', 'Acoustique', 'Physique nucléaire',
    'Physique des particules', 'Modèle standard', 'Supraconductivité', 'Plasma (état de la matière)', 'Gravitation',
    'Champ (physique)', 'Photon', 'Atome', 'Matière noire', 'Énergie noire',
    'Big Bang', 'Mécanique statistique', 'Équation d\'état', 'Constante physique', 'Théorie des cordes'
  ],
  'Cuisine & Alimentation': [
    'Réaction de Maillard', 'Fermentation', 'Épices', 'Nutrition', 'Gastronomie',
    'Pain', 'Fromage', 'Jeûne', 'Umami', 'Conservation des aliments',
    'Cuisine française', 'Cuisine méditerranéenne', 'Cuisine asiatique', 'Cuisine italienne', 'Cuisine japonaise',
    'Cuisine mexicaine', 'Cuisine indienne', 'Cuisine végétarienne', 'Cuisine fusion', 'Sauce',
    'Cuisine moléculaire', 'Terroir (gastronomie)', 'Appellation d\'origine contrôlée', 'Agrotourisme', 'Restauration',
    'Boucherie', 'Boulangerie', 'Pâtisserie', 'Charcuterie', 'Traiteur'
  ],
  'Biologie & Évolution': [
    'ADN', 'Génétique', 'Microbiome', 'Cellule', 'Immunité',
    'Écosystème', 'Biodiversité', 'Neurosciences', 'Anatomie', 'Sélection naturelle',
    'Évolution (biologie)', 'Mutation', 'Clone', 'Biologie moléculaire', 'Biologie cellulaire',
    'Physiologie', 'Biologie du développement', 'Biologie marine', 'Botanique', 'Zoologie',
    'Microbiologie', 'Écologie', 'Parasitologie', 'Immunologie', 'Biotechnologie',
    'Génomique', 'Protéomique', 'Épigénétique', 'Biologie synthétique', 'Taxinomie'
  ],
  'Mathématiques': [
    'Théorème de Bayes', 'Nombres premiers', 'Fibonacci', 'Fractales', 'Probabilités',
    'Statistiques', 'Logique', 'Topologie', 'Algèbre', 'Zéro',
    'Calcul intégral', 'Calcul différentiel', 'Géométrie', 'Arithmétique', 'Théorie des nombres',
    'Analyse mathématique', 'Algèbre linéaire', 'Combinatoire', 'Théorie des ensembles', 'Graphes (mathématiques)',
    'Équations différentielles', 'Géométrie euclidienne', 'Géométrie non-euclidienne', 'Théorie des jeux (mathématiques)', 'Chaîne de Markov',
    'Théorie du chaos', 'Nombres complexes', 'Matrice (mathématiques)', 'Fonction continue', 'Dérivation'
  ],
  'Art & Design': [
    'Renaissance', 'Impressionnisme', 'Bauhaus', 'Minimalisme', 'Photographie',
    'Architecture', 'Design graphique', 'Couleur', 'Typographie', 'Perspective (arts plastiques)',
    'Peinture', 'Sculpture', 'Art contemporain', 'Art moderne', 'Art baroque',
    'Art romantique', 'Art réaliste', 'Art abstrait', 'Design industriel', 'Art déco',
    'Cubisme', 'Surréalisme', 'Expressionnisme', 'Pop art', 'Land art',
    'Graffiti', 'Performance (art)', 'Installation (art)', 'Art numérique', 'Architecture gothique'
  ],
  'Débat & Rhétorique': [
    'Logique', 'Argumentation', 'Propagande', 'Dialectique', 'Pensée critique',
    'Rhétorique', 'Méthode socratique', 'Fallacieux', 'Éthique', 'Éloquence',
    'Syllogisme', 'Argument ad hominem', 'Argument d\'autorité', 'Raisonnement déductif', 'Raisonnement inductif',
    'Raisonnement abductif', 'Argumentation (rhétorique)', 'Discours', 'Argument (logique)', 'Preuve (logique)',
    'Enthymème', 'Topique (rhétorique)', 'Figures de style', 'Paradoxe', 'Sophistique',
    'Argumentation visuelle', 'Critique (rhétorique)', 'Argumentation juridique', 'Argumentation scientifique', 'Logique formelle'
  ],
  'Chats et chiens': [
    'Chat domestique', 'Chien', 'Comportement du chat', 'Comportement du chien', 'Socialisation du chaton',
    'Socialisation du chiot', 'Éducation du chien', 'Langage corporel du chat', 'Langage corporel du chien', 'Intelligence du chien',
    'Anxiété de séparation', 'Jeu chez les animaux domestiques', 'Alimentation du chat', 'Alimentation du chien', 'Race de chat',
    'Race de chien', 'Domestication du chat', 'Domestication du chien', 'Comportement alimentaire félin', 'Comportement alimentaire canin',
    'Chat', 'Chien', 'Ethologie', 'Comportement animal', 'Animal de compagnie',
    'Adoption animale', 'Stérilisation des animaux', 'Vaccination animale', 'Nutrition animale', 'Zootechnie'
  ],
  'Golf': [
    'Golf', 'Vocabulaire_du_golf', 'Swing_de_golf', 'Matériel_de_golf', 'Règles_de_golf',
    'Par_(golf)', 'Compétition_de_golf', 'Balle_de_golf', 'Terrain_de_golf', 'Histoire_du_golf',
    'Étiquette_(golf)', 'Driving_range', 'Tee_(golf)', 'Fairway', 'Green_(golf)',
    'Putter', 'Bunker_(sport)', 'Caddie', 'Handicap_(golf)', 'Jeu_de_golf',
    'Swing (golf)', 'Putt', 'Major (golf)', 'Open britannique', 'PGA Tour',
    'Masters de Augusta', 'Birdie (golf)', 'Eagle (golf)', 'Albatros (golf)', 'Drive (golf)'
  ],
  'Voitures': [
    'Automobile', 'Sécurité_automobile', 'Toyota', 'Tesla,_Inc.', 'Voiture_électrique',
    'Moteur_électrique', 'Carrosserie', 'Batterie_rechargeable', 'Conduite_autonome', 'Formule_1',
    'Industrie_automobile', 'Crédit_à_la_consommation', 'Assurance_automobile', 'Permis_de_conduire', 'Hybride_(automobile)',
    'Tuning', 'Motorisation', 'Transmission_(automobile)', 'Pneu', 'Climatisation',
    'Moteur à combustion interne', 'Moteur diesel', 'Voiture hybride', 'Moteur Wankel', 'Direction assistée',
    'Freinage', 'Suspension (automobile)', 'Carburant', 'Véhicule utilitaire', 'Aérodynamique automobile'
  ],
  'En forme 40+': [
    'Vieillissement', 'Sarcopénie', 'Activité_physique', 'Exercice_physique', 'Neuroplasticité',
    'Ostéoporose', 'Sommeil', 'Ménopause', 'Andropausie', 'Alzheimer',
    'Maladie_cardiovasculaire', 'Hypertension_artérielle', 'Diabète_de_type_2', 'Obésité', 'Méditation',
    'Pleine_conscience', 'Yoga', 'Équilibre_(biologie)', 'Souplesse', 'Nutrition',
    'Protéine', 'Vitamine_D', 'Oméga_3', 'Inflammation', 'Stress_oxydatif',
    'Hormone', 'Testostérone', 'Mémoire', 'Déclin_cognitif', 'Santé_mentale',
    'Isolement_social', 'Exercice aérobie', 'Musculation', 'Flexibilité articulaire', 'Équilibre énergétique',
    'Métabolisme', 'Cardiovasculaire', 'Récupération (sport)', 'Supplément alimentaire', 'Collagène'
  ],
}

async function main() {
  console.log('🚀 Génération d\'idées par topic\n')

  let totalCreated = 0

  // Fetch all topics once
  const allTopics = await prisma.topic.findMany({
    select: { id: true, name: true },
  })
  const topicMap = new Map(allTopics.map(t => [t.name, t]))

  // Fetch all existing ideas with titles for bulk dedup
  const allExistingIdeas = await prisma.idea.findMany({
    select: { id: true, title: true },
  })
  const existingTitles = new Set(allExistingIdeas.map(i => i.title))

  for (const topicData of TOPICS_TO_GENERATE) {
    console.log(`\n📚 ${topicData.name} (${topicData.count} idées)`)

    const topic = topicMap.get(topicData.name)
    if (!topic) {
      console.log(`  ⚠️ Topic introuvable: ${topicData.name}`)
      continue
    }

    // Count existing ideas for this topic
    const existingCount = await prisma.idea.count({
      where: {
        ideaTopics: {
          some: { topicId: topic.id },
        },
      },
    })

    const remaining = topicData.count - existingCount
    if (remaining <= 0) {
      console.log(`  ✓ ${topicData.count} idées existantes, skip`)
      continue
    }

    const articlesToTry = TOPIC_ARTICLES[topicData.name] || []
    let createdForTopic = 0
    const createdTitles = new Set<string>()

    for (const articleName of articlesToTry) {
      if (createdForTopic >= remaining) {
        console.log(`  ✓ Objectif atteint (${topicData.count} idées)`)
        break
      }

      // Fetch article
      const WIKIPEDIA_API = 'https://fr.wikipedia.org/api/rest_v1'
      let summary = null
      const variations = [
        articleName.replace(/ /g, '_'),
        articleName.replace(/ /g, '%20'),
        articleName,
      ]
      
      for (const v of variations) {
        try {
          const res = await fetch(`${WIKIPEDIA_API}/page/summary/${v}`, {
            headers: { 'User-Agent': 'moinsbete/1.0 (contact: antoine@ginies.org)' },
          })
          if (res.ok) {
            const data = await res.json()
            if (data.type !== 'disambiguation' && data.extract) {
              summary = data
              break
            }
          }
        } catch {
          // try next
        }
      }

      if (!summary?.extract) {
        console.log(`  ⚠️ Article non trouvé: ${articleName}`)
        continue
      }

      // Distill ideas
      const ideasData = await distillIdeas(
        articleName,
        summary.extract,
        `https://fr.wikipedia.org/wiki/${encodeURIComponent(articleName)}`
      )

      if (ideasData.length === 0) {
        console.log(`  ⚠️ Aucune idée générée pour ${articleName}`)
        continue
      }

      for (const ideaData of ideasData) {
        if (existingTitles.has(ideaData.title) || createdTitles.has(ideaData.title)) {
          continue
        }

        const source = await prisma.source.upsert({
          where: { slug: slugify(articleName) },
          update: {},
          create: {
            title: articleName,
            slug: slugify(articleName),
            type: 'WIKIPEDIA',
            url: `https://fr.wikipedia.org/wiki/${encodeURIComponent(articleName)}`,
          },
        })

        try {
          await prisma.idea.create({
            data: {
              title: ideaData.title,
              content: ideaData.content,
              takeaway: ideaData.takeaway,
              slug: `${slugify(ideaData.title)}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              sourceId: source.id,
              ideaTopics: {
                create: [{ topicId: topic.id }],
              },
            },
          })
          totalCreated++
          createdForTopic++
          createdTitles.add(ideaData.title)
          console.log(`  ✓ ${ideaData.title}`)
        } catch {
          // skip duplicates
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log(`\n✅ ${totalCreated} nouvelles idées créées`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
