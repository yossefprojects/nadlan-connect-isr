import type { Language } from "@/lib/i18n";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDoc {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}

// NOTE (juin 2026) — Sections FR enrichies (outils IA / non-conseil, limitation
// de responsabilité, marché démolition / non-contournement, garanties du
// déposant, marques de tiers). Ce sont des BROUILLONS à FAIRE VALIDER par un
// avocat avant de s'y fier (voir LEGAL-DRAFTS.md à la racine du repo). Les
// versions EN/HE de ces nouvelles sections restent à confier à un traducteur
// juridique — ne pas traduire automatiquement du texte contraignant.
export const CGU: Record<Language, LegalDoc> = {
  fr: {
    title: "Conditions Générales d'Utilisation (CGU)",
    lastUpdated: "11 juin 2026",
    intro:
      "Les présentes Conditions Générales d'Utilisation régissent l'accès et l'usage de la plateforme NadlanConnect par l'ensemble des utilisateurs (acheteurs, agents immobiliers et promoteurs).",
    sections: [
      {
        heading: "Objet",
        paragraphs: [
          "NadlanConnect est une plateforme de mise en relation dédiée au marché immobilier israélien. Elle permet aux acheteurs de consulter des biens, d'obtenir des estimations indicatives et de contacter des professionnels, et aux professionnels de publier et de gérer leurs annonces.",
        ],
      },
      {
        heading: "Acceptation des conditions",
        paragraphs: [
          "L'utilisation de la plateforme implique l'acceptation pleine et entière des présentes CGU. Tout utilisateur qui n'accepte pas ces conditions doit s'abstenir d'utiliser le service.",
        ],
      },
      {
        heading: "Accès et services de la plateforme",
        paragraphs: [
          "Les estimations de prix et scores d'investissement fournis par la plateforme sont purement indicatifs et non contractuels. Ils ne constituent ni un conseil en investissement, ni une expertise immobilière, ni une garantie de valeur ou de rendement.",
        ],
      },
      {
        heading: "Rémunération de la plateforme",
        paragraphs: [
          "NadlanConnect perçoit une rémunération correspondant à 0,5 % du montant total de chaque transaction immobilière conclue par l'intermédiaire de la plateforme.",
          "Cette rémunération est répartie à parts égales entre les professionnels : 0,25 % à la charge du promoteur et 0,25 % à la charge de l'agence immobilière.",
          "L'acheteur ne supporte aucun frais au titre de cette rémunération. Les modalités détaillées figurent dans les Conditions Générales de Vente (CGV).",
        ],
      },
      {
        heading: "Obligations de l'utilisateur",
        paragraphs: [
          "L'utilisateur s'engage à fournir des informations exactes, à ne pas publier de contenu illicite ou trompeur, et à respecter les droits des tiers ainsi que la réglementation applicable en Israël.",
        ],
      },
      {
        heading: "Responsabilité",
        paragraphs: [
          "NadlanConnect agit en qualité d'intermédiaire technique et ne saurait être tenue responsable du contenu des annonces, de la conclusion ou de l'exécution des transactions entre utilisateurs.",
        ],
      },
      {
        heading: "Données personnelles",
        paragraphs: [
          "Les données collectées sont traitées dans le respect de la réglementation applicable et utilisées uniquement aux fins de fonctionnement du service et de mise en relation. L'utilisateur dispose d'un droit d'accès, de rectification et de suppression de ses données.",
        ],
      },
      {
        heading: "Outils d'analyse, d'estimation et d'intelligence artificielle",
        paragraphs: [
          "Les estimations, analyses automatisées (« Agent Shamai »), scores d'investissement et simulateurs proposés reposent en partie sur l'intelligence artificielle : l'utilisateur est informé qu'il interagit avec un système automatisé.",
          "Leurs résultats sont fournis à titre purement indicatif et non contractuel. Ils ne constituent ni un conseil en investissement, fiscal, juridique ou financier, ni une recommandation personnalisée, ni une expertise immobilière réglementée, et ne sauraient se substituer à l'avis d'un professionnel qualifié. NadlanConnect ne garantit pas leur exactitude ; l'utilisateur demeure seul responsable de ses décisions et doit vérifier toute information auprès des sources officielles et des professionnels compétents.",
        ],
      },
      {
        heading: "Limitation de responsabilité",
        paragraphs: [
          "La plateforme est fournie « en l'état » et « selon disponibilité ». NadlanConnect ne garantit ni la véracité des annonces, ni le comportement des utilisateurs, ni l'aboutissement des mises en relation et des transactions.",
          "Dans la limite permise par la loi, la responsabilité de NadlanConnect est plafonnée aux sommes effectivement versées par l'utilisateur au cours des douze (12) derniers mois et exclut les dommages indirects. Ces limitations ne réduisent pas les droits impératifs des consommateurs. NadlanConnect n'est pas responsable des événements de force majeure.",
        ],
      },
      {
        heading: "Marché démolition-reconstruction : confidentialité et non-contournement",
        paragraphs: [
          "Pour les biens éligibles à la démolition-reconstruction (Tama 38 / Pinui-Binui), l'adresse exacte et les coordonnées du propriétaire restent confidentielles : seuls le quartier et une localisation approximative sont rendus publics. L'adresse exacte n'est révélée au promoteur qu'après acceptation par le propriétaire et validation de la mise en relation par NadlanConnect, le promoteur s'engageant à n'utiliser ces informations que pour le projet concerné.",
          "Lorsqu'ils ont été mis en relation par la plateforme, le propriétaire et le promoteur s'interdisent de conclure l'opération hors plateforme afin d'éluder la commission de mise en relation. Tout contournement caractérisé rend la commission exigible, sans préjudice de dommages-intérêts. Après acceptation d'une offre, le bien est verrouillé et les autres offres sont automatiquement closes.",
        ],
      },
      {
        heading: "Garanties du déposant",
        paragraphs: [
          "En publiant un bien, le déposant déclare et garantit être propriétaire ou disposer d'un mandat ou pouvoir régulier pour le proposer (y compris, en copropriété pour un projet Pinui-Binui, l'autorisation requise), que les informations et documents fournis sont exacts, et qu'il dispose des droits nécessaires à leur affichage. Il garantit NadlanConnect contre toute réclamation de tiers en résultant. NadlanConnect peut refuser, modérer ou retirer toute annonce.",
        ],
      },
      {
        heading: "Marques et contenus de tiers",
        paragraphs: [
          "Les noms, dénominations et logos de tiers éventuellement cités ou affichés (notamment de promoteurs ou d'institutions) le sont à titre purement informatif et nominatif et n'impliquent aucun partenariat, affiliation, parrainage ou recommandation, sauf mention expresse contraire. Chaque marque demeure la propriété de son titulaire, qui peut demander le retrait de toute mention le concernant.",
        ],
      },
      {
        heading: "Modification des CGU",
        paragraphs: [
          "NadlanConnect se réserve le droit de modifier les présentes CGU à tout moment. La version applicable est celle en vigueur à la date de l'utilisation de la plateforme.",
        ],
      },
    ],
  },
  en: {
    title: "Terms of Use (ToU)",
    lastUpdated: "June 4, 2026",
    intro:
      "These Terms of Use govern access to and use of the NadlanConnect platform by all users (buyers, real estate agents and developers).",
    sections: [
      {
        heading: "Purpose",
        paragraphs: [
          "NadlanConnect is a matchmaking platform dedicated to the Israeli real estate market. It allows buyers to browse properties, obtain indicative estimates and contact professionals, and allows professionals to publish and manage their listings.",
        ],
      },
      {
        heading: "Acceptance of the terms",
        paragraphs: [
          "Using the platform implies full and unreserved acceptance of these Terms of Use. Any user who does not accept these terms must refrain from using the service.",
        ],
      },
      {
        heading: "Platform access and services",
        paragraphs: [
          "Price estimates and investment scores provided by the platform are purely indicative and non-binding. They constitute neither investment advice, nor a property appraisal, nor any guarantee of value or yield.",
        ],
      },
      {
        heading: "Platform remuneration",
        paragraphs: [
          "NadlanConnect receives remuneration equal to 0.5% of the total amount of every real estate transaction completed through the platform.",
          "This remuneration is split equally between the professionals: 0.25% borne by the developer and 0.25% borne by the real estate agency.",
          "The buyer bears no fees in respect of this remuneration. Detailed terms are set out in the General Terms of Sale (GTS).",
        ],
      },
      {
        heading: "User obligations",
        paragraphs: [
          "The user undertakes to provide accurate information, not to publish unlawful or misleading content, and to respect the rights of third parties as well as applicable regulations in Israel.",
        ],
      },
      {
        heading: "Liability",
        paragraphs: [
          "NadlanConnect acts as a technical intermediary and cannot be held liable for the content of listings or for the conclusion or performance of transactions between users.",
        ],
      },
      {
        heading: "Personal data",
        paragraphs: [
          "Collected data is processed in accordance with applicable regulations and used solely for the purpose of operating the service and connecting users. The user has the right to access, rectify and delete their data.",
        ],
      },
      {
        heading: "Amendments to the Terms",
        paragraphs: [
          "NadlanConnect reserves the right to amend these Terms of Use at any time. The applicable version is the one in force at the date the platform is used.",
        ],
      },
    ],
  },
  he: {
    title: "תנאי שימוש",
    lastUpdated: "4 ביוני 2026",
    intro:
      "תנאי שימוש אלה מסדירים את הגישה לפלטפורמת NadlanConnect ואת השימוש בה על ידי כלל המשתמשים (רוכשים, סוכני נדל\"ן ויזמים).",
    sections: [
      {
        heading: "מטרה",
        paragraphs: [
          "NadlanConnect היא פלטפורמת תיווך וחיבור המוקדשת לשוק הנדל\"ן הישראלי. היא מאפשרת לרוכשים לעיין בנכסים, לקבל הערכות אינדיקטיביות וליצור קשר עם אנשי מקצוע, ולאנשי מקצוע לפרסם ולנהל את המודעות שלהם.",
        ],
      },
      {
        heading: "קבלת התנאים",
        paragraphs: [
          "השימוש בפלטפורמה מהווה קבלה מלאה ובלתי מסויגת של תנאי שימוש אלה. משתמש שאינו מקבל תנאים אלה נדרש להימנע מהשימוש בשירות.",
        ],
      },
      {
        heading: "גישה ושירותי הפלטפורמה",
        paragraphs: [
          "הערכות המחיר וציוני ההשקעה הניתנים על ידי הפלטפורמה הם אינדיקטיביים בלבד ואינם מחייבים. הם אינם מהווים ייעוץ השקעות, שמאות מקרקעין או ערובה כלשהי לערך או לתשואה.",
        ],
      },
      {
        heading: "תמורה לפלטפורמה",
        paragraphs: [
          "NadlanConnect גובה תמורה בשיעור של 0.5% מהסכום הכולל של כל עסקת נדל\"ן הנכרתת באמצעות הפלטפורמה.",
          "תמורה זו מתחלקת באופן שווה בין אנשי המקצוע: 0.25% על היזם ו-0.25% על סוכנות הנדל\"ן.",
          "הרוכש אינו נושא בכל עלות בגין תמורה זו. הפירוט המלא מופיע בתנאי המכר.",
        ],
      },
      {
        heading: "חובות המשתמש",
        paragraphs: [
          "המשתמש מתחייב למסור מידע מדויק, לא לפרסם תוכן בלתי חוקי או מטעה, ולכבד את זכויות הצדדים השלישיים וכן את הדין החל בישראל.",
        ],
      },
      {
        heading: "אחריות",
        paragraphs: [
          "NadlanConnect פועלת כמתווך טכני ואינה אחראית לתוכן המודעות, לכריתתן או לביצוען של העסקאות בין המשתמשים.",
        ],
      },
      {
        heading: "מידע אישי",
        paragraphs: [
          "המידע הנאסף מעובד בהתאם לדין החל ומשמש אך ורק לצורך הפעלת השירות וחיבור בין המשתמשים. למשתמש זכות עיון, תיקון ומחיקה של המידע שלו.",
        ],
      },
      {
        heading: "שינוי התנאים",
        paragraphs: [
          "NadlanConnect שומרת לעצמה את הזכות לשנות תנאי שימוש אלה בכל עת. הגרסה החלה היא זו שבתוקף במועד השימוש בפלטפורמה.",
        ],
      },
    ],
  },
};

export const CGV: Record<Language, LegalDoc> = {
  fr: {
    title: "Conditions Générales de Vente (CGV)",
    lastUpdated: "11 juin 2026",
    intro:
      "Les présentes Conditions Générales de Vente définissent les conditions commerciales applicables entre NadlanConnect et les professionnels (promoteurs et agences immobilières) utilisant la plateforme.",
    sections: [
      {
        heading: "Objet et champ d'application",
        paragraphs: [
          "Les présentes CGV régissent la fourniture des services de mise en relation et de visibilité proposés par NadlanConnect aux professionnels de l'immobilier, ainsi que la rémunération due à ce titre.",
        ],
      },
      {
        heading: "Inscription des professionnels",
        paragraphs: [
          "L'accès aux services professionnels est subordonné à la création d'un compte promoteur ou agence et à l'acceptation des présentes CGV. Le professionnel garantit l'exactitude des informations fournies lors de son inscription.",
        ],
      },
      {
        heading: "Commission et rémunération",
        paragraphs: [
          "Au titre de la mise en relation et des services fournis, NadlanConnect perçoit une commission égale à 0,5 % du prix de vente de chaque bien immobilier dont la transaction est réalisée grâce à la plateforme.",
          "Cette commission de 0,5 % est répartie de la manière suivante : 0,25 % à la charge du promoteur et 0,25 % à la charge de l'agence immobilière intervenant dans la transaction.",
          "La commission est calculée sur le prix de vente et devient exigible à la signature de l'acte authentique de vente.",
          "L'acquéreur (acheteur final) n'est redevable d'aucune commission envers NadlanConnect.",
        ],
      },
      {
        heading: "Facturation et paiement",
        paragraphs: [
          "La commission fait l'objet d'une facture émise par NadlanConnect à chaque professionnel pour la part lui incombant (0,25 %). Le règlement intervient selon les délais indiqués sur la facture.",
        ],
      },
      {
        heading: "Obligations des professionnels",
        paragraphs: [
          "Le professionnel s'engage à publier des annonces exactes et à jour, à honorer les demandes de mise en relation transmises par la plateforme, et à déclarer toute transaction conclue par l'intermédiaire de NadlanConnect.",
        ],
      },
      {
        heading: "Durée et résiliation",
        paragraphs: [
          "Le compte professionnel est conclu pour une durée indéterminée. Chaque partie peut y mettre fin à tout moment ; les commissions dues pour les transactions déjà conclues restent exigibles après la résiliation.",
        ],
      },
      {
        heading: "Protection de la commission (non-contournement)",
        paragraphs: [
          "Les parties mises en relation par la plateforme s'interdisent de réaliser ou de faire réaliser l'opération hors plateforme afin d'éluder la commission due. Tout contournement caractérisé rend la commission exigible, le cas échéant majorée à titre de clause pénale, sans préjudice de tous dommages-intérêts.",
        ],
      },
      {
        heading: "Consommateurs, rétractation et médiation",
        paragraphs: [
          "Lorsqu'un service payant est souscrit par un consommateur, celui-ci bénéficie, le cas échéant, du droit de rétractation prévu par la réglementation applicable, sauf renonciation expresse pour un service pleinement exécuté avant la fin du délai. Tout litige de consommation peut être soumis à un médiateur de la consommation.",
        ],
      },
      {
        heading: "Responsabilité et litiges",
        paragraphs: [
          "NadlanConnect n'est pas partie aux contrats de vente conclus entre professionnels et acheteurs. Les présentes CGV sont soumises au droit applicable en Israël, sous réserve des règles impératives de protection des consommateurs.",
        ],
      },
    ],
  },
  en: {
    title: "General Terms of Sale (GTS)",
    lastUpdated: "June 4, 2026",
    intro:
      "These General Terms of Sale define the commercial terms applicable between NadlanConnect and the professionals (developers and real estate agencies) using the platform.",
    sections: [
      {
        heading: "Purpose and scope",
        paragraphs: [
          "These GTS govern the supply of the matchmaking and visibility services offered by NadlanConnect to real estate professionals, as well as the remuneration due in this respect.",
        ],
      },
      {
        heading: "Registration of professionals",
        paragraphs: [
          "Access to professional services is subject to the creation of a developer or agency account and acceptance of these GTS. The professional warrants the accuracy of the information provided upon registration.",
        ],
      },
      {
        heading: "Commission and remuneration",
        paragraphs: [
          "In consideration of the matchmaking and services provided, NadlanConnect receives a commission equal to 0.5% of the sale price of each property whose transaction is completed thanks to the platform.",
          "This 0.5% commission is split as follows: 0.25% borne by the developer and 0.25% borne by the real estate agency involved in the transaction.",
          "The commission is calculated on the sale price and becomes due upon signature of the final deed of sale.",
          "The purchaser (final buyer) owes no commission to NadlanConnect.",
        ],
      },
      {
        heading: "Invoicing and payment",
        paragraphs: [
          "The commission is invoiced by NadlanConnect to each professional for the share due from them (0.25%). Payment is made within the time limits stated on the invoice.",
        ],
      },
      {
        heading: "Obligations of professionals",
        paragraphs: [
          "The professional undertakes to publish accurate and up-to-date listings, to honor the connection requests forwarded by the platform, and to declare any transaction concluded through NadlanConnect.",
        ],
      },
      {
        heading: "Term and termination",
        paragraphs: [
          "The professional account is entered into for an indefinite term. Either party may terminate it at any time; commissions due for transactions already concluded remain payable after termination.",
        ],
      },
      {
        heading: "Liability and disputes",
        paragraphs: [
          "NadlanConnect is not a party to the sale contracts concluded between professionals and buyers. These GTS are governed by the law applicable in Israel, subject to mandatory consumer protection rules.",
        ],
      },
    ],
  },
  he: {
    title: "תנאי מכר",
    lastUpdated: "4 ביוני 2026",
    intro:
      "תנאי מכר אלה מגדירים את התנאים המסחריים החלים בין NadlanConnect לבין אנשי המקצוע (יזמים וסוכנויות נדל\"ן) העושים שימוש בפלטפורמה.",
    sections: [
      {
        heading: "מטרה ותחולה",
        paragraphs: [
          "תנאי מכר אלה מסדירים את אספקת שירותי התיווך והחשיפה שמציעה NadlanConnect לאנשי מקצוע בתחום הנדל\"ן, וכן את התמורה המגיעה בגינם.",
        ],
      },
      {
        heading: "רישום אנשי מקצוע",
        paragraphs: [
          "הגישה לשירותים המקצועיים מותנית ביצירת חשבון יזם או סוכנות ובקבלת תנאי מכר אלה. איש המקצוע מתחייב לדיוק המידע הנמסר במועד הרישום.",
        ],
      },
      {
        heading: "עמלה ותמורה",
        paragraphs: [
          "בעבור התיווך והשירותים הניתנים, NadlanConnect גובה עמלה בשיעור של 0.5% ממחיר המכירה של כל נכס שעסקתו הושלמה הודות לפלטפורמה.",
          "עמלה זו בשיעור 0.5% מתחלקת באופן הבא: 0.25% על היזם ו-0.25% על סוכנות הנדל\"ן המעורבת בעסקה.",
          "העמלה מחושבת על מחיר המכירה והופכת לחבה בעת חתימת חוזה המכר הסופי.",
          "הרוכש (הקונה הסופי) אינו חב בכל עמלה כלפי NadlanConnect.",
        ],
      },
      {
        heading: "חיוב ותשלום",
        paragraphs: [
          "העמלה מחויבת על ידי NadlanConnect לכל איש מקצוע בגין חלקו (0.25%). התשלום מתבצע בהתאם למועדים המצוינים בחשבונית.",
        ],
      },
      {
        heading: "חובות אנשי המקצוע",
        paragraphs: [
          "איש המקצוע מתחייב לפרסם מודעות מדויקות ומעודכנות, לכבד את בקשות החיבור המועברות על ידי הפלטפורמה, ולדווח על כל עסקה שנכרתה באמצעות NadlanConnect.",
        ],
      },
      {
        heading: "תקופה וסיום",
        paragraphs: [
          "חשבון איש המקצוע נכרת לתקופה בלתי מוגבלת. כל צד רשאי לסיימו בכל עת; עמלות המגיעות בגין עסקאות שכבר נכרתו נותרות חבות לתשלום גם לאחר הסיום.",
        ],
      },
      {
        heading: "אחריות ויישוב מחלוקות",
        paragraphs: [
          "NadlanConnect אינה צד לחוזי המכר הנכרתים בין אנשי המקצוע לרוכשים. תנאי מכר אלה כפופים לדין החל בישראל, בכפוף לכללי הגנת הצרכן הקוגנטיים.",
        ],
      },
    ],
  },
};

// NOTE — Brouillons à FAIRE VALIDER par un juriste. Les champs « (à compléter
// par l'éditeur) » doivent être renseignés avec les informations réelles de la
// société (forme juridique, immatriculation, siège, hébergeur, DPO) avant la
// mise en ligne. Versions EN/HE à confier à un traducteur juridique : la page
// retombe sur le français tant qu'elles ne sont pas fournies.
export const CONFIDENTIALITE: Record<string, LegalDoc> = {
  fr: {
    title: "Politique de confidentialité",
    lastUpdated: "24 juin 2026",
    intro:
      "La présente politique décrit comment NadlanConnect collecte, utilise et protège vos données personnelles, conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi israélienne sur la protection de la vie privée.",
    sections: [
      {
        heading: "Responsable du traitement",
        paragraphs: [
          "Le responsable du traitement est NadlanConnect (forme juridique, immatriculation et siège social : à compléter par l'éditeur).",
          "Pour toute question relative à vos données : contact@nadlanconnect.co.il.",
        ],
      },
      {
        heading: "Données collectées",
        paragraphs: [
          "Données d'identité et de contact : nom, prénom, e-mail, téléphone, société (pour les professionnels).",
          "Données de compte : identifiants de connexion, mot de passe (stocké sous forme hachée, jamais en clair).",
          "Contenus que vous publiez : annonces, programmes, projets de démolition, messages et demandes de mise en relation (leads).",
          "Données de paiement : traitées directement par notre prestataire PayPlus ; nous ne stockons jamais votre numéro de carte.",
          "Données techniques : cookies, journaux de connexion, adresse IP, type d'appareil.",
        ],
      },
      {
        heading: "Finalités et bases légales",
        paragraphs: [
          "Fourniture du service et mise en relation acheteurs / professionnels : exécution du contrat.",
          "Gestion des comptes, des abonnements et facturation : exécution du contrat et obligations légales.",
          "Sécurité, prévention de la fraude et amélioration du service : intérêt légitime.",
          "Analyse de bien par intelligence artificielle (« Agent Shamai ») : à votre demande / sur la base de votre consentement.",
          "Mesure d'audience : sur la base de votre consentement (bandeau cookies).",
        ],
      },
      {
        heading: "Intelligence artificielle et transfert hors UE",
        paragraphs: [
          "Lorsque vous utilisez l'analyse IA, le contenu que vous soumettez est transmis à notre sous-traitant Anthropic (États-Unis) afin de générer l'analyse.",
          "Ce transfert hors Union européenne est encadré par des garanties appropriées (clauses contractuelles types). Évitez d'insérer des données personnelles sensibles non nécessaires dans les annonces analysées.",
        ],
      },
      {
        heading: "Destinataires des données",
        paragraphs: [
          "Les professionnels avec lesquels vous choisissez d'être mis en relation (selon vos actions sur la plateforme).",
          "Nos sous-traitants techniques : hébergement, envoi d'e-mails, paiement (PayPlus), analyse IA (Anthropic). Ils n'agissent que sur nos instructions.",
        ],
      },
      {
        heading: "Durées de conservation",
        paragraphs: [
          "Compte et contenus : pendant la durée d'utilisation du service, puis suppression ou anonymisation dans un délai raisonnable.",
          "Documents de facturation : conservés pour la durée légale applicable.",
          "Les durées précises sont à confirmer par l'éditeur en fonction des obligations locales.",
        ],
      },
      {
        heading: "Vos droits",
        paragraphs: [
          "Vous disposez des droits d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité, ainsi que du droit de retirer votre consentement à tout moment.",
          "Pour exercer ces droits : contact@nadlanconnect.co.il.",
          "Vous pouvez introduire une réclamation auprès de l'autorité de contrôle compétente (CNIL en France, Autorité de protection de la vie privée en Israël).",
        ],
      },
      {
        heading: "Cookies",
        paragraphs: [
          "Nous utilisons des cookies strictement nécessaires au fonctionnement (session, préférences de langue).",
          "Les cookies de mesure d'audience ne sont déposés qu'après votre consentement via le bandeau dédié, que vous pouvez modifier à tout moment.",
        ],
      },
      {
        heading: "Sécurité",
        paragraphs: [
          "Les mots de passe sont hachés (bcrypt), les sessions reposent sur des cookies HttpOnly et l'accès aux données est restreint. Aucune mesure ne pouvant garantir une sécurité absolue, nous nous engageons à une obligation de moyens renforcée.",
        ],
      },
      {
        heading: "Contact / Délégué à la protection des données",
        paragraphs: [
          "Délégué à la protection des données (DPO) : à compléter par l'éditeur. À défaut, toute demande peut être adressée à contact@nadlanconnect.co.il.",
        ],
      },
    ],
  },
};

export const MENTIONS: Record<string, LegalDoc> = {
  fr: {
    title: "Mentions légales",
    lastUpdated: "24 juin 2026",
    intro:
      "Conformément à la réglementation en vigueur, les informations suivantes sont portées à la connaissance des utilisateurs du site NadlanConnect.",
    sections: [
      {
        heading: "Éditeur du site",
        paragraphs: [
          "NadlanConnect — forme juridique, capital social, numéro d'immatriculation (RCS / registre des sociétés) et siège social : à compléter par l'éditeur.",
          "Contact : contact@nadlanconnect.co.il.",
          "Directeur de la publication : à compléter par l'éditeur.",
        ],
      },
      {
        heading: "Hébergement",
        paragraphs: [
          "Le site est hébergé par son prestataire d'infrastructure (nom et adresse de l'hébergeur : à compléter par l'éditeur).",
        ],
      },
      {
        heading: "Propriété intellectuelle",
        paragraphs: [
          "La marque NadlanConnect, le logo, la charte graphique et les contenus du site sont protégés. Toute reproduction ou réutilisation sans autorisation est interdite. Les marques de tiers éventuellement citées appartiennent à leurs titulaires respectifs.",
        ],
      },
      {
        heading: "Responsabilité",
        paragraphs: [
          "Les estimations de prix et scores d'investissement sont fournis à titre indicatif et non contractuel. NadlanConnect ne saurait être tenue responsable des décisions prises sur la seule base de ces informations.",
        ],
      },
      {
        heading: "Données personnelles",
        paragraphs: [
          "Le traitement de vos données personnelles est décrit dans notre Politique de confidentialité, accessible depuis le pied de page.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: ["Pour toute question : contact@nadlanconnect.co.il."],
      },
    ],
  },
};
