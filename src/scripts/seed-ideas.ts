import 'dotenv/config'
import { prisma } from '../lib/db'
import { slugify } from '../lib/utils'

export const IDEAS = [
  {
    title: "L'effet Dunning-Kruger",
    content: "L'effet Dunning-Kruger, nommé d'après les psychologes David Dunning et Justin Kruger qui l'ont décrit en 1990, révèle un paradoxe fascinant de l'esprit humain : les personnes les moins compétentes dans un domaine ont tendance à surestimer massivement leurs compétences, tandis que les véritables experts ont tendance à sous-estimer les leurs. Dans leur étude célèbre, les participants notés parmi les moins forts au raisonnement logique et à l'humour estimaient avoir performé mieux que 60% des autres, alors qu'ils étaient en réalité dans le quintile inférieur. Ce double biais s'explique par un mécanisme en deux parties : d'une part, le manque de compétence empêche de reconnaître l'erreur ; d'autre part, cette même méconnaissance crée une bulle de confiance inébranlable. Les travaux ultérieurs ont montré que cet effet touche tous les domaines : conducteurs estimant their conduite au-dessus de la moyenne, médecins, étudiants en université, et même professionnels de la finance.",
    takeaway: "Quand vous êtes certain d'avoir raison, posez-vous trois questions précises : quelles sont les preuves contraires à ma position ? Qui sait mieux que moi ce sujet, et que pensent-ils ? Si j'avais tort, quels signs aurais-je pu manquer ? Cette pratique d'humilité cognitive, appelée 'incertitude active', vous protège de l'overconfidence bias qui cause plus d'erreurs que l'incompétence pure.",
    sourceTitle: "Effet Dunning-Kruger",
    topicNames: ['Psychologie']
  },
  {
    title: "Le biais de confirmation",
    content: "Le biais de confirmation est l'un des phénomènes psychologiques les mieux documentés et les plus universels. Des études remontant aux expériences de Peter Wason dans les années 1960 montrent systématiquement que les humains privilégient trois mécanismes complémentaires : la recherche sélective (on consulte activement les sources qui confirment nos croyances), l'interprétation biaisée (on donne plus de poids aux informations qui vont dans notre sens tout en critiquant les contraires), et la mémoire sélective (on se souvient mieux des confirmations que des réfutations). Un exemple classique : les partisans d'un candidat politique vont naturellement lire les articles favorables à son candidat et ignorer les critiques, tout en considérant les bonnes nouvelles de son camp comme 'évidentes' et les mauvaises comme 'exagérées'. Ce biais est si profond qu'il persiste même quand on en avertit les gens, et s'amplifie quand on est émotionnellement investi dans une croyance.",
    takeaway: "Pratiquez le 'steelman' au lieu du 'strawman' : cherchez activement les MEILLEURES arguments contre votre position, pas les faibles. Lisez des sources que vous méprisez habituellement. Quand vous sentez que vous 'avez raison', demandez-vous : pourrais-je expliquer le point de vue opposé de manière si convaincante que quelqu'un qui le partage dirait 'oui, c'est exactement ça' ?",
    sourceTitle: "Biais cognitifs",
    topicNames: ['Psychologie']
  },
  {
    title: "L'heuristique de disponibilité",
    content: "L'heuristique de disponibilité, théorisée par Amos Tversky et Daniel Kahneman en 1973, explique comment notre cerveau évalue la probabilité et l'importance des événements non pas sur la base de données statistiques objectives, mais selon la facilité avec laquelle des exemples nous viennent à l'esprit. Les événements récents, dramatiques, visuels ou émotionnellement marquants sont surévalués parce qu'ils sont plus 'disponibles' en mémoire. Par exemple, après un reportage sur un accident d'avion, les gens surestiment massivement le risque de l'avion et sous-estiment le risque de la voiture, alors que statistiquement, les accidents automobiles sont des milliers de fois plus fréquents. Ce biais structure notre perception du risque mondial : nous craignons les attaques de requins (médiatisées) plus que la consommation d'aliments contaminés (moins spectaculaire mais bien plus mortelle). Les médias modernes amplifient encore ce phénomène en sélectionnant les événements les plus dramatiques plutôt que les plus représentatifs.",
    takeaway: "Avant de juger la fréquence ou l'importance d'un phénomène, demandez-vous : est-ce que je le perçois comme plus grand juste parce que j'en ai vu des exemples récents ou marquants ? Cherchez toujours les données de base (base rates) : combien de cas existent réellement ? Un exemple mémorable ne vaut pas un chiffre statistique.",
    sourceTitle: "Heuristique (psychologie)",
    topicNames: ['Psychologie']
  },
  {
    title: "La dissonance cognitive",
    content: "La dissonance cognitive, théorisée par Leon Festinger en 1957, décrit la tension psychologique désagréable que nous ressentons lorsque nous maintenons simultanément deux cognitions contradictoires, ou lorsque nos actions contredisent nos croyances. Festinger a montré que cette incongruence crée un état de stress mental similaire à la faim ou à la soif, et que nous sommes motivés à le réduire de trois manières : changer notre comportement (arrêter de fumer), changer notre cognition (me dire que fumer n'est pas si dangereux), ou ajouter de nouvelles cognitions (dire que fumer me détend, ce qui compense les risques). L'exemple classique : les fumeurs savent que le tabac tue mais continuent de fumer, et pour justifier leur comportement, ils minimisent les risques ('mon grand-père a fumé jusqu'à 90 ans') ou surévaluent les bénéfices ('ça me calme'). La dissonance explique aussi pourquoi, après un effort important (initiation, achat coûteux, sacrifice), nous valorisons davantage ce qui en a coûté : le cerveau justifie l'investissement en créant une préférence.",
    takeaway: "Identifiez vos dissonances en observant vos justifications spontanées : quand vous dites 'c'est pas si grave' ou 'ça vaut le coup' de manière trop rapide, vous êtes probablement en dissonance. Posez-vous la question : si je recommençais depuis zéro, avec toutes les informations que j'ai maintenant, est-ce que je ferais le même choix ? Si non, votre préférence est probablement une dissonance réduite, pas un vrai jugement.",
    sourceTitle: "Dissonance cognitive",
    topicNames: ['Psychologie']
  },
  {
    title: "L'effet de cadrage",
    content: "L'effet de cadrage, découvert par Kahneman et Tversky dans les années 1980, révèle que la manière dont une même information est formulée change radicalement nos décisions, même quand le contenu objectif est identique. Dans leur expérience fondamentale sur la 'maladie asiatique', les participants ont fait des choix opposés selon que les options étaient présentées en termes de gains ('200 vies sauvées sur 600') ou de pertes ('400 vies perdues sur 600'). En médecine, un chirurgien présentera un taux de survie de 90% quand il veut encourager l'opération, et un taux de mortalité de 10% quand il veut souligner les risques, alors que les deux chiffres sont mathématiquement identiques. Ce phénomène s'étend à tous les domaines : marketing (90% maigre vs 10% gras), politique (réduction des impôts vs augmentation des dépenses), et même les relations personnelles ('tu as toujours raison' vs 'tu as parfois raison'). Le cerveau humain n'est pas un calculateur rationnel : il réagit au cadrage émotionnel bien plus qu'à la logique sous-jacente.",
    takeaway: "Quand on vous présente un choix, reformulez-le mentalement dans l'autre sens : si on vous dit '90% de réussite', pensez '10% d'échec'. Cette simple gymnantie cognitive vous révèle le cadrage et vous permet de prendre une décision plus objective. Dans vos propres communications, choisissez le cadrage qui met en valeur l'aspect le plus important pour votre audience.",
    sourceTitle: "Heuristique (psychologie)",
    topicNames: ['Psychologie']
  },
  {
    title: "Le cercle vertueux stoïcien",
    content: "Le cercle vertueux stoïcien, au cœur de la philosophie de Marc Aurèle, Épictète et Sénèque, repose sur une distinction fondamentale que les Stoïciens appellent la 'dichotomie du contrôle' : tout dans l'univers se divise en deux catégories, ce qui dépend de nous (nos jugements, nos décisions, nos actions, nos valeurs) et ce qui n'en dépend pas (notre réputation, notre richesse, notre santé, le temps, les autres personnes, les événements extérieurs). Épictète, né esclave et borgne, a fait de cette distinction son outil de survie : 'Parmi les choses existantes, les unes dépendent de nous, les autres ne dépendent pas de nous.' Concentrer son énergie exclusivement sur le premier cercle — ce qu'on peut contrôler — produit ce que les Stoïciens appellent 'ataraxie', une tranquillité d'esprit inébranlable. Marc Aurèle, empereur de Rome qui a passé une grande partie de son règne à combattre des guerres et une peste, notait dans ses 'Pensées pour moi-même' : 'Tu as pouvoir sur ton esprit — pas sur les événements extérieures. Realise cela, et tu trouveras la force.' Cette philosophie n'est pas de l'apathie : les Stoïciens agissent pleinement dans le monde, mais sans attacher leur bonheur au résultat.",
    takeaway: "Chaque matin, pratiquez la 'préméditation des maux' (premeditatio malorum) : listez ce que vous pouvez contrôler aujourd'hui (vos actions, votre attitude, vos efforts) et ce que vous ne pouvez pas (les résultats, les opinions des autres, les événements). Investissez votre énergie émotionnelle UNIQUEMENT dans le premier groupe. Chaque soir, faites un bilan : où avez-vous gaspillé votre énergie sur des choses hors de votre contrôle ?",
    sourceTitle: "Stoïcisme",
    topicNames: ['Philosophie']
  },
  {
    title: "L'existence précède l'essence",
    content: "L'affirmation 'l'existence précède l'essence' est la formule centrale de l'existentialisme de Jean-Paul Sartre, exposée dans son œuvre majeure 'L'existentialisme est un humanisme' (1946). Sartre inverse la conception traditionnelle : depuis l'Antiquité, on pensait que les êtres humains avaient une 'nature' prédéfinie (une essence) — raisonnable, social, moral — et que notre rôle était de réaliser cette essence. Sartre affirme le contraire : nous sommes d'abord des êtres qui apparaissent dans le monde (l'existence), sans nature prédéfinie, et c'est par nos choix et actions que nous définissons qui nous sommes (l'essence). Contrairement à un couteau de poche, conçu selon un concept précis (couper, trancher, trancher fin), l'humain n'a pas de 'manuel d'utilisation' divin ou naturel. Cette liberté radicale implique une responsabilité totale : si rien ne définit qui je suis, alors je suis entièrement responsable de ce que je deviens. Sartre appelle cela la 'condamnation à être libre' — pas parce que la liberté est belle, mais parce que nous ne pouvons pas échapper au poids de nos choix, même le choix de ne pas choisir est un choix.",
    takeaway: "Arrêtez de dire 'je ne peux pas' ou 'c'est dans ma nature'. Chaque matin, posez-vous la question existentielle : 'Si je n'étais pas limité par mon passé, ma famille ou mes habitudes, qui choiserais-je d'être aujourd'hui ?' Vos actions d'aujourd'hui écrivent votre essence. Vous n'êtes pas ce que vous avez vécu, vous êtes ce que vous faites avec ce que vous avez vécu.",
    sourceTitle: "Existentialisme",
    topicNames: ['Philosophie']
  },
  {
    title: "Le doute méthodique",
    content: "Le doute méthodique de Descartes, exposé dans les 'Méditations sur la philosophie première' (1641), est l'un des exercices intellectuels les plus radicaux jamais conçus. Plutôt que d'accepter les croyances héritées de l'éducation et des sens, Descartes propose de remettre en question TOUT, systématiquement, jusqu'à trouver ce qui résiste à任何形式的 doute. Il passe en revue les fondements de la connaissance : les sens (qui nous trompent parfois, donc peuvent nous tromper toujours), les mathématiques (un 'démon malin' pourrait nous induire en erreur), et même la réalité du monde extérieur. Finalement, il trouve une vérité indubitable : le fait même de douter prouve l'existence d'un douteur. 'Je pense, donc je suis' (Cogito, ergo sum) n'est pas une déduction logique mais une expérience directe : je peux douter que le monde existe, je ne peux pas douter que je doute. Descartes utilise ce point d'ancrage pour reconstruire la connaissance pierre par pierre, établissant les fondements de la philosophie moderne et de la méthode scientifique.",
    takeaway: "Prenez 10 minutes chaque jour pour douter d'une de vos certitudes les plus profondes. Pas superficiellement, mais vraiment : quelles sont les preuves que cette croyance est vraie ? Si elles sont faibles, êtes-vous prêt à l'abandonner ? Le doute n'est pas du cynisme : c'est un outil de purification intellectuelle qui élimine les croyances faibles pour ne garder que les solides.",
    sourceTitle: "Pensée critique",
    topicNames: ['Philosophie']
  },
  {
    title: "L'amor fati",
    content: "L'amor fati (l'amour du destin) est un concept développé par Friedrich Nietzsche, particulièrement dans 'Le Gai Savoir' et 'Ainsi parlait Zarathoustra'. Pour Nietzsche, ce n'est pas suffisant d'accepter ce qui nous arrive — il faut l'aimer activement, le désirer même. L'amor fati va au-delà du stoïcisme : les Stoïciens disent 'accepte ce que tu ne peux changer', Nietzsche dit 'aime ce que tu ne peux changer, et rends-le si tien que tu souhaiterais qu'il se répète à l'infini'. Ce concept est lié à son idée de l'éternel retour : imaginez que votre vie se répète identique, chaque douleur, chaque joie, chaque détail, à l'infini. Pourriez-vous dire 'oui' à cette perspective ? L'amor fati transforme la résignation en enthousiasme. Chaque événement, même les plus douloureux, devient une pièce nécessaire du puzzle de votre vie. Nietzsche voyait dans la souffrance non pas un obstacle à surmonter mais un matériau de transformation : 'Ce qui ne me tue pas me rend plus fort' n'est pas un encouragement passif, c'une affirmation que la douleur, aimée, devient source de puissance.",
    takeaway: "Face à l'adversité, passez par trois étapes : d'abord, acceptez (ce qui est arrivé est arrivé). Ensuite, analysez (que peut m'apprendre cette situation ?). Enfin, aimez (comment cette expérience me rend-elle plus fort, plus profond, plus complet ?). Quand vous regardez en arrière, demandez-vous : si je n'avais pas vécu cela, qui serais-je ? La réponse est souvent : moins.",
    sourceTitle: "Stoïcisme",
    topicNames: ['Philosophie']
  },
  {
    title: "Le paradoxe de la tolérance",
    content: "Le paradoxe de la tolérance, formulé par le philosophe Karl Popper dans 'La Société ouverte et ses ennemis' (1945), pose une question fondamentale : une société parfaitement tolérante peut-elle survivre ? Popper observe que si une société accepte indéfiniment toutes les opinions, y compris l'intolérance, et accorde une tolérance illimitée aux intolérants, ces derniers finiront par utiliser la liberté donnée par la société tolérante pour la détruire. L'intolérant peut dire : 'Je tolère votre tolérance, mais je ne tolère pas votre tolérance.' Popper en conclut que pour maintenir une société tolérante, il faut être intolérant envers l'intolérance : il faut pouvoir exclure, par la raison et non par la force, ceux qui refusent les règles du dialogue. Cette distinction est cruciale : ce n'est pas 'intolérance totale' mais 'tolérance conditionnelle'. Les tolérants doivent tolérer tout le monde, SAUF ceux qui, une fois au pouvoir, ne toléreront pas les autres. L'histoire du 20ème siècle (montée du nazisme en Allemagne democratie) illustre ce paradoxe : la démocratie allemande a été trop tolérante envers ses ennemis.",
    takeaway: "Dans vos propres espaces (équipe, famille, communauté), définissez clairement les règles non négociables du dialogue. La tolérance n'est pas l'absence de limites, c'est la capacité d'appliquer des limites de manière juste. Protégez l'espace de dialogue en excluant ceux qui le détruisent, mais faites-le avec la même rigueur que vous appliquez à ceux que vous défendez.",
    sourceTitle: "Pensée critique",
    topicNames: ['Philosophie']
  },
  {
    title: "La neuroplasticité",
    content: "La neuroplasticité (ou plasticité cérébrale) est la capacité du cerveau à se réorganiser en formant de nouvelles connexions neuronales tout au long de la vie. Longtemps croyait que le cerveau adulte était 'fixe', les découvertes des années 1960 à aujourd'hui ont montré que le cerveau reste malléable jusqu'à un âge avancé. Chaque fois que vous apprenez quelque chose, des synapses se renforcent ou se créent : c'est la 'plasticité dépendante de l'expérience'. Les Londoniens chauffeurs de taxi, qui doivent mémoriser 25000 rues dans 'The Knowledge', ont un hippocampe (zone de mémoire spatiale) significativement plus volumineux que la moyenne — et cette croissance est corrélée à la durée d'expérience. Inversement, les synapses non utilisées sont 'élaguées' (pruning), un processus essentiel au développement mais qui explique aussi pourquoi on oublie ce qu'on n'utilise pas. La neuroplasticité fonctionne sur le principe 'use it or lose it' : les circuits neuronaux fréquemment activés deviennent plus efficaces et plus rapides, tandis que les circuits inactifs s'affaiblissent. C'est le fondement biologique de l'apprentissage, de la mémoire, et de la récupération après lésion cérébrale.",
    takeaway: "Votre cerveau change physiquement chaque fois que vous apprenez. Pour créer un changement durable : pratiquez régulièrement (la répétition renforce les connexions), dormez suffisamment (la consolidation se fait pendant le sommeil), et exposez-vous à de nouvelles expériences (la nouveauté stimule la neurogenèse). À tout âge, vous pouvez transformer votre cerveau par ce que vous en faites.",
    sourceTitle: "Neuroplasticité",
    topicNames: ['Sciences cognitives']
  },
  {
    title: "La mémoire de travail",
    content: "La mémoire de travail (ou mémoire à court terme) est le système cognitif qui maintient et manipule l'information active pendant de courtes périodes. George Miller a montré en 1956 que sa capacité est limitée à '7 plus ou moins 2' éléments (la 'loi magique'), et des recherches plus récentes (Cowan, 2001) suggèrent que la véritable limite est encore plus basse : 4 à 5 chunks d'information. Un 'chunk' est un groupe d'informations liées traité comme une seule unité : pour un expert en échiquier, une configuration de pièces est un seul chunk, tandis que pour un débutant, c'est 6-7 éléments individuels. Cette limitation a des implications profondes : un numéro de téléphone ne peut être retenu que s'il est abrégé en 2-3 chunks (indicatif + 4 chiffres + 4 chiffres), une présentation efficace ne devrait pas présenter plus de 3 points principaux à la fois, et le multitâche est en grande partie un mythe : le cerveau alterne rapidement entre les tâches, payant un 'coût de commutation' cognitif à chaque changement. C'est pourquoi les listes de 7 éléments maximum sont plus faciles à retenir, et pourquoi les menus de restaurant bien conçus ne présentent pas plus de 5-6 options par catégorie.",
    takeaway: "Quand vous apprenez ou présentez quelque chose de complexe, divisez-le en chunks de 4 éléments maximum. Utilisez la externalisation : écrivez, dessinez, ou utilisez des supports visuels pour décharger votre mémoire de travail. Si vous devez retenir plus de 4 éléments simultanément, votre cerveau va nécessairement en oublier — et c'est normal, pas un défaut.",
    sourceTitle: "Mémoire de travail",
    topicNames: ['Sciences cognitives']
  },
  {
    title: "L'effet despacing",
    content: "L'effet de espacement (spacing effect), aussi appelé 'effect of distributed practice', est l'un des phénomènes les plus robustes et reproductibles en psychologie de l'apprentissage. Découvert par Hermann Ebbinghaus dans les années 1880 à travers ses expériences sur la mémoire, il montre que la rétention à long terme est considérablement améliorée lorsque les sessions d'étude sont espacées dans le temps, par opposition à une pratique intensive (massed practice ou 'cramming'). Le mécanisme sous-jacent est fascinant : chaque fois que vous révisez un concept après une période d'oubli partiel, le cerveau doit 'reconstruire' la trace mnésique, ce qui la renforce significativement. Plus l'intervalle entre les révisions est long (tout en restant dans la zone de 'récupération difficile'), plus le renforcement est puissant. La 'courbe d'oubli' d'Ebbinghaus montre que nous oublions environ 50% d'une nouvelle information dans les premières heures, et 70% en 24 heures. Les révisions espacées contrerent cet oubli en activant la consolidation synaptique : chaque rappel réussi renforce les connexions neuronales et ralentit la courbe d'oubli pour la prochaine révision. Des études montrent qu'avec un espacement optimal, la rétention après 6 mois peut être 2 à 3 fois supérieure à celle obtenue par le cramming.",
    takeaway: "Appliquez la règle des intervalles croissants : révisez un nouveau concept 1 jour après l'apprentissage, puis 3 jours après, puis 1 semaine après, puis 2 semaines après, puis 1 mois après. Chaque révision devient plus courte mais plus puissante. Utilisez des applications comme Anki ou SuperMemo qui automatisent cet espacement optimal basé sur l'algorithte SM-2.",
    sourceTitle: "Mémoire de travail",
    topicNames: ['Sciences cognitives']
  },
  {
    title: "L'apprentissage actif",
    content: "L'apprentissage actif (active learning) repose sur le principe que l'engagement actif du cerveau dans le traitement de l'information produit une mémorisation et une compréhension profondes, contrairement à l'apprentissage passif. Le 'cône de l'apprentissage' de Edgar Dale (1969), bien que parfois critiqué dans ses chiffres exacts, capture une vérité fondamentale : nous retenons environ 10% de ce que nous lisons, 20% de ce que nous entendons, 30% de ce que nous voyons, mais jusqu'à 90% de ce que nous faisons ou enseignons. Les neurosciences modernes expliquent ce phénomène par plusieurs mécanismes : d'abord, l'effort de récupération active (retrieval practice) renforce les traces mnésiques plus que la simple relecture ; ensuite, l'enseignement à autrui (l'effet 'protégé') force à organiser et synthétiser l'information ; enfin, l'application pratique crée des connexions multisensorielles et émotionnelles qui ancrent l'apprentissage. Une étude de Freeman et al. (2014, PNAS) ayant analysé 225 études sur l'enseignement scientifique a montré que les méthodes actives réduisent le taux d'échec de 55% par rapport à l'enseignement magistral traditionnel. L'apprentissage actif inclut : la pratique de récupération (se tester), l'enseignement aux pairs, les projets appliqués, les discussions, et la résolution de problèmes.",
    takeaway: "Après avoir lu un concept, fermez le livre et écrivez ce que vous avez compris en vos propres mots. Ensuite, expliquez-le à quelqu'un (ou à un canard en caoutchouc, méthode du canard). Chaque fois que vous apprenez quelque chose, posez-vous la question : 'Comment puis-je appliquer ça aujourd'hui ?' L'action immédiate est le meilleur ancrage mémoire.",
    sourceTitle: "Neuroplasticité",
    topicNames: ['Sciences cognitives']
  },
  {
    title: "Le flow cognitif",
    content: "Le flow cognitif, concept développé par le psychologue Mihaly Csikszentmihalyi dans les années 1970, décrit un état mental d'absorption totale où l'individu est pleinement immergé dans une activité, avec une concentration intense, une perte de la conscience de soi, et une distorsion de la perception du temps. Dans cet état, la performance atteint son apogée : les artistes créent leurs meilleures œuvres, les sportifs battent des records, les programmeurs codent avec une fluidité exceptionnelle. Csikszentmihalyi a identifié la condition clé du flow : l'équilibre parfait entre le niveau de défi de la tâche et le niveau de compétence de la personne. Si le défi est trop faible par rapport à la compétence, on ressent de l'ennui ; s'il est trop élevé, on ressent de l'anxiété. Le flow se produit dans la 'zone de confort étendu', juste au-delà de la zone de confort. Les caractéristiques du flow incluent : une fusion entre l'action et la conscience, un feedback immédiat permettant d'ajuster en temps réel, un sentiment de contrôle, une absence de préoccupations sociales, et une transformation du sens du temps (les heures semblent passer en minutes). Des études neuroscientifiques montrent que le flow est associé à une 'hypofrontalité transitoire' : l'activité du cortex préfrontal (siège de l'autoconscience) diminue, libérant des ressources cognitives pour la tâche.",
    takeaway: "Pour entrer en flow régulièrement : choisissez des tâches avec un défi légèrement supérieur à votre niveau actuel, éliminez toutes les distractions (téléphone, notifications), et définissez des objectifs clairs et immédiats. Le flow ne survient pas au hasard : c'est un état que vous pouvez cultiver en créant les conditions optimales. Commencez par des sessions de 25-45 minutes de travail ininterrompu sur une tâche qui vous engage pleinement.",
    sourceTitle: "Flow (psychologie)",
    topicNames: ['Sciences cognitives']
  },
  {
    title: "L'aversion à la perte",
    content: "L'aversion à la perte (loss aversion), découverte par Daniel Kahneman et Amos Tversky dans leur 'Théorie des perspectives' (1979), est l'un des biais les plus puissants et universels de la prise de décision humaine. Leurs expériences ont montré que la douleur de perdre est psychologiquement environ deux fois plus intense que le plaisir de gagner un montant équivalent. Dans une expérience célèbre, les participants devaient choisir entre garder 240 dollars sur 500 ou accepter un risque de 25% de tout perdre. La majorité a choisi l'option sûre, même si le gain espéré du risque (125$) était supérieur. Ce biais explique de nombreux comportements irrationnels : pourquoi nous gardons des actions perdantes trop longtemps (espérant 'se refaire') mais vendons les gagnantes trop tôt (peur de perdre le gain), pourquoi nous payons plus cher pour une assurance inutile, et pourquoi le simple fait de posséder quelque chose en augmente la valeur perçue (effet de dotation). En neuroscience, les images IRM montrent que les régions du cerveau associées à la douleur (cortex insulaire) s'activent plus fortement lors d'une perte que lors d'un gain équivalent. L'aversion à la perte n'est pas une faiblesse : c'un héritage évolutif, car pour nos ancêtres, perdre sa nourriture avait des conséquences plus graves que d'en gagner autant.",
    takeaway: "Quand vous hésitez à prendre un risque, demandez-vous : est-ce que ma décision est guidée par la peur de perdre ou par une analyse rationnelle ? Pratiquez le 'premortem' : imaginez que vous avez déjà pris la décision et que ça a mal tourné. Qu'est-ce qui a causé l'échec ? Cette technique, développée par Gary Klein, active votre cortex préfrontal (rationnel) et réduit l'emprise de l'amygdale (émotionnelle) sur votre décision.",
    sourceTitle: "Aversion à la perte",
    topicNames: ['Économie']
  },
  {
    title: "La théorie des jeux et le dilemme du prisonnier",
    content: "Le dilemme du prisonnier est l'un des jeux les plus étudiés en théorie des jeux, car il capture parfaitement le tension entre l'intérêt individuel et l'intérêt collectif. Imaginez deux complices arrêtés : isolés chacun dans une cellule, ils doivent choisir entre 'coopérer' (garder le silence) ou 'trahir' (dénoncer l'autre). Si les deux coopèrent : 1 an de prison chacun (meilleur résultat collectif). Si l'un trahit et l'autre coopère : le traître est libre, le coopératif prend 3 ans. Si les deux trahissent : 2 ans chacun. Rationallement, trahir est toujours la stratégie dominante : peu importe ce que fait l'autre, trahir donne un meilleur résultat individuel. Mais si les deux suivent cette logique rationnelle, ils obtiennent un résultat pire que la coopération. Robert Axelrod a organisé un tournoi informatique en 1984 où des stratégies de différents pays ont affronté le dilemme du prisonnier répété (IPR). La stratégie gagnante, simple et élégante, était 'Tit for Tat' (œil pour œil) : coopérer au premier tour, puis simplement imiter le coup précédent de l'adversaire. Axelrod a identifié quatre caractéristiques de Tit for Tat : être gentille (ne jamais trahir en premier), être provocatrice (répondre immédiatement à la trahison), être forgiving (revenir à la coopération après avoir puni), et être claire (prévisible). Dans les relations répétées, la coopération émerge naturellement quand les joueurs ont une probabilité suffisante de se rencontrer à nouveau.",
    takeaway: "Dans vos relations professionnelles et personnelles, la stratégie 'coopérer d'abord, puis imiter' est la plus efficace à long terme. Commencez par faire confiance, punissez immédiatement la trahison mais forgivez rapidement. Cette approche, vérifiée par des décennies de recherche en théorie des jeux, crée les conditions de la coopération gagnant-gagnant.",
    sourceTitle: "Théorie des jeux",
    topicNames: ['Économie']
  },
  {
    title: "Le coût irrécupérable",
    content: "Le coût irrécupérable (sunk cost fallacy) est l'une des erreurs de décision les plus courantes et coûteuses dans tous les domaines de la vie. Le principe économique rationnel est simple : les coûts déjà engagés et irrécupérables ne devraient pas influencer les décisions futures, car ils sont identiques quelle que soit l'option choisie. Pourtant, les humains (et même les animaux) systématiquement laissons les coûts irrécupérables influencer nos choix. Daniel Kahneman illustre avec l'exemple du théâtre : une personne qui a payé 50$ pour un billet de théâtre mais tombe malade le soir même ira au théâtre malgré la maladie, juste parce qu'elle a 'payé'. Rationallement, elle devrait rester au lit : les 50$ sont irrécupérables de toute façon, et le coût supplémentaire de la maladie vaut plus que le plaisir du spectacle. La chute de Rome est un exemple macroéconomique : les empereurs ont continué à investir dans des provinces lointaines et difficiles à défendre non pas parce que c'était rationnel, mais parce qu'ils avaient déjà tant investi qu'abandonner semblait pire. En entreprise, le 'concorde syndrome' (continuer à financer un projet même quand il devient économiquement irrationnel parce qu'on a déjà dépensé des milliards) coûte des milliards chaque année. La solution est simple en théorie : 'Si je recommençais depuis zéro, avec ce que je sais maintenant, est-ce que je ferais cet investissement ?' Si la réponse est non, arrêtez.",
    takeaway: "Posez-vous la question magique : 'Si je n'avais rien investi jusqu'ici, est-ce que je commencerais aujourd'hui ?' Si la réponse est non, arrêtez immédiatement, peu importe ce que vous avez déjà dépensé. Le meilleur moment pour arrêter était hier, le deuxième meilleur est maintenant. Ne jetez pas de l'argent après de l'argent.",
    sourceTitle: "Aversion à la perte",
    topicNames: ['Économie']
  },
  {
    title: "L'effet de dotation",
    content: "L'effet de dotation (endowment effect), démontré par Kahneman, Knetsch et Thaler en 1990, est la tendance à surévaluer les objets simplement parce que nous les possédons. Dans leur expérience célèbre, des participants se voyaient donner une tasse et avaient la possibilité de la vendre. Un autre groupe de participants recevait aucune tasse et devait l'acheter. Les vendeurs demandaient en moyenne 7$ pour leur tasse, tandis que les acheteurs n'offraient que 3$ — un écart de 133% pour le même objet. Le mécanisme sous-jacent est liée à l'aversion à la perte : perdre un objet qu'on possède fait plus mal que le plaisir de gagner le même objet. Les neurosciences montrent que la simple possession active l'amygdale et l'hippocampe (régions associées à la valeur émotionnelle et à la mémoire), créant un lien affectif qui fausse l'évaluation objective. Cet effet explique pourquoi les négociations immobilières sont si difficiles (le propriétaire surévalue sa maison), pourquoi les retours de produits sont rares (les clients surévaluent ce qu'ils ont), et pourquoi les 'free trials' sont si efficaces : une fois que vous possédez temporairement quelque chose, le vendre (le rendre) semble plus douloureux que de l'acheter.",
    takeaway: "Quand vous vendez quelque chose, faites l'exercice suivant : imaginez que vous ne possédez pas l'objet et qu'on vous demande combien vous seriez prêt à payer pour l'acheter. Ce prix est sa vraie valeur pour vous. Dans les négociations, rappelez-vous que l'autre partie surévalue aussi ce qu'elle possède : reconnaissez ce biais pour mieux le contrebalancer.",
    sourceTitle: "Théorie des jeux",
    topicNames: ['Économie']
  },
  {
    title: "Les incitations perverses",
    content: "Les incitations perverses (perverse incentives) sont l'un des concepts les plus puissants pour comprendre pourquoi les systèmes échouent, même avec les meilleures intentions. La 'loi de Goodhart', formulée par l'économiste Charles Goodhart en 1975, énonce : 'Quand une mesure devient un objectif, elle cesse d'être une bonne mesure.' Dès qu'on commence à récompenser ou punir selon un indicateur spécifique, les individus vont optimiser leur comportement pour maximiser cet indicateur, souvent au détriment de l'objectif réel. L'exemple classique : quand les hôpitaux britanniques ont mesuré la performance au nombre de patients attendus dans les urgences, les médecins ont commencé à déplacer les patients chroniques vers d'autres services pour 'nettoyer' les statistiques, réduisant l'indicateur sans améliorer la qualité des soins. Un autre exemple célèbre : en Russie soviétique, l'ordre de Stalin de récompenser les fermes collectives par le nombre de clous produits a conduit les ouvriers à fabriquer d'énormes clous (faciles à compter) au lieu de clous utiles. En entreprise, les bonus basés sur le nombre de lignes de code produites ont conduit les développeurs à écrire du code verbeux et inutile. La solution n'est pas d'abandonner la mesure, mais de mesurer plusieurs indicateurs complémentaires et de comprendre comment les acteurs du système peuvent les 'gamer'.",
    takeaway: "Avant de mettre en place un système de mesure ou de récompense, posez la question de Goodhart : 'Si quelqu'un devait optimiser spécifiquement pour cet indicateur, comment s'y prendrait-il ?' Prévoyez les stratégies d'optimisation perverses et ajoutez des garde-fous. Mesurez toujours en corrélation, jamais isolément.",
    sourceTitle: "Théorie des jeux",
    topicNames: ['Économie']
  },
  {
    title: "La communication non violente",
    content: "La communication non violente (CNV), développée par le psychologue Marshall Rosenberg dans les années 1960, est un modèle de communication empathique en quatre étapes qui vise à créer des connections authentiques et à résoudre les conflits sans recourir à la force ou à la manipulation. La CNV part du constat que la plupart de nos conflits viennent de stratégies d'exploitation plutôt que de demandes de connection. Les quatre étapes sont : 1) Observer sans juger ('Quand je vois...' plutôt que 'Tu es toujours...'), ce qui sépare les faits de l'interprétation ; 2) Exprimer son sentiment ('Je me sens...' plutôt que 'Je me sens que tu...'), en distinguant les émotions des pensées ; 3) Identifier le besoin ('parce que j'ai besoin de...'), en reconnaissant que les ressent sont la manifestation de besoins non satisfaits ; 4) Formuler une demande concrète et réalisable ('Serais-tu disposé à... ?'). La puissance de la CNV réside dans sa capacité à désamorcer la défensive : quand on exprime un besoin sans blâmer, l'autre n'a plus besoin de se défendre et peut écouter. Des études ont montré que la CNV réduit les conflits de 70% dans les couples thérapeutiques et améliore significativement la communication dans les environnements professionnels et scolaires.",
    takeaway: "Remplacez 'Tu es irrespectueux quand tu me coupes la parole' par 'Quand tu me coupes la parole, je me sens frustré parce que j'ai besoin d'être entendu. Pourrais-tu me laisser finir ?' Cette simple transformation enlève la charge accusatoire et invite à la collaboration plutôt qu'à la défense.",
    sourceTitle: "Communication non violente",
    topicNames: ['Communication']
  },
  {
    title: "L'art de la négociation",
    content: "L'art de la négociation, tel que décrit par Chris Voss dans 'Never Split the Difference' (2016), révolutionne la conception traditionnelle de la négociation. Contrairement à la théorie classique qui voit la négociation comme un processus de compromis rationnel entre parties, Voss, ancien négociateur otages du FBI, montre que les négociations réussies sont avant tout des explorations émotionnelles des besoins cachés. Ses techniques les plus puissantes incluent : le 'mirroring' (répéter les 3 derniers mots d'une phrase pour encourager l'autre à se révéler davantage), les questions calibrées ('Comment puis-je faire ça ?' plutôt que 'Non'), l'étiquetage des émotions ('Il semble que vous soyez frustré...'), et l'utilisation stratégique du silence. Voss démontre que parler moins que son interlocuteur est systématiquement avantageux : les négociateurs qui parlent le moins obtiennent les meilleurs résultats car ils laissent l'autre se révéler. Le 'no' est plus puissant que le 'oui' : forcer quelqu'un à dire 'oui' crée une fragilité, tandis que le 'no' donne un sentiment de contrôle. Les accords les plus solides ne sont pas ceux où les deux parties se comparent, mais ceux où chaque partie sent qu'elle a gagné.",
    takeaway: "En négociation, parlez 30% du temps, écoutez 70%. Utilisez des questions calibrées ('Comment est-ce qu'on fait ça ?', 'Qu'est-ce qui est important pour vous ?') au lieu d'affirmations. Le silence est votre arme la plus puissante : après une proposition, taisez-vous. Plus vous attendez, plus l'autre révèlera d'informations.",
    sourceTitle: "Communication non violente",
    topicNames: ['Communication']
  },
  {
    title: "L'effet de halo",
    content: "L'effet de halo, découvert par le psychologue Edward Thorndike en 1920, est un biais cognitif par lequel notre impression générale d'une personne (souvent basée sur une caractéristique saillante comme l'apparence physique) influence notre jugement de ses autres traits, même non observés. Thorndike a observé que les officiers militaires évaluaient systématiquement les soldats attrayants comme plus intelligents, plus forts, plus fiables et de meilleure présence, même quand ils n'avaient aucune information objective sur ces qualités. Des études modernes confirment cet effet avec une régularité surprenante : les juges rendent des sentences plus clémentes pour les accusés attrayants (effet de 10-20% en moyenne), les professeurs évaluent mieux les étudiants dont la rédaction est présentée sur un papier propre et soigné (même contenu identique), et les candidats politiques attrayants ont statistiquement plus de chances d'être élus. Le cerveau utilise l'apparence comme un 'raccourci' évolutif : dans notre environnement ancestral, la symétrie faciale indiquait la santé et la génétique, donc la fiabilité. Mais dans le monde moderne, ce raccourci nous trompe fréquemment. L'effet de halo fonctionne aussi dans le sens inverse : l'effet de corne (un défaut saillant peut ternir tous les autres traits perçus).",
    takeaway: "Dans vos décisions importantes (embauche, évaluation, choix de partenaire), listez explicitement les critères objectifs AVANT de vous laisser influencer par l'impression globale. Prenez du temps pour séparer ce que vous 'ressentez' de ce que vous 'savez'. L'effet de halo est si puissant qu'il persiste même quand on le connaît.",
    sourceTitle: "Biais cognitifs",
    topicNames: ['Communication']
  },
  {
    title: "La règle des 3 secondes",
    content: "La règle des 3 secondes, bien que simplifiée, capture un phénomène bien documenté en psychologie sociale : les premières impressions se forment extrêmement rapidement et ont un poids disproportionné sur l'ensemble de l'évaluation. Des études de Yale par Nalini Ambady ont montré que les évaluations de l'efficacité enseignante faites en moins de 30 secondes corrèlent à 0,88 avec les évaluations faites après un semestre complet. La règle des 3 secondes va plus loin : les recherches de Janine Willis et Tania Harris (1995) ont montré qu'en seulement 100 millisecondes, les gens forment des impressions de confiance, compétence et chaleur à partir du visage d'une personne, et ces impressions rapides prédisent les comportements ultérieurs. Les 3 premières secondes d'une interaction combinent trois canaux : le langage corporel (55% du message), le ton de la voix (38%), et les mots (7%) — selon la célèbre formule de Albert Mehrabian. Le langage corporel ouvert (posture droite, mains visibles, contact visuel) est perçu comme signe de confiance et de compétence. Le ton de voix (vitesse, volume, modulation) influence la perception de l'autorité et de l'empathie. La recherche montre que les personnes qui prennent 3 secondes pour se préparer avant une interaction importante sont perçues comme 40% plus compétentes et confiantes.",
    takeaway: "Avant chaque interaction importante (entretien, présentation, premier rendez-vous), prenez 3 secondes pour : respirer profondément (calme votre système nerveux), adopter une posture ouverte (épaules reculées, mains visibles), et établir un contact visuel chaleureux. Ces 3 secondes de préparation changent radicalement la dynamique de toute l'interaction.",
    sourceTitle: "Communication non violente",
    topicNames: ['Communication']
  },
  {
    title: "L'écoute active",
    content: "L'écoute active est bien plus qu'une technique de communication : c'est une manière fondamentale de se connecter à autrui et de comprendre le monde. Contrairement à l'écoute passive (entendre les mots), l'écoute active implique un engagement cognitif et émotionnel complet. Carl Rogers, pionnier de la thérapie humaniste, a identifié l'écoute active comme la compétence fondamentale de toute relation efficace, et des décennies de recherche ont confirmé que cette compétence est cruciale dans les relations personnelles, professionnelles et familiales. Les trois composantes sont : 1) L'attention totale : présence physique (contact visuel, posture ouverte) et mentale (pas de distraction, pas de préparation de la réponse). 2) La reformulation : répéter avec vos propres mots ce que vous avez compris, permettant à l'autre de vérifier ou corriger. 3) La validation émotionnelle : reconnaître l'émotion sous-jacente. L'écoute active active le système de sécurité de l'interlocuteur, créant un sentiment de confiance. Des études en entreprise montrent que les managers qui pratiquent l'écoute active ont des équipes 40% plus engagées.",
    takeaway: "Dans chaque conversation, pratiquez la règle des 3 temps : écoutez sans interrompre (100%), reformulez ce que vous avez compris, puis posez une question d'approfondissement. Si vous avez tort dans votre reformulation, vous apprendras. Si vous avez raison, vous aurez créé un lien profond.",
    sourceTitle: "Communication non violente",
    topicNames: ['Communication']
  },
  {
    title: "La loi de Pareto (80/20)",
    content: "80% des résultats viennent de 20% des efforts. Dans la plupart des domaines, une minorité d'actions crée la majorité de la valeur. Identifier et聚焦er sur ce 20% est la clé de l'efficacité.",
    takeaway: "Listez toutes vos tâches. Identifiez les 20% qui créent 80% de votre impact. Délégez, automatisez ou éliminez le reste.",
    sourceTitle: "Loi de Pareto",
    topicNames: ['Productivité']
  },
  {
    title: "Le Deep Work",
    content: "Le Deep Work, concept popularisé par Cal Newport dans son livre homonyme (2016), désigne la capacité de se concentrer intensément sur une tâche cognitivement exigeante sans distraction. Newport distingue le Deep Work (travail profond, non-fragmenté, à haute valeur cognitive) du Shallow Work (travail superficiel, fragmenté, sans impact significatif). Dans l'économie de la connaissance, le Deep Work devient de plus en plus rare mais aussi de plus en plus précieux. Les études montrent qu'il faut en moyenne 23 minutes pour revenir à pleine concentration après une interruption. Un professionnel moyen consulte sa messagerie toutes les 6 minutes. Les personnes capables de Deep Work de 4 heures par jour produisent plus que la majorité des professionnels en 8 heures de travail fragmenté. Darwin écrivait 3-5 heures le matin, Tolstoï avait des horaires stricts de production littéraire. Le Deep Work n'est pas un luxe : c'est un avantage compétitif dans un monde de distractions constantes.",
    takeaway: "Bloquez 2 heures chaque matin pour votre travail le plus important. Téléphone éteint, notifications désactivées. C'est là que se joue votre avantage concurrentiel.",
    sourceTitle: "Deep Work",
    topicNames: ['Productivité']
  },
  {
    title: "La règle des 2 minutes",
    content: "La règle des 2 minutes, popularisée par David Allen dans Getting Things Done, est l'une des stratégies les plus simples mais les plus efficaces de gestion de la productivité. Le principe : si une tâche prend moins de 2 minutes, faites-la immédiatement au lieu de la noter et traiter plus tard. La justification est mathématiquement solide : le temps passé à noter, organiser, rappeler et reprendre une petite tâche dépasse souvent le temps nécessaire pour la faire directement. Répondre à un email de 2 lignes prend 30 secondes si on le fait tout de suite, mais 5 minutes si on le note, le range, le retrouve, et y revient plus tard. Cumulé sur des dizaines de petites tâches par jour, le gain est considérable. La règle s'applique aussi aux décisions : si une décision peut être prise en moins de 2 minutes, prenez-la maintenant.",
    takeaway: "Appliquez cette règle à votre boîte mail, votre liste de courses, vos messages. Les petites actions immédiates libèrent l'esprit pour les grandes.",
    sourceTitle: "Loi de Pareto",
    topicNames: ['Productivité']
  },
  {
    title: "L'art de dire non",
    content: "L'art de dire non est fondamentalement l'art de dire oui à ce qui compte vraiment. Chaque oui que vous donnez est un non implicite à quelque chose d'autre : dire oui à cette réunion signifie non à 45 minutes de travail concentré ; dire oui à ce projet secondaire signifie non à l'excellence sur votre projet principal. Cal Newport illustre avec le concept de la culture de l'oui : les professionnels modernes disent oui à tout par politesse, diluant ainsi leur énergie. Une étude de Harvard a montré que la capacité de dire non de manière ferme mais polie est corrélée à 37% de plus de satisfaction professionnelle. Warren Buffett recommande à ses assistants de dire non à presque tout, pour ne garder que ce qui est vraiment important. Le non n'est pas un rejet : c'est un choix conscient de ce qui mérite votre ressource la plus précieuse — votre attention.",
    takeaway: "Avant de dire oui à une demande, demandez-vous : est-ce que cela m'approche de mes objectifs principaux ou m'en éloigne ?",
    sourceTitle: "Deep Work",
    topicNames: ['Productivité']
  },
  {
    title: "La technique Pomodoro",
    content: "La technique Pomodoro, développée par Francesco Cirillo dans les années 1980, est une méthode de gestion du temps basée sur des intervals de travail concentré entrecoupés de pauses courtes. Le nom vient du pomodoro (tomate en italien), l'outil en forme de tomate que Cirillo utilisait comme minuteur. La méthode : 25 minutes de travail concentré, suivies d'une pause de 5 minutes. Après 4 pomodoros, pause plus longue de 15-30 minutes. Les principes : la limitation du temps crée un sentiment d'urgence qui combat la procrastination ; les pauses régulières maintiennent la fraîcheur mentale ; le compteur visuel fournit un feedback concret. Des études en neurosciences montrent que notre attention soutenue naturelle est d'environ 20-30 minutes avant de nécessiter une pause. Travailler par blocs concentrés avec des pauses régulières, c'est travailler comme notre cerveau fonctionne optimalement.",
    takeaway: "Même si vous n'utilisez pas le timer, le principe est valable : travaillez par blocs concentrés avec des pauses régulières. C'est ainsi que fonctionne notre attention.",
    sourceTitle: "Deep Work",
    topicNames: ['Productivité']
  },
  {
    title: "La pensée latérale",
    content: "Edward de Bono a montré que la créativité vient souvent de changer de perspective plutôt que d'intensifier l'effort dans la même direction. Résoudre un problème par le côté plutôt que de front.",
    takeaway: "Quand vous êtes bloqué, changez radicalement de perspective. Imaginez que vous êtes un enfant, un expert d'un autre domaine, ou que les règles sont inversées. La créativité vient souvent de la connexion entre deux domaines a priori non reliés.",
    sourceTitle: "Créativité",
    topicNames: ['Créativité']
  },
  {
    title: "Le principe de combinaison",
    content: "La plupart des innovations ne sont pas des inventions ex nihilo mais des combinaisons nouvelles d'éléments existants. Steve Jobs a combiné calligraphie et technologie pour créer les polices Mac.",
    takeaway: "Connectez des concepts de domaines différents. Lisez dans des domaines qui ne sont pas les vôtres. La créativité est souvent un processus de recombinaison. Posez-vous : quel concept que j'ai appris hier puis-je appliquer à mon problème d'aujourd'hui ?",
    sourceTitle: "Créativité",
    topicNames: ['Créativité']
  },
  {
    title: "La contrainte créative",
    content: "Paradoxalement, les contraintes stimulent la créativité. Un cadre limité force le cerveau à trouver des solutions innovantes qu'il n'aurait pas explorées en situation de liberté totale.",
    takeaway: "Au lieu de chercher plus d'options, imposez-vous des contraintes artificielles. Comment résoudre ce problème avec seulement 3 outils ? Les contraintes ne limitent pas la créativité : elles la canalisent.",
    sourceTitle: "Créativité",
    topicNames: ['Créativité']
  },
  {
    title: "Le pouvoir du brouillon",
    content: "Anne Lamott appelle cela le 'brouillon pourri'. Accepter que la première version sera imparfaite libère la créativité. Le perfectionnisme est l'ennemi de la création.",
    takeaway: "Écrivez d'abord mal, ensuite améliorez. La première version a pour seul but d'exister. Ne corrigez pas en écrivant. Votre premier jet n'a pas à être bon : il a juste à être fait.",
    sourceTitle: "Créativité",
    topicNames: ['Créativité']
  },
  {
    title: "Les leçons de l'histoire romaine",
    content: "L'Empire romain s'est effondré par des problèmes internes : inflation (le denier a perdu 90% de sa valeur en 200 ans), corruption systémique, inégalités croissantes (1% possédait 16% des terres), et perte de cohésion sociale. Edward Gibbon identifie trois causes majeures : militarisation du pouvoir, expansion au-dela des capacités logistiques, perte des vertus civiques. Les civilisations meurent souvent de l'intérieur. Les sociétés qui survivent sont celles qui s'adaptent avant la crise, pas après.",
    takeaway: "Surveillez les signes de déclin : complaisance, corruption, inflexibilité. Les sociétés qui survivent s'adaptent AVANT la crise. Dans vos projets, posez-vous : sommes-nous en train de répéter les patterns qui ont causé des effondrements similaires ?",
    sourceTitle: "Histoire",
    topicNames: ["Histoire"]  },
  {
    title: "Le cycle des révolutions",
    content: "Les révolutions suivent un pattern : espoir initial, radicalisation, nouvel ordre autoritaire. La Révolution française a commencé avec la Déclaration des droits et s'est terminée avec la terreur. La Révolution russe a commencé avec l'espoir et s'est terminée avec Staline. Les révolutionnaires unissent autour d'un ennemi commun, puis se divisent. Les factions radicales prennent le pouvoir en promettant de purifier la révolution. Comprendre ce cycle aide à anticiper les dérives.",
    takeaway: "Restez vigilant contre la radicalisation. Les extrêmes, même bien intentionnés, détruisent ce qu'ils voulaient protéger. Préservez les principes fondamentaux tout en permettant l'évolution. La modération est de la sagesse, pas de la faiblesse.",
    sourceTitle: "Histoire",
    topicNames: ["Histoire"]  },
  {
    title: "L'importance de la préparation",
    content: "Napoléon disait : la chance favorise les esprits préparés. Les études sur les successes surprises montrent que ce qui semble être de la chance est souvent le résultat de préparation invisible. Les personnes chanceuses statistiques font 3x plus de choses nouvelles, 4x plus de conversations avec des inconnus. La préparation crée les conditions où la chance peut frapper.",
    takeaway: "Investissez dans votre préparation continue. La chance n'est pas aléatoire : c'est la convergence de la préparation et de l'opportunité. Plus vous êtes préparé, plus vous tombez sur la chance.",
    sourceTitle: "Histoire",
    topicNames: ["Histoire"]  },
  {
    title: "La sécurité passive vs active",
    content: "La sécurité active prévient l'accident (ABS, contrôle de stabilité, freinage d'urgence, alerte de franchissement de ligne). La sécurité passive protège pendant l'accident (ceintures, airbags, structure déformable, appui-tête). Les deux sont essentielles et complémentaires. Les statistiques montrent que l'ABS réduit les accidents de 30%, l'ESC de 50%, et les airbags de 35%. Une voiture moderne contient plus de 100 capteurs et 100 millions de lignes de code. La technologie évolue rapidement : la conduite autonome de niveau 3 (conditionnelle) est déjà disponible, et le niveau 4 (haute autonomie) sera commercialisé d'ici 2027.",
    takeaway: "Achetez une voiture avec au moins 6 airbags, ESC, et un score Euro NCAP de 5 étoiles. La technologie sauve des vies avant même que l'erreur humaine ne se produise. Priorisez la sécurité active : mieux vaut prévenir que guérir.",
    sourceTitle: "Sécurité automobile",
    topicNames: ['Voitures']
  },
  {
    title: "L'impact caché de l'industrie automobile",
    content: "Une voiture moyenne contient 30000 pièces, 50kg de plastiques, et nécessite l'extraction de 1,5 tonne de minerais pour sa batterie électrique. L'empreinte carbone de fabrication d'un EV représente 30-40% de plus qu'un thermique. Mais sur le cycle de vie complet (15 ans), l'EV émet 50-70% moins de CO2. La production de batteries pose des défis : lithium, cobalt, nickel. 60% du cobalt vient du Congo, souvent dans des conditions de travail précaires. Le recyclage des batteries est en développement : 95% des matériaux peuvent être récupérés.",
    takeaway: "La voiture électrique n'est propre qu'après 2-3 ans d'utilisation. Penser cycle de vie complet : moins de km, covoiturage, et transports en commun restent les choix les plus durables.",
    sourceTitle: "Industrie automobile",
    topicNames: ['Voitures']
  },
  {
    title: "Pourquoi les Japonais dominent l'automobile",
    content: "Toyota vend plus de voitures que les 5 constructeurs européens combinés. Le secret ? Le Kaizen : amélioration continue, zéro défaut, et une culture où chaque ouvrier peut arrêter la chaîne. La qualité japonaise n'est pas un accident, c'est un système. Les Japonais ont développé le Toyota Production System dans les années 1950, qui a révolutionné la production mondiale. Le juste-à-temps, le jidoka (automatisation intelligente), et l'respect des personnes sont les trois piliers.",
    takeaway: "L'excellence vient de petits efforts quotidiens répétés, pas de révolutions. Améliorez 1% chaque jour : dans 3 ans, vous serez 30x meilleur. Le Kaizen s'applique à tout : travail, sport, relations.",
    sourceTitle: "Toyota",
    topicNames: ['Voitures']
  },
  {
    title: "La révolution Tesla et l'ouverture des brevets",
    content: "En 2014, Elon Musk annonce que Tesla ouvre tous ses brevets. Ironiquement, cela n'a pas tué Tesla mais a accéléré toute l'industrie vers l'électrique. En créant le marché, Tesla l'a dominé. Ouvrir ses brevets est une stratégie de leadership, pas de générosité. Tesla a gagné plus en créant un écosystème favorable qu'en protégeant ses brevets. En 2024, Tesla vaut plus que les 13 plus grands constructeurs combinés. L'ouverture des brevets a envoyé un signal clair : l'électrique est l'avenir, et Tesla veut être le standard.",
    takeaway: "Le vrai leader ne protège pas ses avantages : il change les règles du jeu pour que tout le monde joue selon ses standards. Pensez large : parfois, partager est plus puissant que protéger.",
    sourceTitle: "Tesla, Inc.",
    topicNames: ['Voitures']
  },
  {
    title: "Le coût réel d'une voiture",
    content: "Acheter une voiture représente 15-20% du prix total sur 10 ans. Les 80% restants : assurance, carburant, entretien, parking, taxes, amortissement. Une Toyota coûtant 10000€ de moins qu'une BMW peut coûter 30000€ de plus sur sa durée de vie. L'amortissement est le plus grand coût caché : une voiture perd 30% de sa valeur la première année, 50% en 3 ans. Les voitures électriques amortissent moins vite mais leur valeur résiduelle est encore incertaine. La clé : acheter occasion (3 ans) pour éviter le plus fort amortissement.",
    takeaway: "Le prix d'achat est le moindre des coûts. Calculez le coût total de possession avant d'acheter. Souvent, la voiture la moins chère à l'achat est la plus chère à posséder. Achetez occasion pour maximiser votre investissement.",
    sourceTitle: "Automobile",
    topicNames: ['Voitures']
  },
  {
    title: "L'ingénierie de crash et les leçons de mort",
    content: "Henry Ford a dit que la voiture du futur coûterait si peu que quiconque pourrait conduire. Il mourut dans un accident de voiture. Chaque norme de sécurité moderne (ceinture, airbag, zone de déformation) est née d'une tragédie. Les crash tests ont évolué : du simple impact frontal (1958) aux tests latéraux, arrière, et piétons. La Volvo a inventé la ceinture de sécurité en 1959 et a rendu le brevet libre pour sauver des vies. Aujourd'hui, les voitures avec 5 étoiles Euro NCAP ont 80% moins de risques de mort en accident.",
    takeaway: "Les meilleures protections viennent des pires erreurs. Ne cachez pas les échecs : documentez-les, apprenez-en, et protégez les autres. La sécurité est un investissement, pas un coût.",
    sourceTitle: "Sécurité automobile",
    topicNames: ['Voitures']
  },
  {
    title: "Le design italien : forme vs fonction",
    content: "Pininfarina, Bertone, Ghia : les carrossiers italiens ont défini l'élégance automobile depuis les années 1930. Ferrari, Lamborghini, Alfa Romeo : l'Italie a fait de la voiture un art. Mais la forme sans fonction est dangereuse : le design italien a aussi produit des voitures peu fiables. La tension entre esthétique et ingénierie est un débat permanent : les Italiens privilégient la forme, les Allemands la fonction. Les voitures les plus iconiques (Ferrari 250 GTO, Alfa Romeo Giulia) réussissent l'équilibre parfait.",
    takeaway: "L'équilibre entre esthétique et fonctionnalité est essentiel. Une belle voiture qui ne fonctionne pas est un objet de musée, pas un produit. Dans le design, la forme suit la fonction, mais la fonction peut être belle.",
    sourceTitle: "Carrosserie automobile",
    topicNames: ['Voitures']
  },
  {
    title: "La course au kilomètre : autonomie des électriques",
    content: "En 2010, une Nissan Leaf faisait 100km. En 2024, une Tesla Model S fait 600km. Mais le test WLTP est optimiste : par froid hivernal, l'autonomie chute de 30-40%. La course aux chiffres est réelle, mais la réalité terrain diffère. Les batteries nouvelle génération (solid-state) promettent 1000km d'autonomie pour 2027-2030. La recharge rapide (10-80% en 15 min) se généralise. L'infrastructure s'améliore : 1 borne pour 40 EV en Europe en 2024, contre 1 pour 200 en 2019.",
    takeaway: "Méfiez-vous des specs marketing. Testez toujours en conditions réelles : froid, autoroute, climatisation. L'autonomie réelle est ce qui compte, pas le chiffre sur le site. Prévoyez toujours 20% de marge.",
    sourceTitle: "Batterie rechargeable",
    topicNames: ['Voitures']
  },
  {
    title: "La règle des 50/30/20",
    content: "50% de vos revenus pour les besoins (logement, nourriture, transports), 30% pour les envies (loisirs, restaurants), 20% pour l'épargne et le remboursement de dettes. Cette règle simple structure les finances personnelles sans micro-gestion. Elle est flexible : dans les villes chères, vous pouvez adapter à 60/25/15. L'essentiel est la proportion d'épargne : 20% est le minimum recommandé pour atteindre l'indépendance financière. Les personnes qui automatisent leurs virements vers l'épargne épargnent en moyenne 50% de plus que celles qui épargnent ce qui reste à la fin du mois.",
    takeaway: "Automatisez vos virements le jour de la paie : vers épargne, vers investissement. Ce que vous ne voyez pas, vous ne le dépensez pas. Commencez par 10% d'épargne, puis augmentez de 1% par an jusqu'à 20%.",
    sourceTitle: "Budget personnel",
    topicNames: ['Finance & Argent']
  },
  {
    title: "Le piège du crédit revolving",
    content: "Un crédit revolving à 18% d'intérêt signifie que rembourser le minimum chaque mois peut prendre 20 ans pour payer un achat de 1000€. Au final, vous paierez plus de 2000€. C'est le piège financier le plus courant. La mécanique est implacable : les intérêts sont calculés sur le solde quotidien, pas mensuel. Plus vous tardez à rembourser, plus les intérêts s'accumulent. Un achat de 3000€ en revolving à 18% avec un minimum de 5% par mois coûtera 4800€ au total, soit 1800€ d'intérêts. La solution : payez toujours le montant total, pas le minimum.",
    takeaway: "N'utilisez un crédit revolving que si vous pouvez rembourser intégralement chaque mois. Sinon, c'est un piège mathématique garanti. Privilégiez la carte de crédit avec 45 jours de grâce sans intérêts.",
    sourceTitle: "Crédit à la consommation",
    topicNames: ['Finance & Argent']
  },
  {
    title: "La diversification : ne pas mettre tous ses oeufs dans le même panier",
    content: "Markowitz a montré qu'un portefeuille diversifié offre un meilleur rendement pour un risque donné. Actions, obligations, immobilier, or : chaque classe d'acteurs réagit différemment aux crises. La diversification est le seul diner gratuit de la finance (Harry Markowitz, Nobel 1990). Un portefeuille 60% actions / 40% obligations a historiquement offert un rendement similaire aux actions seules avec 40% moins de volatilité. Les ETF mondiaux (MSCI World, FTSE All-World) offrent une diversification instantanée sur 1500-4000 entreprises.",
    takeaway: "Investissez dans des index mondiaux (MSCI World) plutôt que de choisir des actions individuelles. Vous réduisez le risque sans sacrifier le rendement. La diversification protège contre l'ignorance : personne ne sait quelle action surperformera.",
    sourceTitle: "Théorie moderne du portefeuille",
    topicNames: ['Finance & Argent']
  },
  {
    title: "L'inflation : le voleur silencieux",
    content: "À 2% d'inflation annuelle, votre pouvoir d'achat est divisé par 2 en 35 ans. 1000€ aujourd'hui vaudront 500€ dans 35 ans. L'inflation détruit les épargnants passifs et récompense les investisseurs. L'histoire montre que l'inflation moyenne sur 200 ans est de 2-3% par an. Les périodes de haute inflation (70s, 2021-2023) sont des exceptions. Mais même 2% d'inflation annuelle réduit de 33% le pouvoir d'achat sur 30 ans. Les actifs réels (immobilier, actions, or) protègent de l'inflation sur le long terme.",
    takeaway: "Ne gardez pas plus de 6 mois de dépenses sur un compte courant. Le reste doit être investi pour battre l'inflation. Un compte épargne à 2% avec 2% d'inflation = 0% de gain réel. Investissez.",
    sourceTitle: "Inflation",
    topicNames: ['Finance & Argent']
  },
  {
    title: "Le FOMO financier : quand l'émotion décide",
    content: "Les bulles spéculatives (dot-com, subprimes, crypto) se nourrissent toutes du même mécanisme : les gens achètent parce que les autres achètent, pas parce que l'actif a de la valeur. Le FOMO (Fear Of Missing Out) est l'ennemi numéro 1 de l'investisseur. Les études montrent que les investisseurs qui achètent pendant l'euphorie et vendent dans la panique sous-performent le marché de 5-7% par an. La psychologie de foule suit un pattern prévisible : émergence, adoption massive, euphorie, distribution par les initiés, crash. Comprendre ce pattern aide à rester rationnel.",
    takeaway: "Si vous ne comprenez pas ce que vous achetez, vous êtes le produit, pas l'investisseur. Restez dans ce que vous comprenez. Quand tout le monde parle de votre investissement favori, c'est souvent le moment de vendre, pas d'acheter.",
    sourceTitle: "Euphorie spéculative",
    topicNames: ['Finance & Argent']
  },
  {
    title: "Les frais cachés qui ruinent les portefeuilles",
    content: "Un fonds avec 1,5% de frais de gestion au lieu de 0,3% coûte 120000€ sur 30 ans d'investissement de 300€/mois. Les frais semblent petits mais l'intérêt composé travaille aussi à l'envers. Un ETF à 0,1% de frais vs un fonds actif à 1,5% peut faire une différence de 200000€ sur 30 ans. Les frais cachés incluent : frais d'entrée (2-5%), frais de sortie (1-3%), frais de garde (0,1-0,5%), et performance fees (20% des gains). Les frais sont l'un des rares facteurs prédictifs de performance future : les fonds à bas frais surperforment statistiquement.",
    takeaway: "Chaque 1% de frais en plus = environ 20% de moins à la retraite. Choisissez des ETF à frais minimaux et évitez les fonds actifs. Les frais sont le seul facteur certain de sous-performance.",
    sourceTitle: "Frais de gestion",
    topicNames: ['Finance & Argent']
  },
  {
    title: "L'urgence financière : votre premier investissement",
    content: "Avant d'investir, construisez une épargne de précaution de 3 à 6 mois de dépenses. Cette réserve évite de vendre vos investments lors d'une crise pour payer les factures. C'est le fondation de toute stratégie financière. Les études montrent que les personnes avec une épargne de précaution sont 3x moins stressées financièrement et prennent de meilleures décisions d'investissement. L'épargne de précaution doit être accessible (livret A, LDD, compte courant rémunéré) et séparée de votre portefeuille d'investissement.",
    takeaway: "Sans épargne de précaution, chaque imprévu vous force à vendre vos investments au pire moment. Construisez votre bouclier d'abord : 3-6 mois de dépenses sur un compte accessible. Ensuite, investissez le reste.",
    sourceTitle: "Épargne de précaution",
    topicNames: ['Finance & Argent']
  },
  {
    title: "L'effet de levier : ami ou ennemi",
    content: "Emprunter pour investir amplifie les gains ET les pertes. Un achat immobilier avec 20% d'apport et 80% de crédit multiplie le rendement par 5... mais aussi les pertes. L'effet de levier est un couteau à double tranchant. En 2008, les propriétaires avec 90% de levier ont été liquidés alors que ceux avec 50% ont survécu. Le levier fonctionne bien en marché haussier, catastrophique en marché baissier. La règle : ne jamais emprunter plus que ce que vous pouvez rembourser même dans un scénario pessimiste.",
    takeaway: "N'empruntez jamais pour investir si vous ne pouvez pas absorber une perte de 50%. L'effet de levier tue les investisseurs imprudents. Le levier idéal : celui qui vous permet de dormir la nuit.",
    sourceTitle: "Effet de levier",
    topicNames: ['Finance & Argent']
  },
  {
    title: "Le dollar-cost averaging : investir sans stress",
    content: "Investir un montant fixe régulièrement (ex: 200€/mois), peu importe le marché, lisse le prix d'achat moyen. En bourse, c'est la stratégie la plus efficace pour les investisseurs particuliers : elle élimine le timing et l'émotion. Le DCA bat le lump-sum investing dans 60% des cas sur les périodes de 10 ans, car il évite d'investir tout son capital juste avant un crash. Les investisseurs qui restent investis pendant 20 ans obtiennent en moyenne 8-10% de rendement annuel, quel que soit leur prix d'entrée. La régularité bat l'intelligence.",
    takeaway: "Planifiez vos investissements mensuels et exécutez-les automatiquement. Ne regardez pas les cours. La régularité bat l'intelligence. Investissez quand ça monte ET quand ça descend. La constance est votre superpouvoir.",
    sourceTitle: "Dollar-cost averaging",
    topicNames: ['Finance & Argent']
  },
  {
    title: "La loi de Moore : une course sans ligne d'arrivée",
    content: "Gordon Moore a prédit en 1965 que le nombre de transistors doublerait tous les 18 mois. Cette prédiction s'est réalisée pendant 50 ans. Aujourd'hui, les limites physiques approchent : on ne peut plus graver des transistors plus petits que l'atome. Les transistors 3nm existants font 10 atomes de large. Les solutions : transistors nanosheet (2025), gate-all-around (2027), et au-dela, les semi-conducteurs 2D (graphène, disulfure de molybdène). La loi de Moore ne mourra pas : elle se transformera. L'emballage avancé (chiplets, 3D stacking) devient le nouveau moteur de l'amélioration.",
    takeaway: "Les technologies exponentielles semblent infinies jusqu'à ce qu'elles touchent une limite physique. Anticipez les plateaux avant qu'ils n'arrivent. La prochaine révolution viendra d'une nouvelle architecture, pas d'une miniaturisation.",
    sourceTitle: "Loi de Moore",
    topicNames: ['Technologie & Innovation']
  },
  {
    title: "L'effet réseau : plus c'est grand, plus c'est utile",
    content: "Un téléphone ne vaut rien. Deux téléphones = un réseau. Un milliard de téléphones = une infrastructure mondiale. Les plateformes avec effet réseau (Facebook, WhatsApp, TCP/IP) deviennent naturellement monopolistiques. Plus il y a d'utilisateurs, plus le service vaut. Metcalfe a montré que la valeur d'un réseau est proportionnelle au carré du nombre d'utilisateurs (n^2). Les effets réseau créent desWinner-take-all markets : le leader capture 80%+ de la valeur. Mais l'effet réseau n'est pas suffisant : il faut aussi un produit de qualité et un modèle économique viable.",
    takeaway: "Quand vous évaluez une technologie, demandez : est-ce que sa valeur augmente avec le nombre d'utilisateurs ? Si oui, le leader gagnera tout. Investissez dans les plateformes avec effet réseau fort.",
    sourceTitle: "Effet de réseau",
    topicNames: ['Technologie & Innovation']
  },
  {
    title: "Le paradoxe de Jevons : l'efficacité crée la surconsommation",
    content: "En 1865, l'économiste William Jevons a observé que rendre le charbon plus efficace augmentait sa consommation, pas la réduisait. Chaque progrès d'efficacité crée plus de demande. Les smartphones sont plus économes que les PC, mais nous en consommons 10x plus. L'efficacité seule ne suffit pas pour réduire la consommation. Il faut aussi limiter la demande. Les politiques environnementales efficaces combinent efficacité ET régulation de la consommation (quota, taxe carbone).",
    takeaway: "L'efficacité seule ne suffit pas pour réduire la consommation. Il faut aussi limiter la demande. La technologie sans régulation amplifie le problème. Consommez moins, pas mieux.",
    sourceTitle: "Paradoxe de Jevons",
    topicNames: ['Technologie & Innovation']
  },
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
  {
    title: "L'entropie : pourquoi tout se dégrade",
    content: "La deuxième loi de la thermodynamique dit que l'entropie (désordre) augmente toujours. Votre chambre se désorganise toute seule, mais s'organiser demande un effort. L'univers tend vers le désordre : la vie est une lutte contre l'entropie.",
    takeaway: "Maintenir l'ordre demande un effort constant. N'attendez pas que les choses s'améliorent toute seule : l'entropie travaille contre vous en permanence.",
    sourceTitle: "Entropie",
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
  {
    title: "La réaction de Maillard : la science du gout",
    content: "Quand vous cuisinez à haute température (au-dessus de 140°C), les acides aminés et les sucres réagissent pour créer des centaines de nouvelles molécules de saveur. C'est la réaction de Maillard : elle donne sa saveur au pain grillé, à la viande rôtie et au café torréfié. La réaction produit plus de 600 composés aromatiques différents selon les ingrédients et la température. Le pain doré, la croûte du steak, la peau croustillante du poulet : tout est Maillard. Pour maximiser la réaction : séchez bien vos aliments, utilisez une température élevée (160-180°C), et donnez du temps (3-5 minutes par côté). L'humidité empêche la réaction : une viande bouillie ne développera jamais de croûte savoureuse.",
    takeaway: "Saisissez bien votre viande avant de la mettre dans la poêle. L'humidité empêche la réaction de Maillard : une viande bouillie au lieu de grillée. Séchez, chauffez, patientez. La croûte dorée est la plus savoureuse.",
    sourceTitle: "Réaction de Maillard",
    topicNames: ['Cuisine & Alimentation']
  },
  {
    title: "L'umami : le cinquieme gout",
    content: "Le glutamate, découvert par Kikunae Ikeda en 1908, est le cinquième gout de base (avec sucre, sale, acide, amer). L'umami donne de la profondeur et de la rondeur. Tomates mures, parmesan, champignons, sauce soja : ce sont des bombes d'umami naturelles. L'umati est détecté par des recepteurs spécifiques sur la langue (T1R1+T1R3). Les aliments riches en glutamate libre, nucleotides (IMP, GMP) et aminoacides (alanine, glycine) sont les plus umami. L'umami potentialise les autres gouts : un peu de parmesan dans une sauce tomate intensifie le gout sucré et réduit le besoin de sel de 30%.",
    takeaway: "Ajoutez un peu d'umami à vos plats pour les transformer sans sel. Un peu de parmesan râpé ou de sauce soja peut remplacer le sel et enrichir le gout. L'umami est le secret des chefs : profondeur sans salinite.",
    sourceTitle: "Umami",
    topicNames: ['Cuisine & Alimentation']
  },
  {
    title: "La fermentation : conserver pour mieux nourrir",
    content: "La fermentation transforme les sucres en acide lactique ou en alcool grâce aux bacteries et levures. Choucroute, kombucha, kimchi, yaourt : ces aliments fermentes sont plus digestes, plus nutritifs et pleins de probiotiques naturels. La fermentation a sauve des civilisations entieres de la famine. Les bacteries lactiques produisent des vitamines (B12, K2), degradent les anti-nutriments, et creent des composés antimicrobiens naturels. Un legume fermente en 3 jours a temperature ambiante dans une solution saline a 2%. Les benefices pour la sante sont enormes : amelioration de la digestion, renforcement de l'immunité, reduction de l'inflammation.",
    takeaway: "Fermenter ses legumes est la technique la plus simple et la plus puissante : eau salee, legumes, 3 jours a temperature ambiante. Resultat : des probiotiques gratuits et des legumes qui durent des mois. La fermentation est de la magie culinaire.",
    sourceTitle: "Fermentation",
    topicNames: ['Cuisine & Alimentation']
  },
  {
    title: "L'equilibre sucre-acide-gas-sale",
    content: "Les meilleurs plats equilibrent quatre saveurs : sucre, acide, sale, gras. Une vinaigrette parfaite = huile (gras) + vinaigre (acide) + sel (sale) + miel (sucre). Quand un plat manque quelque chose, ajoutez une goutte d'acide avant de rajouter du sel. L'acide reveille les saveurs plus efficacement que le sel. Les chefs étoilés utilisent systématiquement l'equilibre des quatre saveurs : chaque plat est ajusté pour avoir un peu de chaque. Le sucre adoucit, l'acide reveille, le sel intensifie, le gras arrondit. Maîtriser cet équilibre, c'est maîtriser la cuisine.",
    takeaway: "Si votre plat semble plat, ajoutez de l'acidite (citron, vinaigre) avant le sel. L'acide reveille les saveurs plus efficacement que le sel. Equilibrez les quatre saveurs : sucre, acide, sale, gras. C'est la base de toute cuisine.",
    sourceTitle: "Équilibre des saveurs",
    topicNames: ['Cuisine & Alimentation']
  },
  {
    title: "La science du pain : gluten et fermentation",
    content: "Le gluten forme un reseau elastique quand on petrit la farine avec de l'eau. Les levures produisent du CO2 qui gonfle ce reseau. La cuisson fige la structure. Le pain parfait demande trois choses : bon gluten, bonne fermentation, bonne cuisson. Le petrisage developpe le gluten : 10 minutes a la main, 5 minutes au mixeur. La fermentation donne le gout et la texture : une fermentation longue (12-24h au refrigerateur) produit un pain plus savoureux et plus digeste. La cuisson a haute temperature (250°C) cree la croûte et le croustillant.",
    takeaway: "Petrissez assez pour developper le gluten (test de la membrane : etirez la pate finement sans qu'elle se dechire). Une fermentation longue au refrigerateur donne plus de gout. Cuisez a haute temperature pour une croûte parfaite.",
    sourceTitle: "Pain",
    topicNames: ['Cuisine & Alimentation']
  },
  {
    title: "Le jeûne intermittent : manger moins pour mieux vivre",
    content: "Jeûner 16 heures active l'autophagie : le corps recycle ses propres cellules endommagees. C'est un mecanisme evolutif de nettoyage cellulaire. Les societes humaines ont jeûne pendant des millenaires : notre corps est concu pour fonctionner sans nourriture periodiquement. Les benefices documentes : amelioration de la sensibilite a l'insuline (+30%), reduction de l'inflammation (-20%), augmentation de l'hormone de croissance (+2000%), amelioration de la fonction cerebrale (BDNf +40%). Les etudes montrent que le jeûne intermittent 16/8 est aussi efficace qu'un regime hypocalorique pour la perte de poids, avec moins de faim.",
    takeaway: "Commencez par sauter le petit-dejeuner un jour sur deux. Laissez votre corps apprendre a puiser dans ses reserves. L'autophagie commence apres ~14h de jeûne. Le jeûne 16/8 est simple, efficace, et durable. C'est un retour a notre biologie evolutionnaire.",
    sourceTitle: "Jeûne intermittent",
    topicNames: ['Cuisine & Alimentation']
  },
  {
    title: "Les epices : pharmacie de la cuisine",
    content: "Le curcuma contient de la curcumine (anti-inflammatoire), le gingembre de la gingérol (anti-nausée), le cumin améliore la digestion. Les épices ne sont pas juste du gout : ce sont des molecules bioactives avec des effets prouves sur la sante. Le curcuma reduit l'inflammation de 30% dans les etudes cliniques. Le cannelle regule la glycémie de 20%. L'ail abaisse la pression arterielle de 10mmHg. Les épices sont des médicaments naturels, utilises depuis des millénaires avant la médecine moderne. La cuisine traditionnelle utilise les épices précisément pour leurs propriétés thérapeutiques.",
    takeaway: "Gardez du curcuma, du gingembre et de l'ail sous la main. Ces trois épices couvrent les besoins anti-inflammatoire, digestif et antibactérien de base. Les épices sont des medicines naturelles, accessibles et efficaces.",
    sourceTitle: "Épice",
    topicNames: ['Cuisine & Alimentation']
  },
  {
    title: "La temperature compte plus que le temps",
    content: "Un steak cuit a 54°C pendant 1 heure est identique a un steak cuit a 70°C pendant 15 minutes : la temperature determine la cuisson, pas le temps. La cuisson sous-vide exploite ce principe : temperature precise, resultat reproductible. Les temperatures ideales : saignant 52-54°C, a point 57-60°C, bien cuit 65°C+. Le poulet doit atteindre 74°C en son centre pour etre sans risque. Le poisson gras (saumon) : 50-54°C pour une texture fondante. La temperature est la seule mesure objective de la cuisson. Le temps est secondaire.",
    takeaway: "Utilisez un thermometre de cuisine. Un poulet a 74°C est sur, un saumon a 50°C est parfait. La temperature exacte bat toute recette ecrite. La cuisson precise commence par la mesure precise. Investissez dans un thermometre.",
    sourceTitle: "Cuisine sous-vide",
    topicNames: ['Cuisine & Alimentation']
  },
  {
    title: "Le gaspillage alimentaire : un probleme de stockage",
    content: "40% des aliments se gaspillent dans les pays developpes, principalement a cause d'un mauvais stockage. Les legumes verts dans du papier absorbent durent 2x plus. Les herbes dans un verre d'eau comme des fleurs. La connaissance du stockage = moins de gaspillage. Les tomates hors du frigo gardent leur gout. Les pommes de terre a l'abri de la lumière ne germent pas. Les œufs dans leur carton d'origine durent 28 jours. Le bon stockage peut doubler la duree de vie de vos aliments sans frais supplémentaires.",
    takeaway: "Rangez vos aliments correctement : les tomates hors du frigo, les pommes de terre a l'abri de la lumière, les legumes-feuilles dans du papier. Le bon stockage reduit le gaspillage de 50%. Connaître son réfrigérateur, c'est économiser.",
    sourceTitle: "Gaspillage alimentaire",
    topicNames: ['Cuisine & Alimentation']
  },
  {
    title: "L'alchimie des saveurs : pourquoi ca marche",
    content: "La cuisine francaise classique associe creme et champignons, vin et boeuf, herbes et poisson. Mais la science montre que ces combinaisons partagent des molecules aromatiques communes. L'accord parfait terre-vin fonctionne car les raisins et les truffes partagent des composes similaires. Foodpairing, une base de donnees de 30000 ingredients, montre que les associations culinaires fonctionnent quand les ingredients partagent des molecules de saveur. L'aneth et le caviar fonctionnent car ils partagent la dimethylesulfure. La science remplace la tradition : vous pouvez innover avec confiance en utilisant les molecules comme guide.",
    takeaway: "Pour creer vos propres associations, cherchez les molecules partagees. La science remplace la tradition : vous pouvez innover avec confiance. Les associations surprenantes fonctionnent souvent mieux que les classiques. Experimentez avec les molecules.",
    sourceTitle: "Cuisine moléculaire",
    topicNames: ['Cuisine & Alimentation']
  },
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

console.log(`
✅ ${created} idées créées`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
