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

export const CGU: Record<Language, LegalDoc> = {
  fr: {
    title: "Conditions Générales d'Utilisation (CGU)",
    lastUpdated: "4 juin 2026",
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
    lastUpdated: "4 juin 2026",
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
