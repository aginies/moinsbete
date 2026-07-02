import 'dotenv/config'
import { prisma } from '../lib/db'
import { slugify } from '../lib/utils'

const IDEAS = [
  // Psychologie
  {
    title: "L'effet Dunning-Kruger",
    content: "Les personnes peu compétentes dans un domaine ont tendance à surestimer leurs compétences, tandis que les experts sous-estiment les leurs. Ce biais cognitif montre que le manque de connaissance crée à la fois l'erreur et l'incapacité de la reconnaître.",
    takeaway: "Quand vous êtes certain d'avoir raison, demandez-vous : est-ce que je manque d'information que je n'ai pas conscience d'avoir ?",
    sourceTitle: "Effet Dunning-Kruger",
    topicNames: ['Psychologie']
  },
  {
    title: "Le biais de confirmation",
    content: "Nous avons tendance à chercher, interpréter et mémoriser les informations qui confirment nos croyances existantes. Ce biais nous rend aveugles aux preuves contraires et renforce nos préjugés.",
    takeaway: "Cherchez activement des sources qui contredisent votre opinion. Si vous ne pouvez pas argumenter le point de vue opposé, vous ne le comprenez pas vraiment.",
    sourceTitle: "Biais cognitifs",
    topicNames: ['Psychologie']
  },
  {
    title: "L'heuristique de disponibilité",
    content: "Nous évaluons la probabilité des événements selon la facilité avec laquelle des exemples nous viennent à l'esprit. Les événements dramatiques ou récents semblent plus fréquents qu'ils ne le sont réellement.",
    takeaway: "Ne basez pas vos décisions sur ce qui est le plus mémorable ou émotionnel. Cherchez des données statistiques objectives.",
    sourceTitle: "Heuristique (psychologie)",
    topicNames: ['Psychologie']
  },
  {
    title: "La dissonance cognitive",
    content: "Leon Festinger a montré que nous ressentons une tension psychologique quand nos actions contredisent nos croyances. Pour réduire cette discomfort, nous changeons soit nos croyances soit nos comportements.",
    takeaway: "Identifiez vos dissonances : quelles actions faites-vous qui vont à l'encontre de vos valeurs ? C'est souvent là que se cache votre potentiel de croissance.",
    sourceTitle: "Dissonance cognitive",
    topicNames: ['Psychologie']
  },
  {
    title: "L'effet de cadrage",
    content: "La façon dont une information est présentée change radicalement notre décision. Par exemple, '90% de réussite' est préféré à '10% d'échec', alors que les deux statistiques sont identiques.",
    takeaway: "Quand on vous présente un choix, reformulez-le mentalement dans l'autre sens. Cela vous révèle souvent la vraie nature de la décision.",
    sourceTitle: "Heuristique (psychologie)",
    topicNames: ['Psychologie']
  },

  // Philosophie
  {
    title: "Le cercle vertueux stoïcien",
    content: "Les stoïciens distinguent ce qui dépend de nous (nos jugements, nos actions) de ce qui n'en dépend pas (la réputation, la richesse, la santé). Concentrer son énergie sur le premier cercle apporte la tranquillité.",
    takeaway: "Chaque matin, listez ce que vous pouvez contrôler aujourd'hui et ce que vous ne pouvez pas. Investissez votre énergie uniquement dans le premier groupe.",
    sourceTitle: "Stoïcisme",
    topicNames: ['Philosophie']
  },
  {
    title: "L'existence précède l'essence",
    content: "Sartre affirme que contrairement aux objets fabriqués (qui ont une essence prédéfinie), l'être humain existe d'abord, puis se définit par ses actions. Nous sommes condamnés à être libres.",
    takeaway: "Vous n'êtes pas vos circonstances, vos gènes ou votre passé. Vous êtes la somme de vos choix. Chaque instant est une opportunité de vous redéfinir.",
    sourceTitle: "Existentialisme",
    topicNames: ['Philosophie']
  },
  {
    title: "Le doute méthodique",
    content: "Descartes a remis en question toutes ses croyances jusqu'à trouver une vérité indubitable : 'Je pense, donc je suis'. Le doute n'est pas une fin en soi, mais un outil pour fonder une connaissance solide.",
    takeaway: "Questionnez vos certitudes les plus profondes. Ce qui résiste au doute le plus rigoureux mérite d'être conservé.",
    sourceTitle: "Pensée critique",
    topicNames: ['Philosophie']
  },
  {
    title: "L'amor fati",
    content: "Nietzsche propose d'aimer non seulement ce qui nous arrive, mais de le souhaiter tel quel. L'amour du destin transforme l'adversité en opportunité de croissance.",
    takeaway: "Au lieu de subir les événements, demandez-vous : 'Comment puis-je utiliser cela ?' Chaque expérience devient alors une ressource.",
    sourceTitle: "Stoïcisme",
    topicNames: ['Philosophie']
  },
  {
    title: "Le paradoxe de la tolérance",
    content: "Popper montre qu'une société totalement tolérante finit par être détruite par les intolérants. Pour maintenir la tolérance, il faut être intolérant envers l'intolérance.",
    takeaway: "Les limites de la tolérance ne sont pas une contradiction mais une nécessité. Protégez les espaces de dialogue en excluant ceux qui les détruisent.",
    sourceTitle: "Pensée critique",
    topicNames: ['Philosophie']
  },

  // Sciences cognitives
  {
    title: "La neuroplasticité",
    content: "Le cerveau n'est pas fixe : il se réorganise tout au long de la vie en réponse à l'expérience. Chaque apprentissage crée de nouvelles connexions neuronales, chaque pratique renforce les circuits existants.",
    takeaway: "Apprenez quelque chose de nouveau chaque jour. Votre cerveau physique change structurellement avec chaque effort cognitif.",
    sourceTitle: "Neuroplasticité",
    topicNames: ['Sciences cognitives']
  },
  {
    title: "La mémoire de travail",
    content: "Notre mémoire de travail ne peut contenir que 4 à 7 éléments simultanément. C'est le goulot d'étranglement de la cognition : tout ce qui dépasse cette capacité doit être externalisé ou simplifié.",
    takeaway: "Quand vous apprendrez quelque chose de complexe, divisez-le en chunks de 4 éléments maximum. C'est la limite naturelle de votre cerveau.",
    sourceTitle: "Mémoire de travail",
    topicNames: ['Sciences cognitives']
  },
  {
    title: "L'effet despacing",
    content: "Réviser espacé dans le temps est bien plus efficace qu'une révision intensive. Le cerveau consolide les souvenirs pendant les périodes de repos, pas pendant l'étude.",
    takeaway: "Révisez un concept 1 jour après, puis 3 jours après, puis 1 semaine après. Chaque espacement renforce significativement la rétention.",
    sourceTitle: "Mémoire de travail",
    topicNames: ['Sciences cognitives']
  },
  {
    title: "L'apprentissage actif",
    content: "Le cerveau retient 10% de ce qu'il lit, 20% de ce qu'il entend, mais 90% de ce qu'il fait. L'apprentissage passif est inefficace comparé à l'apprentissage par la pratique.",
    takeaway: "Transformez chaque concept que vous lisez en une action immédiate. Appliquez-le, enseignez-le, ou testez-le dans les 24 heures.",
    sourceTitle: "Neuroplasticité",
    topicNames: ['Sciences cognitives']
  },
  {
    title: "Le flow cognitif",
    content: "Mihaly Csikszentmihalyi a identifié l'état de flow : quand le défi correspond exactement à nos compétences, nous entrons dans un état de concentration optimale où le temps semble s'arrêter.",
    takeaway: "Pour entrer en flow, ajustez la difficulté de la tâche à votre niveau actuel. Trop facile = ennui, trop difficile = anxiété. Visez juste au-dessus de votre zone de confort.",
    sourceTitle: "Flow (psychologie)",
    topicNames: ['Sciences cognitives']
  },

  // Économie
  {
    title: "L'aversion à la perte",
    content: "Kahneman et Tversky ont démontré que perdre 100€ fait plus mal que gagner 100€ ne fait plaisir. Nous sommes biologiquement programmés pour éviter les pertes plus que pour chercher les gains.",
    takeaway: "Quand vous hésitez à prendre un risque, demandez-vous : est-ce que je suis guidé par la peur de perdre ou par une analyse rationnelle ?",
    sourceTitle: "Aversion à la perte",
    topicNames: ['Économie']
  },
  {
    title: "La théorie des jeux et le dilemme du prisonnier",
    content: "Dans le dilemme du prisonnier, la coopération mutuelle est optimale, mais la trahison individuelle est rationnelle. Répété plusieurs fois, la stratégie 'œil pour œil' (coopérer d'abord, puis imiter l'action précédente) devient optimale.",
    takeaway: "Dans les relations répétées, la coopération gagnant-gagnant émerge naturellement si on commence par faire confiance et qu'on répond aux trahisons par la retenue.",
    sourceTitle: "Théorie des jeux",
    topicNames: ['Économie']
  },
  {
    title: "Le coût irrécupérable",
    content: "Nous continuons souvent dans une mauvaise direction parce que nous avons déjà investi du temps, de l'argent ou de l'énergie. Rationallement, seul le futur compte : les coûts passés sont irrécupérables.",
    takeaway: "Arrêtez un projet qui ne fonctionne pas, même si vous y avez beaucoup investi. Le meilleur moment pour arrêter était hier, le deuxième meilleur est maintenant.",
    sourceTitle: "Aversion à la perte",
    topicNames: ['Économie']
  },
  {
    title: "L'effet de dotation",
    content: "Nous surévaluons ce que nous possédons simplement parce que c'est à nous. Un objet vaut 50% de plus pour son propriétaire que pour un acheteur potentiel, créant des inefficacités dans les échanges.",
    takeaway: "Quand vous vendez quelque chose, imaginez que vous devez le racheter au prix demandé. C'est là sa vraie valeur pour vous.",
    sourceTitle: "Théorie des jeux",
    topicNames: ['Économie']
  },
  {
    title: "Les incitations perverses",
    content: "Toute politique crée des incitations. Quand on mesure et récompense certains indicateurs, les gens optimisent pour ces indicateurs au détriment de l'objectif réel. C'est la loi de Goodhart.",
    takeaway: "Avant de mettre en place un système de mesure, demandez : comment les gens pourraient-ils tricher avec cet indicateur ?",
    sourceTitle: "Théorie des jeux",
    topicNames: ['Économie']
  },

  // Communication
  {
    title: "La communication non violente",
    content: "Marshall Rosenberg a développé une méthode en 4 étapes : observer sans juger, exprimer ses sentiments, identifier ses besoins, formuler une demande claire. Cette approche désamorce les conflits et crée de l'empathie.",
    takeaway: "Remplacez 'Tu es irrespectueux' par 'Quand tu me coupes la parole, je me sens frustré parce que j'ai besoin d'être entendu. Pourrais-tu me laisser finir ?'",
    sourceTitle: "Communication non violente",
    topicNames: ['Communication']
  },
  {
    title: "L'art de la négociation",
    content: "Chris Voss montre que les négociations réussies ne sont pas des compromis mais des explorations des besoins cachés. Poser des questions calibrées ('Comment puis-je faire ça ?') et mirrorer les mots de l'autre crée la coopération.",
    takeaway: "En négociation, parlez moins que l'autre. Les silences et les questions ouvertes révèlent plus que les arguments.",
    sourceTitle: "Communication non violente",
    topicNames: ['Communication']
  },
  {
    title: "L'effet de halo",
    content: "Nous attribuons automatiquement des qualités positives (intelligence, honnêteté) aux personnes physiquement attirantes. Ce biais influence les embauches, les jugements et les relations sociales.",
    takeaway: "Dans vos décisions importantes, listez explicitement les critères objectifs avant de vous laisser influencer par l'impression globale.",
    sourceTitle: "Biais cognitifs",
    topicNames: ['Communication']
  },
  {
    title: "La règle des 3 secondes",
    content: "En communication, les 3 premières secondes d'une interaction déterminent 70% de l'impression globale. Le langage corporel, le ton de voix et le contact visuel comptent plus que les mots eux-mêmes.",
    takeaway: "Avant chaque interaction importante, prenez 3 secondes pour respirer, sourire et établir un contact visuel. Cela change radicalement la dynamique.",
    sourceTitle: "Communication non violente",
    topicNames: ['Communication']
  },
  {
    title: "L'écoute active",
    content: "Écouter n'est pas attendre son tour de parler. L'écoute active consiste à reformuler ce que l'autre dit pour vérifier sa compréhension, puis à poser des questions pour approfondir.",
    takeaway: "Dans chaque conversation, essayez de reformuler le point de l'autre avant de répondre. Si vous avez tort, vous apprendrez. Si vous avez raison, vous aurez créé un lien.",
    sourceTitle: "Communication non violente",
    topicNames: ['Communication']
  },

  // Productivité
  {
    title: "La loi de Pareto (80/20)",
    content: "80% des résultats viennent de 20% des efforts. Dans la plupart des domaines, une minorité d'actions crée la majorité de la valeur. Identifier et聚焦er sur ce 20% est la clé de l'efficacité.",
    takeaway: "Listez toutes vos tâches. Identifiez les 20% qui créent 80% de votre impact. Délégez, automatisez ou éliminez le reste.",
    sourceTitle: "Loi de Pareto",
    topicNames: ['Productivité']
  },
  {
    title: "Le Deep Work",
    content: "Cal Newport montre que la capacité de concentration intense sans distraction est de plus en plus rare et précieuse. Les travaux cognitivement exigeants nécessitent des blocs de 2-4 heures sans interruption.",
    takeaway: "Bloquez 2 heures chaque matin pour votre travail le plus important. Téléphone éteint, notifications désactivées. C'est là que se joue votre avantage concurrentiel.",
    sourceTitle: "Deep Work",
    topicNames: ['Productivité']
  },
  {
    title: "La règle des 2 minutes",
    content: "Si une tâche prend moins de 2 minutes, faites-la immédiatement. Cela évite l'accumulation de petites tâches qui créent une charge mentale et un stress constant.",
    takeaway: "Appliquez cette règle à votre boîte mail, votre liste de courses, vos messages. Les petites actions immédiates libèrent l'esprit pour les grandes.",
    sourceTitle: "Loi de Pareto",
    topicNames: ['Productivité']
  },
  {
    title: "L'art de dire non",
    content: "Chaque 'oui' est un 'non' à autre chose. Dire non aux distractions, aux réunions inutiles et aux projets mineurs est essentiel pour protéger son temps et son énergie.",
    takeaway: "Avant de dire oui à une demande, demandez-vous : est-ce que cela m'approche de mes objectifs principaux ou m'en éloigne ?",
    sourceTitle: "Deep Work",
    topicNames: ['Productivité']
  },
  {
    title: "La technique Pomodoro",
    content: "Travailler par intervals de 25 minutes de concentration suivis de 5 minutes de pause. Après 4 cycles, prendre une pause plus longue. Cette méthode maintient la concentration et prévient l'épuisement.",
    takeaway: "Même si vous n'utilisez pas le timer, le principe est valable : travaillez par blocs concentrés avec des pauses régulières. C'est ainsi que fonctionne notre attention.",
    sourceTitle: "Deep Work",
    topicNames: ['Productivité']
  },

  // Santé & Bien-être
  {
    title: "L'importance du sommeil",
    content: "Pendant le sommeil, le cerveau consolide les memories, élimine les toxines et régule les émotions. Dormir moins de 7 heures par nuit augmente significativement les risques de maladies chroniques et réduit les performances cognitives.",
    takeaway: "Protégez votre sommeil comme votre bien le plus précieux. 7-9 heures par nuit, à heures régulières, sans écrans 1 heure avant.",
    sourceTitle: "Cercle vertueux",
    topicNames: ['Santé & Bien-être']
  },
  {
    title: "Le pouvoir de l'exercice",
    content: "L'exercice physique n'est pas seulement bon pour le corps : il stimule la neurogenèse, améliore l'humeur, réduit le stress et augmente la capacité cognitive. 30 minutes par jour suffisent.",
    takeaway: "Quand vous manquez de motivation, bougez. L'exercice est le meilleur antidépresseur naturel et le meilleur améliorateur de concentration.",
    sourceTitle: "Cercle vertueux",
    topicNames: ['Santé & Bien-être']
  },
  {
    title: "La méditation de pleine conscience",
    content: "10 minutes de méditation quotidienne modifient la structure du cerveau après 8 semaines : augmentation du cortex préfrontal (décision, concentration) et réduction de l'amygdale (stress, anxiété).",
    takeaway: "Commencez par 5 minutes par jour. Asseyez-vous, fermez les yeux, et observez votre respiration. Quand votre esprit vagabonde, ramenez-le doucement. C'est l'exercice.",
    sourceTitle: "Cercle vertueux",
    topicNames: ['Santé & Bien-être']
  },
  {
    title: "La résilience psychologique",
    content: "La résilience n'est pas une qualité innée mais une compétence qui se développe. Elle repose sur 4 piliers : l'acceptation de l'imprévisible, la conviction que l'effort compte, et la recherche de sens dans l'adversité.",
    takeaway: "Face à l'adversité, posez-vous 3 questions : Est-ce que je peux accepter cette situation ? Ai-je des actions concrètes à faire ? Quel sens puis-je y trouver ?",
    sourceTitle: "Résilience (psychologie)",
    topicNames: ['Santé & Bien-être']
  },
  {
    title: "L'impact de la nutrition sur le cerveau",
    content: "Le cerveau consomme 20% de l'énergie corporelle malgré ses 2% du poids. Une alimentation riche en oméga-3, antioxydants et glucides complexes améliore significativement la cognition et l'humeur.",
    takeaway: "Votre cerveau est un organe comme un autre : nourrissez-le correctement. Poissons gras, noix, fruits rouges et légumes verts sont ses meilleurs amis.",
    sourceTitle: "Cercle vertueux",
    topicNames: ['Santé & Bien-être']
  },

  // Créativité
  {
    title: "La pensée latérale",
    content: "Edward de Bono a montré que la créativité vient souvent de changer de perspective plutôt que d'intensifier l'effort dans la même direction. Résoudre un problème par le côté plutôt que de front.",
    takeaway: "Quand vous êtes bloqué, changez radicalement de perspective. Imaginez que vous êtes un enfant, un expert d'un autre domaine, ou que les règles sont inversées.",
    sourceTitle: "Créativité",
    topicNames: ['Créativité']
  },
  {
    title: "Le principe de combinaison",
    content: "La plupart des innovations ne sont pas des inventions ex nihilo mais des combinaisons nouvelles d'éléments existants. Steve Jobs a combiné calligraphie et technologie pour créer les polices Mac.",
    takeaway: "Connectez des concepts de domaines différents. La créativité est souvent un processus de recombinaison plus que de création pure.",
    sourceTitle: "Créativité",
    topicNames: ['Créativité']
  },
  {
    title: "La contrainte créative",
    content: "Paradoxalement, les contraintes stimulent la créativité. Un cadre limité force le cerveau à trouver des solutions innovantes qu'il n'aurait pas explorées en situation de liberté totale.",
    takeaway: "Au lieu de chercher plus d'options, imposez-vous des contraintes artificielles. 'Comment résoudre ce problème avec seulement 3 outils ?'",
    sourceTitle: "Créativité",
    topicNames: ['Créativité']
  },
  {
    title: "Le pouvoir du brouillon",
    content: "Anne Lamott appelle cela le 'brouillon pourri'. Accepter que la première version sera imparfaite libère la créativité. Le perfectionnisme est l'ennemi de la création.",
    takeaway: "Écrivez d'abord mal, ensuite améliorez. La première version a pour seul but d'exister. La magie opère dans la réécriture.",
    sourceTitle: "Créativité",
    topicNames: ['Créativité']
  },
  {
    title: "L'inspiration par la pratique",
    content: "Beethoven ne attendait pas l'inspiration : il composait tous les jours. L'inspiration vient souvent pendant l'action, pas avant. Commencer est souvent le plus difficile, mais aussi le plus transformateur.",
    takeaway: "Ne cherchez pas l'inspiration : créez les conditions pour qu'elle vienne. Pratiquez régulièrement, et l'inspiration suivra.",
    sourceTitle: "Créativité",
    topicNames: ['Créativité']
  },

  // Leadership
  {
    title: "Le leadership serviteur",
    content: "Robert Greenleaf a imaginé un leader qui commence par le désir de servir, puis choisit de lider. Ce leader se concentre sur le développement de son équipe plutôt que sur son propre pouvoir.",
    takeaway: "Avant de demander à votre équipe de faire quelque chose, demandez-vous : comment puis-je d'abord les servir pour qu'ils puissent réussir ?",
    sourceTitle: "Leadership transformationnel",
    topicNames: ['Leadership']
  },
  {
    title: "La délégation efficace",
    content: "Déléguer n'est pas se débarrasser de tâches mais développer les compétences de son équipe. Une bonne délégation explique le 'pourquoi', définit les résultats attendus, et donne l'autonomie sur le 'comment'.",
    takeaway: "Quand vous déléguez, dites : 'Voici le résultat attendu. Comment comptes-tu l'atteindre ?' Puis écoutez.",
    sourceTitle: "Leadership transformationnel",
    topicNames: ['Leadership']
  },
  {
    title: "La rétroaction constructive",
    content: "La rétroaction efficace est spécifique, opportune et orientée vers l'action. Elle se concentre sur le comportement, pas sur la personne, et propose des alternatives concrètes.",
    takeaway: "Utilisez la formule SBI : Situation (quand), Behavior (ce qui s'est passé), Impact (l'effet). Puis demandez : 'Comment pouvons-nous améliorer ça ?'",
    sourceTitle: "Leadership transformationnel",
    topicNames: ['Leadership']
  },
  {
    title: "La vision partagée",
    content: "Les grandes équipes ne sont pas motivées par des objectifs individuels mais par une vision commune. Créer cette vision nécessite de connecter le travail quotidien à un sens plus large.",
    takeaway: "Chaque semaine, rappelez à votre équipe : comment notre travail d'aujourd'hui sert notre vision à long terme ?",
    sourceTitle: "Leadership transformationnel",
    topicNames: ['Leadership']
  },
  {
    title: "L'intelligence émotionnelle au travail",
    content: "Daniel Goleman a montré que l'IE est souvent plus predictive du succès professionnel que le QI. Reconnaître ses émotions et celles des autres, les réguler, les utiliser pour guider la pensée.",
    takeaway: "Avant de prendre une décision importante, identifiez vos émotions actuelles. Une décision prise sous le coup de la colère ou de l'euphorie est rarement optimale.",
    sourceTitle: "Intelligence émotionnelle",
    topicNames: ['Leadership']
  },

  // Histoire
  {
    title: "Les leçons de l'histoire romaine",
    content: "L'Empire romain s'est effondré non pas par une invasion externe mais par des problèmes internes : inflation, corruption, inégalités croissantes et perte de cohésion sociale. Les civilisations meurent souvent de l'intérieur.",
    takeaway: "Surveillez les signes de déclin dans vos projets et organisations : la complaisance et la corruption sont plus dangereuses que les crises externes.",
    sourceTitle: "Histoire",
    topicNames: ['Histoire']
  },
  {
    title: "Le cycle des révolutions",
    content: "Les révolutions commencent par l'espoir, passent par la radicalisation, puis aboutissent souvent à un nouvel ordre autoritaire. Comprendre ce cycle aide à anticiper les dérives.",
    takeaway: "Dans tout mouvement de changement, restez vigilant contre la radicalisation. Les extrêmes, même bien intentionnés, finissent par détruire ce qu'ils voulaient protéger.",
    sourceTitle: "Histoire",
    topicNames: ['Histoire']
  },
  {
    title: "L'importance de la préparation",
    content: "Napoléon disait : 'La chance favorise les esprits préparés.' Les grandes opportunités vont à ceux qui ont déjà développé les compétences et les ressources pour les saisir.",
    takeaway: "Investissez dans votre préparation continue. Quand l'opportunité arrivera, vous devez être prêt à la saisir.",
    sourceTitle: "Histoire",
    topicNames: ['Histoire']
  },
  {
    title: "La résilience des sociétés",
    content: "Les sociétés qui survivent aux crises sont celles qui ont développé une diversité de compétences, des réseaux de solidarité et une capacité d'adaptation. La monoculture est toujours fragile.",
    takeaway: "Développez des compétences variées et construisez des réseaux solides. La diversité et la connexion sont vos meilleurs assurances contre l'incertitude.",
    sourceTitle: "Histoire",
    topicNames: ['Histoire']
  },
 {
    title: "Les erreurs répétées",
    content: "Santayana disait : 'Ceux qui ne peuvent se souvenir du passé sont condamnés à le répéter.' Les erreurs historiques se répètent non par ignorance mais par oubli des leçons apprises.",
    takeaway: "Documentez vos erreurs et celles des autres. Créez un 'retour d'expérience' accessible à tous. L'histoire est votre meilleure école.",
    sourceTitle: "Histoire",
    topicNames: ['Histoire']
  },

  // Voitures
  {
    title: "La sécurité passive vs active",
    content: "La sécurité active prévient l'accident (ABS, contrôle de stabilité, freinage d'urgence). La sécurité passive protège pendant l'accident (ceintures, airbags, structure déformable). Les deux sont essentielles et complémentaires.",
    takeaway: "Achetez une voiture avec au moins 6 airbags, ESP, et un score Euro NCAP de 5 étoiles. La technologie sauve des vies avant même que l'erreur humaine ne se produise.",
    sourceTitle: "Sécurité automobile",
    topicNames: ['Voitures']
  },
  {
    title: "L'évolution du moteur : de la vapeur à l'électrique",
    content: "En 200 ans, le moteur a évolué de la vapeur à l'explosion, au diesel, puis à l'électrique. Chaque transition a pris 20-30 ans. L'électrique n'est pas une mode : c'est la conséquence logique d'une énergie plus propre et plus efficace.",
    takeaway: "Un moteur électrique a 90% de rendement contre 35% pour un thermique. La technologie n'est pas parfaite, mais la direction est claire.",
    sourceTitle: "Moteur électrique",
    topicNames: ['Voitures']
  },
  {
    title: "Le paradoxe du conducteur automatique",
    content: "Les voitures autonomes promises depuis 60 ans n'existent pas encore en version complète. La dernière 1% est la plus difficile : gérer les situations imprévisibles demande plus qu'une simple accumulation de données.",
    takeaway: "La technologie complexe semble facile jusqu'au dernier 10%, puis difficile jusqu'à ce qu'elle marche. La patience et l'itération sont clés.",
    sourceTitle: "Voiture autonome",
    topicNames: ['Voitures']
  },
  {
    title: "L'impact caché de l'industrie automobile",
    content: "Une voiture moyenne contient 30000 pièces, 50kg de plastiques, et nécessite l'extraction de 1,5 tonne de minerais pour sa batterie électrique. L'empreinte carbone de fabrication d'un EV représente 30-40% de plus qu'un thermique.",
    takeaway: "La voiture électrique n'est 'propre' qu'après 2-3 ans d'utilisation. Penser cycle de vie complet : moins de km, covoiturage, et transports en commun restent les choix les plus durables.",
    sourceTitle: "Industrie automobile",
    topicNames: ['Voitures']
  },
  {
    title: "Pourquoi les Japonais dominent l'automobile",
    content: "Toyota vend plus de voitures que les 5 constructeurs européens combinés. Le secret ? Le 'Kaizen' : amélioration continue, zéro défaut, et une culture où chaque ouvrier peut arrêter la chaîne. La qualité japonaise n'est pas un accident, c'est un système.",
    takeaway: "L'excellence vient de petits efforts quotidiens répétés, pas de révolutions. Améliorez 1% chaque jour : dans 3 ans, vous serez 30x meilleur.",
    sourceTitle: "Toyota",
    topicNames: ['Voitures']
  },
  {
    title: "La révolution Tesla et l'ouverture des brevets",
    content: "En 2014, Elon Musk annonce que Tesla ouvre tous ses brevets. Ironiquement, cela n'a pas tué Tesla mais a accéléré toute l'industrie vers l'électrique. En créant le marché, Tesla l'a dominé. Ouvrir ses brevets est une stratégie de leadership, pas de générosité.",
    takeaway: "Le vrai leader ne protège pas ses avantages : il change les règles du jeu pour que tout le monde joue selon ses standards.",
    sourceTitle: "Tesla, Inc.",
    topicNames: ['Voitures']
  },
  {
    title: "Le coût réel d'une voiture",
    content: "Acheter une voiture représente 15-20% du prix total sur 10 ans. Les 80% restants : assurance, carburant, entretien, parking, taxes, amortissement. Une Toyota coûtant 10000€ de moins qu'une BMW peut coûter 30000€ de plus sur sa durée de vie.",
    takeaway: "Le prix d'achat est le moindre des coûts. Calculez le coût total de possession avant d'acheter. Souvent, la voiture la moins chère à l'achat est la plus chère à posséder.",
    sourceTitle: "Automobile",
    topicNames: ['Voitures']
  },
  {
    title: "L'ingénierie de crash et les leçons de mort",
    content: "Henry Ford a dit que la voiture du futur coûterait si peu que 'quiconque pourrait conduire'. Il mourut dans un accident de voiture. Chaque normes de sécurité moderne (ceinture, airbag, zone de déformation) est née d'une tragédie. La sécurité automobile est construite sur le sang.",
    takeaway: "Les meilleures protections viennent des pires erreurs. Ne cachez pas les échecs : documentez-les, apprenez-en, et protégez les autres.",
    sourceTitle: "Sécurité automobile",
    topicNames: ['Voitures']
  },
  {
    title: "Le design italien : forme vs fonction",
    content: "Pininfarina, Bertone, Ghia : les carrossiers italiens ont défini l'élégance automobile depuis les années 1930. Ferrari, Lamborghini, Alfa Romeo : l'Italie a fait de la voiture un art. Mais la forme sans fonction est dangereuse : le design italien a aussi produit des voitures peu fiables.",
    takeaway: "L'équilibre entre esthétique et fonctionnalité est essentiel. Une belle voiture qui ne fonctionne pas est un objet de musée, pas un produit.",
    sourceTitle: "Carrosserie automobile",
    topicNames: ['Voitures']
  },
  {
    title: "La course au kilomètre : autonomie des électriques",
    content: "En 2010, une Nissan Leaf faisait 100km. En 2024, une Tesla Model S fait 600km. Mais le test WLTP est optimiste : par froid hivernal, l'autonomie chute de 30-40%. La course aux chiffres est réelle, mais la réalité terrain diffère.",
    takeaway: "Méfiez-vous des specs marketing. Testez toujours en conditions réelles : froid, autoroute, climatisation. L'autonomie réelle est ce qui compte, pas le chiffre sur le site.",
    sourceTitle: "Batterie rechargeable",
    topicNames: ['Voitures']
  },

  // Finance & Argent
  {
    title: "L'intérêt composé : la 8ème merveille du monde",
    content: "Einstein appelait l'intérêt composé la 8ème merveille du monde. 100€ investis à 7% par an doublent tous les 10 ans. Le secret : commencer tôt et laisser le temps travailler. Un investissement de 200€/mois à 25 ans vaut 4x plus qu'un investissement de 400€/mois à 40 ans.",
    takeaway: "Chaque euro investi aujourd'hui vaut 2 euros dans 10 ans. Commencer à 25 ans plutôt qu'à 35 ans peut faire 500000€ de différence à la retraite.",
    sourceTitle: "Intérêt composé",
    topicNames: ['Finance & Argent']
  },
  {
    title: "La règle des 50/30/20",
    content: "50% de vos revenus pour les besoins (logement, nourriture, transports), 30% pour les envies (loisirs, restaurants), 20% pour l'épargne et le remboursement de dettes. Cette règle simple structure les finances personnelles sans micro-gestion.",
    takeaway: "Automatisez vos virements le jour de la paie : vers épargne, vers investissement. Ce que vous ne voyez pas, vous ne le dépensez pas.",
    sourceTitle: "Budget personnel",
    topicNames: ['Finance & Argent']
  },
  {
    title: "Le piège du crédit revolving",
    content: "Un crédit revolving à 18% d'intérêt signifie que rembourser le minimum chaque mois peut prendre 20 ans pour payer un achat de 1000€. Au final, vous paierez plus de 2000€. C'est le piège financier le plus courant.",
    takeaway: "N'utilisez un crédit revolving que si vous pouvez rembourser intégralement chaque mois. Sinon, c'est un piège mathématique garanti.",
    sourceTitle: "Crédit à la consommation",
    topicNames: ['Finance & Argent']
  },
  {
    title: "La diversification : ne pas mettre tous ses œufs dans le même panier",
    content: "Markowitz a montré qu'un portefeuille diversifié offre un meilleur rendement pour un risque donné. Actions, obligations, immobilier, or : chaque classe d'acteurs réagit différemment aux crises. La diversification est le seul 'dîner gratuit' de la finance.",
    takeaway: "Investissez dans des index mondiaux (MSCI World) plutôt que de choisir des actions individuelles. Vous réduisez le risque sans sacrifier le rendement.",
    sourceTitle: "Théorie moderne du portefeuille",
    topicNames: ['Finance & Argent']
  },
  {
    title: "L'inflation : le voleur silencieux",
    content: "À 2% d'inflation annuelle, votre pouvoir d'achat est divisé par 2 en 35 ans. 1000€ aujourd'hui vaudront 500€ dans 35 ans. L'inflation détruit les épargnants passifs et récompense les investisseurs.",
    takeaway: "Ne gardez pas plus de 6 mois de dépenses sur un compte courant. Le reste doit être investi pour battre l'inflation.",
    sourceTitle: "Inflation",
    topicNames: ['Finance & Argent']
  },
  {
    title: "Le FOMO financier : quand l'émotion décide",
    content: "Les bulles spéculatives (dot-com, subprimes, crypto) se nourrissent toutes du même mécanisme : les gens achètent parce que les autres achètent, pas parce que l'actif a de la valeur. Le FOMO (Fear Of Missing Out) est l'ennemi numéro 1 de l'investisseur.",
    takeaway: "Si vous ne comprenez pas ce que vous achetez, vous êtes le produit, pas l'investisseur. Restez dans ce que vous comprenez.",
    sourceTitle: "Euphorie spéculative",
    topicNames: ['Finance & Argent']
  },
  {
    title: "Les frais cachés qui ruinent les portefeuilles",
    content: "Un fonds avec 1,5% de frais de gestion au lieu de 0,3% coûte 120000€ sur 30 ans d'investissement de 300€/mois. Les frais semblent petits mais l'intérêt composé travaille aussi à l'envers.",
    takeaway: "Chaque 1% de frais en plus = environ 20% de moins à la retraite. Choisissez des ETF à frais minimaux et évitez les fonds actifs.",
    sourceTitle: "Frais de gestion",
    topicNames: ['Finance & Argent']
  },
  {
    title: "L'urgence financière : votre premier investissement",
    content: "Avant d'investir, Construisez une épargne de précaution de 3 à 6 mois de dépenses. Cette réserve évite de vendre vos investments lors d'une crise pour payer les factures. C'est le fondation de toute stratégie financière.",
    takeaway: "Sans épargne de précaution, chaque imprévu vous force à vendre vos investments au pire moment. Construisez votre bouclier d'abord.",
    sourceTitle: "Épargne de précaution",
    topicNames: ['Finance & Argent']
  },
  {
    title: "L'effet de levier : ami ou ennemi",
    content: "Emprunter pour investir amplifie les gains ET les pertes. Un achat immobilier avec 20% d'apport et 80% de crédit multiplie le rendement par 5... mais aussi les pertes. L'effet de levier est un couteau à double tranchant.",
    takeaway: "N'empruntez jamais pour investir si vous ne pouvez pas absorber une perte de 50%. L'effet de levier tue les investisseurs imprudents.",
    sourceTitle: "Effet de levier",
    topicNames: ['Finance & Argent']
  },
  {
    title: "Le dollar-cost averaging : investir sans stress",
    content: "Investir un montant fixe régulièrement (ex: 200€/mois), peu importe le marché, lisse le prix d'achat moyen. En bourse, c'est la stratégie la plus efficace pour les investisseurs particuliers : elle élimine le timing et l'émotion.",
    takeaway: "Planifiez vos investissements mensuels et exécutez-les automatiquement. Ne regardez pas les cours. La régularité bat l'intelligence.",
    sourceTitle: "Dollar-cost averaging",
    topicNames: ['Finance & Argent']
  },

  // Technologie & Innovation
  {
    title: "La loi de Moore : une course sans ligne d'arrivée",
    content: "Gordon Moore a prédit en 1965 que le nombre de transistors doublerait tous les 18 mois. Cette prédiction s'est réalisée pendant 50 ans. Aujourd'hui, les limites physiques approchent : on ne peut plus graver des transistors plus petits que l'atome.",
    takeaway: "Les technologies exponentielles semblent infinies jusqu'à ce qu'elles touchent une limite physique. Anticipez les plateaux avant qu'ils n'arrivent.",
    sourceTitle: "Loi de Moore",
    topicNames: ['Technologie & Innovation']
  },
  {
    title: "L'effet réseau : plus c'est grand, plus c'est utile",
    content: "Un téléphone ne vaut rien. Deux téléphones = un réseau. Un milliard de téléphones = une infrastructure mondiale. Les plateformes avec effet réseau (Facebook, WhatsApp, TCP/IP) deviennent naturellement monopolistiques. Plus il y a d'utilisateurs, plus le service vaut.",
    takeaway: "Quand vous évaluez une technologie, demandez : est-ce que sa valeur augmente avec le nombre d'utilisateurs ? Si oui, le leader gagnera tout.",
    sourceTitle: "Effet de réseau",
    topicNames: ['Technologie & Innovation']
  },
  {
    title: "Le paradoxe de Jevons : l'efficacité crée la surconsommation",
    content: "En 1865, l'économiste William Jevons a observé que rendre le charbon plus efficace augmentait sa consommation, pas la réduisait. Chaque progrès d'efficacité crée plus de demande. Les smartphones sont plus économes que les PC, mais nous en consommons 10x plus.",
    takeaway: "L'efficacité seule ne suffit pas pour réduire la consommation. Il faut aussi limiter la demande. La technologie sans régulation amplifie le problème.",
    sourceTitle: "Paradoxe de Jevons",
    topicNames: ['Technologie & Innovation']
  },
  {
    title: "La vallée de la mort de l'innovation",
    content: "Toute innovation passe par une courbe en U : enthousiasme initial, désillusion, puis récupération. Les véhicules autonomes sont actuellement dans la vallée de la désillusion (2024). Les technologies qui survivent à cette vallée finissent par transformer le monde.",
    takeaway: "Quand une technologie traverse la désillusion, c'est le moment d'écouter les ingénieurs, pas les médias. Les vraies innovations survivent aux cycles de hype.",
    sourceTitle: "Cycle de hype Gartner",
    topicNames: ['Technologie & Innovation']
  },
  {
    title: "La loi de Metcalfe : la valeur d'un réseau",
    content: "Le réseau téléphonique d'un pays a une valeur proportionnelle au carré de ses abonnés. 100 abonnés = valeur 10000. C'est pour ça que les plateformes tech achètent leurs utilisateurs à perte : la valeur future justifie le coût présent.",
    takeaway: "Dans les réseaux, les petits avantages initiaux s'amplifient exponentiellement. Le premier arrivé n'a pas toujours raison, mais le premier avec 10% d'avantage gagne souvent.",
    sourceTitle: "Loi de Metcalfe",
    topicNames: ['Technologie & Innovation']
  },
  {
    title: "La singularité technologique",
    content: "Ray Kurzweil prédit que l'IA dépassera l'intelligence humaine vers 2045. À ce point, l'IA pourrait elle-même créer une IA plus intelligente, créant une explosion d'intelligence. Le futur deviendrait si différent qu'on ne pourrait plus le comprendre.",
    takeaway: "Les changements exponentiels semblent lents puis soudains. Préparez-vous aux ruptures : apprenez à apprendre, car vos compétences d'aujourd'hui seront obsolètes demain.",
    sourceTitle: "Singularité technologique",
    topicNames: ['Technologie & Innovation']
  },
  {
    title: "Les normes ouvertes vs fermées",
    content: "USB a vaincu Firewire car USB était ouvert. VHS a vaincu Betamax car VHS était plus largement licencié. Les standards ouverts gagnent souvent contre les meilleurs produits fermés. L'adoption collective bat la perfection technique.",
    takeaway: "Dans les décisions technologiques, la compatibilité et l'adoption comptent plus que la qualité technique. Choisissez les standards ouverts quand c'est possible.",
    sourceTitle: "Guerre des formats",
    topicNames: ['Technologie & Innovation']
  },
  {
    title: "Le principe de Murdock : quand le remède empire le mal",
    content: "James Murdock a identifié des situations où une tentative de résoudre un problème l'aggrave. Augmenter la sécurité d'un site la rend si complexe que les utilisateurs contournent les protections. La solution devient le problème.",
    takeaway: "Chaque solution crée de nouveaux problèmes. Avant d'implémenter, demandez : comment cette solution pourrait-elle empirer la situation ?",
    sourceTitle: "Auto-contredit",
    topicNames: ['Technologie & Innovation']
  },
  {
    title: "L'obsolescence programmée",
    content: "Le Phenix Pact de 1955 a organisé la cartellisation du phosphore pour limiter la concurrence. Aujourd'hui, les smartphones sont conçus pour durer 2-3 ans. L'obsolescence programmée n'est pas une conspiration : c'est la logique du capitalisme de consommation.",
    takeaway: "Achetez durable, réparez, et résistez à la tentation de la dernière version. La meilleure technologie est celle que vous garderez le plus longtemps.",
    sourceTitle: "Obsolescence programmée",
    topicNames: ['Technologie & Innovation']
  },
  {
    title: "L'open source : le pouvoir du collectif",
    content: "Linux, le système d'exploitation le plus utilisé au monde (serveurs, Android, supercalculateurs), est gratuit et créé par des milliers de contributeurs bénévoles. L'open source prouve que le développement collaboratif peut surpasser les efforts des entreprises.",
    takeaway: "Partagez votre travail publiquement. Les contributions extérieures transforment un bon projet en excellent. L'ego est l'ennemi de l'amélioration.",
    sourceTitle: "Logiciel libre",
    topicNames: ['Technologie & Innovation']
  },

  // Sociologie
  {
    title: "L'effet de conformité d'Asch",
    content: "Solomon Asch a montré que 75% des gens ont cédé à la pression du groupe au moins une fois, même quand la réponse évidente était contraire. Dire 'non' au groupe est psychologiquement douloureux : notre cerveau traite le rejet social comme une douleur physique.",
    takeaway: "Quand vous sentez que tout le monde pense pareil, pausez. La désobéissance pacifique commence par une question : 'Et si j'avais tort ?'",
    sourceTitle: "Expérience d'Asch",
    topicNames: ['Sociologie']
  },
  {
    title: "La spirale du silence",
    content: "Elisabeth Noelle-Neumann a démontré que les gens se taisent quand ils pensent être minoritaires. Cette autosurveillance crée un effet boule de neige : l'opinion perçue comme dominante devient de plus en plus dominante, même si c'est une illusion.",
    takeaway: "Les réseaux sociaux amplifient la spirale du silence : on ne voit que les opinions qui ont des likes. Cherchez activement les voix silencieuses.",
    sourceTitle: "Spirale du silence",
    topicNames: ['Sociologie']
  },
  {
    title: "L'expérience de la prison de Stanford",
    content: "Philippe Zimbardo a montré que des étudiants normaux deviennent des gardiens cruels ou des prisonniers résignés en 6 jours. Le contexte social peut transformer n'importe qui. Les systèmes créent les comportements, pas seulement les individus.",
    takeaway: "Ne sous-estimez jamais le pouvoir des systèmes. Un bon design social (règles, récompenses, transparence) préviendra plus de dégâts que la morale individuelle.",
    sourceTitle: "Expérience de la prison de Stanford",
    topicNames: ['Sociologie']
  },
  {
    title: "Le capital social : votre réseau vaut de l'or",
    content: "Robert Putnam a montré que les sociétés avec un fort capital social (confiance, réseaux, normes de réciprocité) sont plus riches, plus saines et plus heureuses. Vos connexions sociales sont un bien collectif aussi important que les routes ou les écoles.",
    takeaway: "Investissez dans vos relations. Les amis, collègues et voisins ne sont pas juste du 'socialising' : c'est un investissement en capital social qui paie toute une vie.",
    sourceTitle: "Capital social",
    topicNames: ['Sociologie']
  },
  {
    title: "La théorie de l'étiquetage",
    content: "Howard Becker a montré qu'étiqueter quelqu'un ('déléquant', 'délinquant', 'fou') ne décrit pas une réalité : ça crée une réalité. La personne finit par incarner l'étiquette. Les étiquettes sociales sont des prophéties auto-réalisatrices.",
    takeaway: "Traitez les gens selon leur potentiel, pas leur passé. L'étiquette que vous posez sur quelqu'un devient souvent leur destin.",
    sourceTitle: "Théorie de l'étiquetage",
    topicNames: ['Sociologie']
  },
  {
    title: "L'aliénation numérique",
    content: "Les réseaux sociaux créent une forme d'aliénation où nous sommes plus connectés que jamais mais plus seuls. Zeynep Tufekci montre que les mouvements sociaux numériques manquent de leadership et de stratégie : la facilité de participation affaiblit l'engagement profond.",
    takeaway: "La connexion superficielle ne remplace pas la présence réelle. Un dîner avec un ami vaut mieux que 100 likes. La profondeur bat la quantité.",
    sourceTitle: "Zeynep Tufekci",
    topicNames: ['Sociologie']
  },
  {
    title: "La pyramide de Maslow : mythe et réalité",
    content: "Maslow a créé une pyramide de besoins (physiologiques, sécurité, appartenance, estime, accomplissement). Mais la recherche moderne montre que les besoins ne sont pas hiérarchiques : on peut chercher l'estime même en famine, et l'appartenance même en danger.",
    takeaway: "Ne sous-estimez pas la capacité humaine à chercher du sens dans l'adversité. Les gens trouvrent de la créativité, de l'amour et du but même dans les conditions les plus difficiles.",
    sourceTitle: "Pyramide de Maslow",
    topicNames: ['Sociologie']
  },
  {
    title: "L'effet de groupe : pensée collective",
    content: "Irving Janis a identifié le 'groupthink' : quand la cohésion de groupe prime sur la réflexion critique. Les décisionnaires ignorent les avertissements, stigmatisent les dissidents et construisent une image irréalistes du monde. Les catastrophes politiques viennent souvent du groupthink.",
    takeaway: "Dans les décisions importantes, nommez un 'avocat du diable'. La désobéissance organisée est la meilleure protection contre les erreurs collectives.",
    sourceTitle: "Pensée de groupe",
    topicNames: ['Sociologie']
  },
  {
    title: "La distinction de Bourdieu : le goût comme classe sociale",
    content: "Pierre Bourdieu a montré que nos goûts (musique, nourriture, art) ne sont pas naturels : ils sont des marqueurs de classe. Le 'goût' est un capital culturel qui maintient les hiérarchies sociales. Dire 'je n'aime pas ça' est un acte social, pas personnel.",
    takeaway: "Vos préférences ne sont pas neutres : elles racontent votre histoire sociale. Comprendre ça vous libère du jugement et ouvre à la curiosité.",
    sourceTitle: "Distinction (sociologie)",
    topicNames: ['Sociologie']
  },
  {
    title: "La résilience des communautés",
    content: "Les communautés locales résilientes ont des réseaux d'entraide, des économies circulaires et une gouvernance participative. Après les catastrophes, ce ne sont pas les aide externe qui sauvent : ce sont les voisins qui se connaissent.",
    takeaway: "Connaissez vos voisins. Un réseau local fort vaut plus que toute assurance. La résilience se construit avant la crise, pas pendant.",
    sourceTitle: "Résilience communautaire",
    topicNames: ['Sociologie']
  },

  // Physique
  {
    title: "L'entropie : pourquoi tout se dégrade",
    content: "La deuxième loi de la thermodynamique dit que l'entropie (désordre) augmente toujours. Votre chambre se désorganise toute seule, mais s'organiser demande un effort. L'univers tend vers le désordre : la vie est une lutte contre l'entropie.",
    takeaway: "Maintenir l'ordre demande un effort constant. N'attendez pas que les choses s'améliorent toute seule : l'entropie travaille contre vous en permanence.",
    sourceTitle: "Entropie",
    topicNames: ['Physique']
  },
  {
    title: "Le principe d'incertitude de Heisenberg",
    content: "Werner Heisenberg a montré qu'on ne peut pas connaître simultanément la position et la vitesse d'une particule avec une précision arbitraire. Plus on mesure précisément l'un, moins l'autre est connu. Ce n'est pas une limite technique : c'est une propriété fondamentale de la réalité.",
    takeaway: "L'incertitude n'est pas un défaut de mesure : c'est une caractéristique du monde. Accepter l'incertitude n'est pas de la résignation, c'est de la lucidité.",
    sourceTitle: "Principe d'incertitude",
    topicNames: ['Physique']
  },
  {
    title: "Le paradoxe des jumeaux de la relativité",
    content: "Einstein a montré qu'un voyageur se déplaçant proche de la lumière vieillit plus lentement que son jumeau resté sur Terre. À 99% de la vitesse de la lumière, 1 an pour le voyageur = 7 ans sur Terre. Le temps n'est pas absolu : il dépend de votre vitesse.",
    takeaway: "Votre perception du temps dépend de votre perspective. Ce qui semble urgent pour vous peut être insignifiant pour quelqu'un d'autre. La relativité s'applique aussi aux relations humaines.",
    sourceTitle: "Paradoxe des jumeaux",
    topicNames: ['Physique']
  },
  {
    title: "Le chat de Schrödinger : mort et vivant simultanément",
    content: "Erwin Schrödinger a imaginé un chat dans une boîte avec un mécanisme quantique aléatoire. Tant qu'on n'ouvre pas la boîte, le chat est simultanément mort et vivant. Ce paradoxe illustre le problème de la mesure en mécanique quantique : l'observation crée la réalité.",
    takeaway: "L'observation change ce qu'on observe. Dans les relations, le simple fait de juger quelqu'un change sa comportement. Observer avec bienveillance crée de meilleures réalités.",
    sourceTitle: "Chat de Schrödinger",
    topicNames: ['Physique']
  },
  {
    title: "La mécanique quantique et l'intrication",
    content: "Deux particules intriquées restent connectées quelle que soit la distance entre elles. Mesurer l'une affecte instantanément l'autre, même à des années-lumière. Einstein appelait ça 'une action fantôme à distance'. La réalité est profondément interconnectée.",
    takeaway: "Rien n'est vraiment séparé. Chaque action a des répercussions lointaines. Votre impact sur le monde dépasse toujours votre portée immédiate.",
    sourceTitle: "Intrication quantique",
    topicNames: ['Physique']
  },
  {
    title: "L'équation E=mc² : l'énergie de la matière",
    content: "Einstein a montré que matière et énergie sont interchangeables. Un gramme de matière contient l'énergie de 21000 tonnes de TNT. Cette équation explique comment le soleil brille (fusion nucléaire) et comment les centrales nucléaires fonctionnent (fission).",
    takeaway: "La matière est de l'énergie condensée. Chaque chose autour de vous contient une énergie immense : il suffit de trouver la bonne clé pour la libérer.",
    sourceTitle: "Équivalence masse-énergie",
    topicNames: ['Physique']
  },
  {
    title: "Le démon de Maxwell : quand l'information est de l'énergie",
    content: "James Clerk Maxwell a imaginé un démon qui trierait les molécules rapides des lentes, créant du froid à partir du chaud sans travail apparent. Ce paradoxe a mené à la découverte que l'information est physique : trier les molécules demande de l'énergie.",
    takeaway: "L'information a un coût physique. Traiter, stocker et transmettre des informations consomme de l'énergie. La connaissance n'est pas gratuite.",
    sourceTitle: "Démon de Maxwell",
    topicNames: ['Physique']
  },
  {
    title: "L'effet papillon et la théorie du chaos",
    content: "Edward Lorenz a découvert qu'une infime variation dans les conditions initiales d'un système chaotique produit des résultats radicalement différents. Un battement d'ailes de papillon en Brésil peut provoquer une tornade au Texas. Le futur est fondamentalement imprévisible.",
    takeaway: "Les petites actions ont des conséquences énormes. Ne sous-estimez jamais l'impact d'un geste, d'un mot, d'une décision. Chaque détail compte.",
    sourceTitle: "Théorie du chaos",
    topicNames: ['Physique']
  },
  {
    title: "Les ondes gravitationnelles : les rides de l'espace-temps",
    content: "En 2015, LIGO a détecté pour la première fois des ondes gravitationnelles : des rides dans le tissu de l'espace-temps créées par la collision de deux trous noirs. Einstein les avait prédites en 1916. Nous pouvons maintenant 'entendre' l'univers.",
    takeaway: "Les preuves arrivent souvent des décennies après les prédictions. La patience scientifique paie. Ce qui semble impossible aujourd'hui peut être mesurable demain.",
    sourceTitle: "Onde gravitationnelle",
    topicNames: ['Physique']
  },
  {
    title: "L'univers observable : un point dans l'infini",
    content: "L'univers observable a un rayon de 46 milliards d'années-lumière. Mais l'univers total est probablement infini. La Terre est un point dans une galaxie parmi 200 milliards, dans un univers parmi peut-être autant. Notre importance est cosmiquement nulle.",
    takeaway: "Être insignifiant dans l'univers est libérant. Si tout est si vaste, alors vos problèmes sont petits. Vos succès le sont aussi. Profitez de cette perspective pour vivre plus librement.",
    sourceTitle: "Univers observable",
    topicNames: ['Physique']
  },

  // Cuisine & Alimentation
  {
    title: "La réaction de Maillard : la science du goût",
    content: "Quand vous cuisinez à haute température (au-dessus de 140°C), les acides aminés et les sucres réagissent pour créer des centaines de nouvelles molécules de saveur. C'est la réaction de Maillard : elle donne sa saveur au pain grillé, à la viande rôtie et au café torréfié.",
    takeaway: "Saisissez bien votre viande avant de la mettre dans la poêle. L'humidité empêche la réaction de Maillard : une viande bouillie au lieu de grillée.",
    sourceTitle: "Réaction de Maillard",
    topicNames: ['Cuisine & Alimentation']
  },
  {
    title: "L'umami : le cinquième goût",
    content: "Le glutamate, découvert par Kikunae Ikeda en 1908, est le cinquième goût de base (avec sucré, salé, acide, amer). L'umami donne de la profondeur et de la rondeur. Tomates mûres, parmesan, champignons, sauce soja : ce sont des bombes d'umami naturelles.",
    takeaway: "Ajoutez un peu d'umami à vos plats pour les transformer sans sel. Un peu de parmesan râpé ou de sauce soja peut remplacer le sel et enrichir le goût.",
    sourceTitle: "Umami",
    topicNames: ['Cuisine & Alimentation']
  },
  {
    title: "La fermentation : conserver pour mieux nourrir",
    content: "La fermentation transforme les sucres en acide lactique ou en alcool grâce aux bactéries et levures. Choucroute, kombucha, kimchi, yaourt : ces aliments fermentés sont plus digestes, plus nutritifs et pleins de probiotiques naturels. La fermentation a sauvé des civilisations entières de la famine.",
    takeaway: "Fermenter ses légumes est la technique la plus simple et la plus puissante : eau salée, légumes, 3 jours à température ambiante. Résultat : des probiotiques gratuits et des légumes qui durent des mois.",
    sourceTitle: "Fermentation",
    topicNames: ['Cuisine & Alimentation']
  },
  {
    title: "Le équilibre sucré-acide-gras-salé",
    content: "Les meilleurs plats équilibrent quatre saveurs : sucré, acide, salé, gras. Une vinaigrette parfaite = huile (gras) + vinaigre (acide) + sel (salé) + miel (sucré). Quand un plat manque quelque chose, ajoutez une goutte d'acide avant de rajouter du sel.",
    takeaway: "Si votre plat semble plat, ajoutez de l'acidité (citron, vinaigre) avant le sel. L'acide réveille les saveurs plus efficacement que le sel.",
    sourceTitle: "Équilibre des saveurs",
    topicNames: ['Cuisine & Alimentation']
  },
  {
    title: "La science du pain : gluten et fermentation",
    content: "Le gluten forme un réseau élastique quand on pétrit la farine avec de l'eau. Les levures produisent du CO2 qui gonfle ce réseau. La cuisson fige la structure. Le pain parfait demande trois choses : bon gluten, bonne fermentation, bonne cuisson.",
    takeaway: "Pétrissez assez pour développer le gluten (test de la membrane : étirez la pâte finement sans qu'elle se déchire). Un bon pain commence par un bon pétrissage.",
    sourceTitle: "Pain",
    topicNames: ['Cuisine & Alimentation']
  },
  {
    title: "Le jeûne intermittent : manger moins pour mieux vivre",
    content: "Jeûner 16 heures active l'autophagie : le corps recycle ses propres cellules endommagées. C'est un mécanisme évolutif de nettoyage cellulaire. Les sociétés humaines ont jeûné pendant des millénaires : notre corps est conçu pour fonctionner sans nourriture périodiquement.",
    takeaway: "Commencez par sauter le petit-déjeuner un jour sur deux. Laissez votre corps apprendre à puiser dans ses réserves. L'autophagie commence après ~14h de jeûne.",
    sourceTitle: "Jeûne intermittent",
    topicNames: ['Cuisine & Alimentation']
  },
  {
    title: "Les épices : pharmacie de la cuisine",
    content: "Le curcuma contient de la curcumine (anti-inflammatoire), le gingembre de la gingérol (anti-nausée), le cumin améliore la digestion. Les épices ne sont pas juste du goût : ce sont des molécules bioactives avec des effets prouvés sur la santé.",
    takeaway: "Gardez du curcuma, du gingembre et de l'ail sous la main. Ces trois épices couvrent les besoins anti-inflammatoire, digestif et antibactérien de base.",
    sourceTitle: "Épice",
    topicNames: ['Cuisine & Alimentation']
  },
  {
    title: "La température compte plus que le temps",
    content: "Un steak cuit à 54°C pendant 1 heure est identique à un steak cuit à 70°C pendant 15 minutes : la température détermine la cuisson, pas le temps. La cuisson sous-vide exploite ce principe : température précise, résultat reproductible.",
    takeaway: "Utilisez un thermomètre de cuisine. Un poulet à 74°C est sûr, un saumon à 50°C est parfait. La température exacte bat toute recette écrite.",
    sourceTitle: "Cuisine sous-vide",
    topicNames: ['Cuisine & Alimentation']
  },
  {
    title: "Le gaspillage alimentaire : un problème de stockage",
    content: "40% des aliments se gaspillent dans les pays développés, principalement à cause d'un mauvais stockage. Les légumes verts dans du papier absorbant durent 2x plus. Les herbes dans un verre d'eau comme des fleurs. La connaissance du stockage = moins de gaspillage.",
    takeaway: "Rangez vos aliments correctement : les tomates hors du frigo, les pommes de terre à l'abri de la lumière, les légumes-feuilles dans du papier. Le bon stockage réduit le gaspillage de 50%.",
    sourceTitle: "Gaspillage alimentaire",
    topicNames: ['Cuisine & Alimentation']
  },
  {
    title: "L'alchimie des saveurs : pourquoi ça marche",
    content: "La cuisine française classique associe crème et champignons, vin et bœuf, herbes et poisson. Mais la science montre que ces combinaisons partagent des molécules aromatiques communes. L'accord parfait terre-vin fonctionne car les raisins et les truffes partagent des composés similaires.",
    takeaway: "Pour créer vos propres associations, cherchez les molécules partagées. L'aneth et le caviar fonctionnent car ils partagent la diméthylsulfure. La science remplace la tradition : vous pouvez innover avec confiance.",
    sourceTitle: "Cuisine moléculaire",
    topicNames: ['Cuisine & Alimentation']
  },

  // Biologie & Évolution
  {
    title: "La sélection naturelle en 3 phrases",
    content: "Darwin a observé que : 1) Les individus varient (taille, couleur, comportement). 2) Ces variations sont héréditaires. 3) Les ressources sont limitées. Résultat : les mieux adaptés survivent et se reproduisent. En quelques générations, la population change. C'est l'évolution.",
    takeaway: "L'évolution n'a pas de but : elle optimise pour la reproduction, pas pour le 'meilleur'. Ce qui fonctionne aujourd'hui peut être un handicap demain. La flexibilité bat la perfection.",
    sourceTitle: "Sélection naturelle",
    topicNames: ['Biologie & Évolution']
  },
  {
    title: "L'ADN : un livre de 3 milliards de lettres",
    content: "Votre ADN contient 3,2 milliards de paires de bases. Si on les déroulait, ça ferait 2 mètres. Si on les empilait, ça ferait 6 pouces. Tout ce qui fait de vous qui vous êtes tient dans une molécule si fine qu'un cheveu en contient des milliers.",
    takeaway: "Chaque cellule de votre corps contient l'intégralité de votre code génétique. Vous portez en vous l'histoire de 3,8 milliards d'années de vie sur Terre.",
    sourceTitle: "ADN",
    topicNames: ['Biologie & Évolution']
  },
  {
    title: "Le microbiome : vous n'êtes pas un, mais un écosystème",
    content: "Vous avez 38 billions de bactéries dans votre corps, soit autant de cellules que vous. Votre microbiome intestinal influence votre humeur, votre immunité, votre poids et même vos décisions. Vous êtes un super-organisme : humain + bactérien.",
    takeaway: "Nourrissez vos bactéries : fibres, aliments fermentés, variété. Un microbiome diversifié = un corps plus résilient. Les antibiotiques sont utiles mais destructeurs : à utiliser avec parcimonie.",
    sourceTitle: "Microbiome humain",
    topicNames: ['Biologie & Évolution']
  },
  {
    title: "Les télomères : le compteur de vie de vos cellules",
    content: "Chaque fois qu'une cellule se divise, ses télomères (capsules aux extrémités de l'ADN) raccourcissent. Quand ils sont trop courts, la cellule ne peut plus se diviser : c'est la sénescence. Le stress chronique, le tabac et la malnutrition accélèrent ce processus.",
    takeaway: "Le stress chronique vieillit vos cellules. Méditation, exercice et sommeil protègent vos télomères. La longévité se construit jour par jour, pas à la retraite.",
    sourceTitle: "Télomère",
    topicNames: ['Biologie & Évolution']
  },
  {
    title: "L'évolution du cerveau : trois cerveaux en un",
    content: "Paul MacLean a théorisé le 'cerveau triunique' : le reptilien (instincts de survie), le limbique (émotions) et le néocortex (raison). Bien que simplifié, ce modèle capture une vérité : nous raisonnons avec des cerveaux hérités de nos ancêtres.",
    takeaway: "Votre cerveau reptilien réagit aux dangers avant que votre cortex ne pense. Face au stress, respirez 10 secondes : cela donne à votre cortex le temps de prendre le relais.",
    sourceTitle: "Cerveau triunique",
    topicNames: ['Biologie & Évolution']
  },
  {
    title: "La coévolution : quand les espèces se créent mutuellement",
    content: "Les fleurs et les pollinisateurs ont évolué ensemble : les fleurs développent des couleurs et des parfums spécifiques, les insectes développent des pièces buccales adaptées. Aucun ne fonctionne sans l'autre. La coopération est aussi puissante que la compétition.",
    takeaway: "Les meilleures relations sont coévolutives : elles améliorent les deux parties. Cherchez des collaborations où chacun devient meilleur grâce à l'autre.",
    sourceTitle: "Coévolution",
    topicNames: ['Biologie & Évolution']
  },
  {
    title: "L'épigénétique : l'héritage au-delà de l'ADN",
    content: "Votre ADN ne change pas, mais ses 'interrupteurs' oui. Le stress, l'alimentation et l'environnement activent ou désactivent des gènes. Ces modifications épigénétiques peuvent être transmises aux enfants. Vos choix de vie affectent non seulement votre santé, mais celle de vos descendants.",
    takeaway: "Ce que vous mangez, vivez et ressentez programme l'expression de vos gènes. Chaque repas est un acte d'auto-modification biologique.",
    sourceTitle: "Épigénétique",
    topicNames: ['Biologie & Évolution']
  },
  {
    title: "Le paradoxe de l'eau : pourquoi l'eau chaude gèle plus vite",
    content: "L'effet Mpemba : dans certaines conditions, l'eau chaude gèle plus vite que l'eau froide. Les explications possibles : évaporation réduite, courants de convection, dissolution de gaz. Ce paradoxe 2500 ans vieux n'a toujours pas de réponse définitive.",
    takeaway: "Même les phénomènes les plus simples peuvent cacher des complexités inattendues. Restez humble face à la nature : ce qu'on croit comprendre est souvent incomplet.",
    sourceTitle: "Effet Mpemba",
    topicNames: ['Biologie & Évolution']
  },
  {
    title: "Les cellules souches : le potentiel infini",
    content: "Une cellule souche peut devenir n'importe quel type de cellule : cœur, neurone, peau. Les cellules souches embryonnaires sont pluripotentes. Les cellules adultes sont plus limitées mais restent précieuses pour la régénération. La médecine régénérative pourrait un jour réparer n'importe quel organe.",
    takeaway: "Le potentiel de transformation est en vous. Comme une cellule souche, vous pouvez devenir n'importe quoi. Le choix de vous spécialiser arrive plus tard.",
    sourceTitle: "Cellule souche",
    topicNames: ['Biologie & Évolution']
  },
  {
    title: "L'extinction de masse : la leçon de la biodiversité",
    content: "Cinq extinctions massives ont éliminé 75-96% des espèces. La sixième, causée par l'homme, est en cours. Mais après chaque extinction, la vie revient : en 10 millions d'années, de nouvelles espèces émergent. La vie persiste, mais les écosystèmes actuels disparaîtront.",
    takeaway: "Protéger la biodiversité, c'est protéger notre propre survie. Chaque espèce perdue est un fil de plus dans la toile de la vie qui se rompt.",
    sourceTitle: "Extinction de masse",
    topicNames: ['Biologie & Évolution']
  },

  // Mathématiques
  {
    title: "Le paradoxe de Monty Hall : changez votre réponse",
    content: "Au jeu Monty Hall, trois portes : une voiture, deux chèvres. Vous choisissez la porte 1. L'hôte ouvre la porte 3 (chèvre). Doit-vous changer pour la porte 2 ? Oui ! Changer donne 2/3 de chance de gagner, rester 1/3. Contre-intuitif mais mathématiquement prouvé.",
    takeaway: "Quand de nouvelles informations arrivent, mettez à jour vos probabilités. Ne restez pas attaché à votre première décision : l'information change la donne.",
    sourceTitle: "Paradoxe de Monty Hall",
    topicNames: ['Mathématiques']
  },
  {
    title: "Le théorème de Bayes : penser en probabilités",
    content: "Thomas Bayes a montré comment mettre à jour une croyance avec de nouvelles preuves. P(Test positif | Malade) ≠ P(Malade | Test positif). Un test à 99% de précision sur une maladie rare (1/10000) donne quand même 50% de faux positifs. Bayes sauve des vies.",
    takeaway: "Ne confondez jamais la probabilité d'une preuve étant donné une hypothèse avec la probabilité de l'hypothèse étant donné la preuve. C'est l'erreur qui fait condamner des innocents.",
    sourceTitle: "Théorème de Bayes",
    topicNames: ['Mathématiques']
  },
  {
    title: "Le nombre de Fibonacci dans la nature",
    content: "1, 1, 2, 3, 5, 8, 13... Chaque nombre est la somme des deux précédents. Cette suite apparaît partout : spirales de tournesol, pommes de pin, coquilles de nautile, branches d'arbres. La nature préfère Fibonacci. Le ratio entre nombres consécutifs converge vers le nombre d'or (1,618).",
    takeaway: "Les patterns mathématiques sont cachés dans la nature partout autour de vous. Les observer change votre perception du monde : la beauté est structurée, pas accidentelle.",
    sourceTitle: "Suite de Fibonacci",
    topicNames: ['Mathématiques']
  },
  {
    title: "Le théorème d'incomplétude de Gödel",
    content: "Kurt Gödel a prouvé qu'il existe des vérités mathématiques qu'on ne peut pas démontrer. Dans tout système logique suffisamment riche, il y a des affirmations vraies mais indémontrables. Les mathématiques ont des limites inhérentes : tout système a des trous.",
    takeaway: "Aucun système, aussi parfait soit-il, ne peut tout prouver. Acceptez les limites de votre connaissance. L'humilité intellectuelle est une vertu mathématique.",
    sourceTitle: "Théorèmes d'incomplétude",
    topicNames: ['Mathématiques']
  },
  {
    title: "Les fractales : l'infini dans le fini",
    content: "Un flocon de Koch a un périmètre infini mais une aire finie. Les fractales ont une structure auto-similaire à toutes les échelles : une fougère ressemble à ses frondes. Mandelbrot a montré que la nature est pleine de formes fractales : côtes, nuages, montagnes.",
    takeaway: "L'infini existe dans le fini. Une formule simple peut générer une complexité infinie. Les petites règles répétées créent des patterns extraordinaires.",
    sourceTitle: "Fractale",
    topicNames: ['Mathématiques']
  },
  {
    title: "Le paradoxe des anniversaires : 23 personnes, 50% de chance",
    content: "Dans un groupe de 23 personnes, il y a plus de 50% de chance que deux personnes aient le même anniversaire. Avec 57 personnes, c'est 99%. Contre-intuitif car on pense aux anniversaires individuels, pas à toutes les paires possibles (253 combinaisons avec 23 personnes).",
    takeaway: "Les coïncidences sont bien plus probables qu'on ne le pense. Quand quelque chose d'exceptionnel arrive, ne cherchez pas de signification cachée : les mathématiques l'expliquent.",
    sourceTitle: "Paradoxe des anniversaires",
    topicNames: ['Mathématiques']
  },
  {
    title: "Les nombres premiers : les atomes des mathématiques",
    content: "Un nombre premier n'est divisible que par 1 et lui-même. 2, 3, 5, 7, 11, 13... Euclide a prouvé en -300 qu'il y en a une infinité. Les nombres premiers sont la base de la cryptographie moderne : votre carte bancaire repose sur la difficulté de factoriser de grands nombres premiers.",
    takeaway: "Les éléments les plus simples (nombres premiers) sont les plus puissants. La complexité moderne (internet, sécurité) repose sur des idées anciennes et simples.",
    sourceTitle: "Nombre premier",
    topicNames: ['Mathématiques']
  },
  {
    title: "Le théorème de Pythagore : a² + b² = c²",
    content: "Dans un triangle rectangle, le carré de l'hypoténuse égale la somme des carrés des deux autres côtés. Ce théorème semble simple mais il est partout : GPS, construction, musique, physique. Il a au moins 400 preuves différentes, plus que tout autre théorème.",
    takeaway: "Les vérités les plus profondes sont souvent les plus simples. La beauté de Pythagore est que quelque chose d'aussi fondamental s'exprime en trois mots.",
    sourceTitle: "Théorème de Pythagore",
    topicNames: ['Mathématiques']
  },
  {
    title: "La théorie des jeux : le dilemme du prisonnier",
    content: "Deux prisonniers, isolés, doivent choisir de taire ou trahir. Si les deux taisent : 1 an chacun. Si l'un trahit : libre, l'autre 10 ans. Si les deux trahissent : 5 ans. La stratégie dominante est de trahir, mais la coopération mutuelle est meilleure. C'est le fondement de l'évolution de la coopération.",
    takeaway: "Dans les interactions répétées, la coopération émerge naturellement. Commencez par coopérer, puis imitez l'action précédente. C'est la stratégie 'œil pour œil' qui domine.",
    sourceTitle: "Dilemme du prisonnier",
    topicNames: ['Mathématiques']
  },
  {
    title: "Le zéro : l'invention la plus importante",
    content: "Le zéro a été inventé en Inde vers le 5ème siècle. Avant ça, aucune civilisation n'avait ce concept. Le zéro permet la notation positionnelle, les calculs avancés, l'algèbre. Sans zéro, pas de binaire, pas d'informatique. Un cercle vide a changé le monde.",
    takeaway: "Les idées les plus puissantes sont souvent les plus simples. Le zéro (rien) est plus important que tous les autres chiffres combinés. Ne sous-estimez jamais le pouvoir du vide.",
    sourceTitle: "Zéro",
    topicNames: ['Mathématiques']
  },

  // Art & Design
  {
    title: "La règle des tiers : brisez-la ensuite",
    content: "Divisez votre image en 9 cases égales (3x3). Placez les éléments importants sur les intersections. Cette règle vient de la peinture chinoise et a été popularisée par la photographie au 18ème siècle. 70% des photographies professionnelles l'utilisent. Mais les meilleures images la brisent.",
    takeaway: "Apprenez les règles pour savoir quand les briser. La règle des tiers est un point de départ, pas une loi. Une fois maîtrisée, expérimentez : centrer le sujet peut être plus puissant.",
    sourceTitle: "Règle des tiers",
    topicNames: ['Art & Design']
  },
  {
    title: "Le golden ratio : 1,618 partout",
    content: "Le nombre d'or (φ = 1,618) apparaît dans la nature (coquilles, fleurs), l'art (La Cène de Léonard de Vinci), l'architecture (Parthénon) et le design (logo Apple, Twitter). Mais son importance est souvent exagérée : beaucoup d'œuvres célèbres ne l'utilisent pas.",
    takeaway: "Le golden ratio est un outil parmi d'autres, pas une loi universelle. L'utilisez quand il sert votre composition, mais ne le forcez pas : l'intuition visuelle bat les mathématiques.",
    sourceTitle: "Nombre d'or",
    topicNames: ['Art & Design']
  },
  {
    title: "Le minimalisme : moins c'est plus",
    content: "Mies van der Rohe a popularisé 'less is more'. Le minimalisme en design élimine tout ce qui n'est pas essentiel. Apple, Muji, Dieter Rams : ils ont montré que la simplicité est la sophistication suprême. Chaque élément ajouté doit justifier son existence.",
    takeaway: "Avant d'ajouter un élément à votre design (ou votre vie), demandez : que se passe-t-il si je l'enlève ? Si rien ne change, il était superflu.",
    sourceTitle: "Minimalisme",
    topicNames: ['Art & Design']
  },
  {
    title: "La typographie : le caractère parle",
    content: "Une police n'est pas qu'un contenant pour le texte : elle en est le premier message. Une Serif (Times) évoque tradition et autorité. Une Sans-serif (Helvetica) évoque modernité et neutralité. Une Script évoque élégance ou informalité. Le choix de police est 50% du design.",
    takeaway: "N'utilisez jamais plus de 2 polices dans un même design. La restriction crée l'harmonie. Helvetica pour le corps, une Serif pour les titres : c'est un classique pour une raison.",
    sourceTitle: "Typographie",
    topicNames: ['Art & Design']
  },
  {
    title: "La palette de couleurs : 60-30-10",
    content: "Les designers utilisent la règle 60-30-10 : 60% couleur dominante (fond), 30% couleur secondaire (éléments), 10% couleur d'accent (CTA, points d'intérêt). Cette proportion crée un équilibre visuel naturel. Les couleurs opposées sur le cercle chromatique créent du contraste.",
    takeaway: "Structurez vos couleurs en 60-30-10. Trop de couleurs = chaos. Trop peu = ennui. La règle donne un cadre pour créer de l'harmonie sans réfléchir.",
    sourceTitle: "Couleur (art)",
    topicNames: ['Art & Design']
  },
  {
    title: "Le mouvement Bauhaus : forme suit la fonction",
    content: "Le Bauhaus (1919-1933) a fusionné art, artisanat et industrie. Walter Gropius voulait créer une 'œuvre d'art totale'. Le Bauhaus a révolutionné le design : meubles, typographie, architecture. Son héritage : la beauté doit être fonctionnelle, et la fonction peut être belle.",
    takeaway: "Le meilleur design est invisible : il fonctionne parfaitement. Quand quelqu'un dit 'ce design est beau' sans préciser pourquoi, c'est qu'il a réussi.",
    sourceTitle: "Bauhaus",
    topicNames: ['Art & Design']
  },
  {
    title: "La perspective dans l'art : réinventer le monde",
    content: "Avant le 15ème siècle, l'art était plat : les personnages avaient des tailles arbitraires. Brunelleschi a inventé la perspective linéaire : tous les lignes parallèles convergent vers un point de fuite. Cette invention a changé l'art, la science et notre perception de l'espace.",
    takeaway: "La perspective n'est pas objective : c'est un choix. Changer de point de vue change radicalement la lecture d'une situation. Cherchez systématiquement un second point de vue.",
    sourceTitle: "Perspective (arts plastiques)",
    topicNames: ['Art & Design']
  },
  {
    title: "L'art conceptuel : l'idée compte plus que l'objet",
    content: "Marcel Duchamp a signé un urinoir 'Fontaine' et l'a exposé en 1917. L'art n'est plus dans l'objet mais dans l'idée. L'art conceptuel a ouvert la voie à l'art contemporain : Banksy, Duchamp, Warhol. La question 'est-ce de l'art ?' est moins importante que 'que pense-vous de ça ?'.",
    takeaway: "Le contexte change tout. Un objet banal dans un musée devient de l'art. Dans votre vie, le contexte (lieu, moment, narration) transforme l'expérience.",
    sourceTitle: "Fontaine (Duchamp)",
    topicNames: ['Art & Design']
  },
  {
    title: "Le contraste : créer l'intérêt visuel",
    content: "Le contraste (taille, couleur, forme, texture) crée l'intérêt visuel. Sans contraste, tout semble égal et l'œil ne sait pas où aller. Avec trop de contraste, c'est le chaos. Le bon contraste guide l'œil vers ce qui est important.",
    takeaway: "Si tout est important, rien n'est important. Utilisez le contraste pour guider l'attention : plus grand, plus coloré, plus contrasté = plus important.",
    sourceTitle: "Contraste (design)",
    topicNames: ['Art & Design']
  },
  {
    title: "L'impressionnisme : capturer l'instant",
    content: "Monet, Renoir, Degas ont peint en plein air pour capturer la lumière changeante. Ils ont abandonné les contours nets au profit de touches de couleur pures. Le cerveau mélange les couleurs à distance. L'impressionnisme a révolutionné l'art en préférant la perception à la précision.",
    takeaway: "Parfois, la vision globale bat les détails. Laissez votre cerveau compléter les informations. Dans la communication, suggérer est plus puissant que décrire.",
    sourceTitle: "Impressionnisme",
    topicNames: ['Art & Design']
  },

  // Débat & Rhétorique
  {
    title: "Les 7 fallacies les plus courantes",
    content: "Ad hominem (attaquer la personne), homme de paille (déformer l'argument), fausse équivalence (A=B sans preuve), appel à l'autorité (c'est vrai parce que X dit), causalité = corrélation (A avant B ≠ A cause B), faux dilemme (soit A soit B, ignore C), et glissement de pente (A mène inevitably à Z).",
    takeaway: "Apprenez ces 7 fallacies. Les reconnaître dans vos propres arguments est plus important que les repérer chez les autres. L'humilité intellectuelle commence par l'autocritique.",
    sourceTitle: "Fallacieux",
    topicNames: ['Débat & Rhétorique']
  },
  {
    title: "L'art de la question Socratique",
    content: "Socrate ne donnait pas de réponses : il posait des questions. 'Que veux-tu dire par là ?' 'Comment le sais-tu ?' 'Quelles sont les exceptions ?' Cette méthode maïeutique (accouchement des esprits) force l'interlocuteur à examiner ses propres croyances.",
    takeaway: "Au lieu de contredire, posez des questions. 'Comment savez-vous ça ?' est plus puissant que 'Vous avez tort'. Les gens défendent moins leurs idées quand ils doivent les expliquer.",
    sourceTitle: "Méthode socratique",
    topicNames: ['Débat & Rhétorique']
  },
  {
    title: "L'argument d'autorité : quand c'est légitime",
    content: "Appeler à une autorité n'est pas toujours une fallacy. Si un climatologue parle de climat, c'est légitime. S'il parle de médecine, ce n'est pas. La clé : l'autorité doit être pertinente au domaine. Un Nobel de physique n'est pas plus crédible en économie qu'un autre.",
    takeaway: "Évaluez la compétence de l'autorité dans le domaine concerné, pas son prestige global. Le génie dans un domaine n'est pas la compétence dans un autre.",
    sourceTitle: "Appel à l'autorité",
    topicNames: ['Débat & Rhétorique']
  },
  {
    title: "La rhétorique d'Aristote : éthos, pathos, logos",
    content: "Aristote a identifié 3 modes de persuasion : éthos (crédibilité du locuteur), pathos (émotion du public), logos (logique de l'argument). Un bon discours utilise les trois. Un discours trop logique sans émotion persuade l'esprit mais pas le cœur.",
    takeaway: "Structurez vos arguments : éthos (pourquoi vous êtes légitime), logos (les faits), pathos (l'émotion). Les trois ensemble sont irrésistibles.",
    sourceTitle: "Rhétorique",
    topicNames: ['Débat & Rhétorique']
  },
  {
    title: "Le strawman : déformer pour mieux attaquer",
    content: "L'homme de paille consiste à présenter une version exagérée ou fausse de l'argument de l'adversaire, puis à l'attaquer. 'Tu veux réduire le budget éducatif ?' 'Non, je veux le réorganiser.' C'est la fallacy la plus courante en politique et sur les réseaux sociaux.",
    takeaway: "Reformulez l'argument de l'autre ET avant de le contester. 'Si j'ai bien compris, tu dis X. Est-ce exact ?' Cela élimine 90% des faux débats.",
    sourceTitle: "Homme de paille",
    topicNames: ['Débat & Rhétorique']
  },
  {
    title: "Le principe de charité : interpréter généreusement",
    content: "Le principe de charité dit qu'on doit interpréter l'argument de l'autre dans sa forme la plus forte possible avant de le contester. Si vous ne pouvez pas battre la version la plus forte de son argument, vous ne l'avez pas battu.",
    takeaway: "Avant de répondre, demandez : 'Comment l'autre personne verrait cet argument comme le plus solide possible ?' Cette simple question transforme vos débats.",
    sourceTitle: "Principe de charité",
    topicNames: ['Débat & Rhétorique']
  },
  {
    title: "La charge de la preuve : à qui de prouver",
    content: "Celui qui fait l'affirmation exceptionnelle a la charge de la preuve. 'Les licornes existent' = vous devez prouver. 'Les licornes n'existent pas' = je n'ai pas à prouver. C'est pourquoi on ne peut pas prouver l'inexistence de Dieu : la charge est sur ceux qui affirment.",
    takeaway: "Ne vous embourbez pas dans des preuves d'inexistence. Si quelqu'un fait une affirmation, c'est à lui de prouver. 'Prouvez-le' est toujours la réponse légitime.",
    sourceTitle: "Charge de la preuve",
    topicNames: ['Débat & Rhétorique']
  },
  {
    title: "L'analogie : puissante mais trompeuse",
    content: "Les analogies rendent les concepts complexes accessibles : 'Le cerveau est comme un ordinateur'. Mais toute analogie a des limites. Le cerveau n'a pas de clavier, d'écran ou de système d'exploitation. Une analogie mal utilisée masque plus qu'elle n'éclaire.",
    takeaway: "Utilisez des analogies pour introduire, pas pour prouver. Dès que l'analogie se brise, revenez aux faits. 'C'est comme X, mais contrairement à X...'",
    sourceTitle: "Analogie",
    topicNames: ['Débat & Rhétorique']
  },
  {
    title: "Le syllogisme : la logique en trois lignes",
    content: "Tous les hommes sont mortels. Socrate est un homme. Donc Socrate est mortel. C'est un syllogisme valide : la conclusion découle nécessairement des prémisses. Mais si une prémisse est fausse ('Tous les oiseaux peuvent voler'), la conclusion peut être fausse même si le raisonnement est valide.",
    takeaway: "Vérifiez toujours les prémisses d'un argument, pas seulement la logique. Un raisonnement parfait partant de prémisses fausses mène à une conclusion fausse.",
    sourceTitle: "Syllogisme",
    topicNames: ['Débat & Rhétorique']
  },
  {
    title: "L'argument ad populum : la foule a-t-elle raison ?",
    content: "68% des gens croient X ≠ X est vrai. L'argument ad populum (appeal to popularity) est une fallacy courante : 'Tout le monde le fait donc c'est bien'. La majorité a souvent tort : la Terre plate était 'commune' pendant des siècles.",
    takeaway: "La popularité d'une idée est un indicateur social, pas une preuve de vérité. Les idées révolutionnaires commencent toujours avec une minorité.",
    sourceTitle: "Argument ad populum",
    topicNames: ['Débat & Rhétorique']
  },
]

async function main() {
  console.log('🌱 Seed manuel - 100 idées')

  // Create root topics first
  const ROOT_TOPICS = [
    { name: 'Psychologie', icon: '🧠', color: '#6366f1', description: 'Étude du comportement et de l\'esprit humain' },
    { name: 'Philosophie', icon: '🏛️', color: '#8b5cf6', description: 'Réflexion sur les questions fondamentales de l\'existence' },
    { name: 'Sciences cognitives', icon: '🔬', color: '#ec4899', description: 'Étude interdisciplinaire de l\'esprit et du cerveau' },
    { name: 'Économie', icon: '💰', color: '#f97316', description: 'Science des choix et de l\'allocation des ressources' },
    { name: 'Communication', icon: '🗣️', color: '#22c55e', description: 'Échange d\'informations et interaction entre individus' },
    { name: 'Productivité', icon: '⚡', color: '#eab308', description: 'Art d\'optimiser son temps et ses efforts' },
    { name: 'Santé & Bien-être', icon: '🧘', color: '#14b8a6', description: 'Développement du physique et du mental' },
    { name: 'Créativité', icon: '💡', color: '#f43f5e', description: 'Capacité à générer des idées nouvelles et originales' },
    { name: 'Leadership', icon: '👑', color: '#3b82f6', description: 'Art d\'inspirer et guider les autres' },
 { name: 'Histoire', icon: '📜', color: '#7c3aed', description: 'Étude des événements passés et de leurs leçons' },
  { name: 'Voitures', icon: '🚗', color: '#ef4444', description: 'Automobiles, technologie et industrie automobile' },
  { name: 'Finance & Argent', icon: '💰', color: '#ff6b35', description: 'Gestion personnelle, investissement et compréhension de l\'argent' },
  { name: 'Technologie & Innovation', icon: '💻', color: '#3b82f6', description: 'Numérique, intelligence artificielle et cycles d\'innovation' },
  { name: 'Sociologie', icon: '👥', color: '#14b8a6', description: 'Dynamiques de groupe, structures et comportements collectifs' },
  { name: 'Physique', icon: '⚛️', color: '#8b5cf6', description: 'Lois de l\'univers, paradoxes et découvertes fondamentales' },
  { name: 'Cuisine & Alimentation', icon: '🍳', color: '#f97316', description: 'Science culinaire, techniques et cultures alimentaires' },
  { name: 'Biologie & Évolution', icon: '🧬', color: '#22c55e', description: 'Vie, adaptation, sélection naturelle et systèmes biologiques' },
  { name: 'Mathématiques', icon: '🔢', color: '#ec4899', description: 'Paradoxes, théorèmes, probabilités et logique' },
  { name: 'Art & Design', icon: '🎨', color: '#ef4444', description: 'Mouvements artistiques, principes visuels et créativité' },
  { name: 'Débat & Rhétorique', icon: '🎤', color: '#a855f7', description: 'Art de convaincre, logique et argumentation structurée' },
]

  for (const topicData of ROOT_TOPICS) {
    const existing = await prisma.topic.findUnique({ where: { name: topicData.name } })
    if (!existing) {
      await prisma.topic.create({ data: { ...topicData, slug: slugify(topicData.name) } })
      console.log(`  ✓ Topic créé: ${topicData.name}`)
    }
  }

  // Create missing sources first
  const sourceTitles = [...new Set(IDEAS.map(i => i.sourceTitle))]
  for (const title of sourceTitles) {
    const existing = await prisma.source.findFirst({ where: { title } })
    if (!existing) {
      await prisma.source.create({
        data: {
          title,
          slug: slugify(title),
          type: 'WIKIPEDIA',
          url: `https://fr.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        },
      })
      console.log(`  ✓ Source créée: ${title}`)
    }
  }

  let created = 0

  for (const ideaData of IDEAS) {
    const source = await prisma.source.findFirst({
      where: { title: ideaData.sourceTitle },
    })

    if (!source) {
      console.log(`  ⚠️ Source manquante: ${ideaData.sourceTitle}`)
      continue
    }

    const topics = await prisma.topic.findMany({
      where: { name: { in: ideaData.topicNames } },
    })

    const topicIds = topics.map(t => t.id)

    if (topicIds.length === 0) {
      console.log(`  ⚠️ Topics manquants: ${ideaData.topicNames.join(', ')}`)
      continue
    }

    try {
      await prisma.idea.create({
        data: {
          title: ideaData.title,
          content: ideaData.content,
          takeaway: ideaData.takeaway,
          slug: `${slugify(ideaData.title)}-${created}`,
          sourceId: source.id,
          orderIndex: created,
          ideaTopics: {
            create: topicIds.map(topicId => ({
              topic: { connect: { id: topicId } }
            })),
          },
        },
      })
      created++
      console.log(`  ✓ ${ideaData.title}`)
    } catch (e) {
      console.log(`  ✗ ${ideaData.title} (déjà existe?)`)
    }
  }

  console.log(`\n✅ ${created} idées créées`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
