export type DevCategory = "historiques" | "premium" | "renouvellement" | "commercial";

export interface Developer {
  slug: string;
  name: string;        // Nom latin
  nameHe: string;      // Nom hébreu
  category: DevCategory;
  /** Optionnel : chemin du logo dans /public/partners/ (ex: "/partners/shikun-binui.png").
   *  Tant qu'il est absent, le bandeau et la page affichent le nom stylisé. */
  logo?: string;
  blurb: { fr: string; en: string; he: string };
}

export const DEVELOPERS: Developer[] = [
  // ── Géants historiques ──
  {
    slug: "shikun-binui",
    name: "Shikun & Binui",
    nameHe: "שיכון ובינוי",
    category: "historiques",
    blurb: {
      fr: "Plus grand groupe d'infrastructures et de promotion immobilière d'Israël.",
      en: "Israel's largest infrastructure and real-estate development group.",
      he: "קבוצת התשתיות והייזום הנדל״ני הגדולה בישראל.",
    },
  },
  {
    slug: "ashtrom",
    name: "Ashtrom Group",
    nameHe: "קבוצת אשטרום",
    category: "historiques",
    blurb: {
      fr: "Conglomérat coté : matériaux, résidentiel haut de gamme, bureaux et centres commerciaux.",
      en: "Listed conglomerate: materials, premium residential, offices and malls.",
      he: "קונגלומרט נסחר: חומרי בנייה, מגורי יוקרה, משרדים וקניונים.",
    },
  },
  {
    slug: "electra-real-estate",
    name: "Electra Real Estate",
    nameHe: 'אלקטרה נדל"ן',
    category: "historiques",
    blurb: {
      fr: "Filiale immobilière du groupe Electra : résidentiel, parcs d'activités et commercial.",
      en: "Electra's real-estate arm: residential, business parks and commercial.",
      he: "הזרוע הנדל״נית של קבוצת אלקטרה: מגורים, פארקי תעסוקה ומסחר.",
    },
  },

  // ── Résidentiel premium ──
  {
    slug: "israel-canada",
    name: "Israel Canada",
    nameHe: "ישראל קנדה",
    category: "premium",
    blurb: {
      fr: "Acteur majeur du luxe et des projets mixtes à Tel-Aviv (tours phares, parcelles ultra-prime).",
      en: "Major player in luxury and mixed-use projects in Tel Aviv (landmark towers, prime plots).",
      he: "שחקנית מובילה ביוקרה ובפרויקטים מעורבי-שימושים בתל אביב (מגדלי דגל, מגרשי פריים).",
    },
  },
  {
    slug: "acro",
    name: "Acro Real Estate",
    nameHe: 'אקרו נדל"ן',
    category: "premium",
    blurb: {
      fr: "Immobilier haut de gamme et gratte-ciels résidentiels et de bureaux à Tel-Aviv.",
      en: "High-end real estate and residential & office towers in Tel Aviv.",
      he: "נדל״ן יוקרתי ומגדלי מגורים ומשרדים בתל אביב.",
    },
  },
  {
    slug: "dimri",
    name: "Y.H. Dimri",
    nameHe: "י.ח. דמרי",
    category: "premium",
    blurb: {
      fr: "L'un des plus gros promoteurs résidentiels du pays en volume d'appartements.",
      en: "One of the country's largest residential developers by volume.",
      he: "אחת היזמיות הגדולות במדינה בהיקף דירות למגורים.",
    },
  },
  {
    slug: "azorim",
    name: "Azorim",
    nameHe: "אזורים",
    category: "premium",
    blurb: {
      fr: "Nom historique des grands projets résidentiels et des tours d'habitation urbaines.",
      en: "Historic name in large residential projects and urban housing towers.",
      he: "שם ותיק בפרויקטים גדולים למגורים ובמגדלי מגורים עירוניים.",
    },
  },

  // ── Renouvellement urbain (Tama 38 / Pinui-Binui) ──
  {
    slug: "aura",
    name: "Aura Investments",
    nameHe: "אורה השקעות",
    category: "renouvellement",
    blurb: {
      fr: "Leader incontesté du Pinui-Binui et du renouvellement urbain (Tel-Aviv, Ramat Gan, Givatayim).",
      en: "Undisputed leader in Pinui-Binui and urban renewal (Tel Aviv, Ramat Gan, Givatayim).",
      he: "מובילה בלתי מעורערת בפינוי-בינוי ובהתחדשות עירונית (תל אביב, רמת גן, גבעתיים).",
    },
  },
  {
    slug: "tidhar",
    name: "Tidhar Group",
    nameHe: "קבוצת תדהר",
    category: "renouvellement",
    blurb: {
      fr: "Promoteur-constructeur de référence, reconnu pour sa rigueur d'exécution et ses grands projets.",
      en: "Leading developer-builder known for execution rigor and large-scale projects.",
      he: "יזמית-קבלנית מובילה, מוכרת בקפדנות הביצוע ובפרויקטים בקנה מידה גדול.",
    },
  },
  {
    slug: "gabay",
    name: "Gabay Group",
    nameHe: "קבוצת גבאי",
    category: "renouvellement",
    blurb: {
      fr: "Groupe familial solide : projets boutique, Tama 38 et surélévations au centre de Tel-Aviv.",
      en: "Solid family group: boutique projects, Tama 38 and rooftop additions in central Tel Aviv.",
      he: "קבוצה משפחתית איתנה: פרויקטים בוטיק, תמ״א 38 ותוספות גג במרכז תל אביב.",
    },
  },

  // ── Commercial, bureaux & centres ──
  {
    slug: "azrieli",
    name: "Azrieli Group",
    nameHe: "קבוצת עזריאלי",
    category: "commercial",
    blurb: {
      fr: "Plus grosse capitalisation immobilière du pays : tours Azrieli, centres commerciaux et bureaux.",
      en: "Country's largest real-estate cap: Azrieli towers, malls and office parks.",
      he: "שווי השוק הנדל״ני הגדול במדינה: מגדלי עזריאלי, קניונים ומשרדים.",
    },
  },
  {
    slug: "melisron",
    name: "Melisron",
    nameHe: "מליסרון",
    category: "commercial",
    blurb: {
      fr: "Grand acteur des centres commerciaux (Ofer Malls) et des bureaux de prestige pour la Tech.",
      en: "Major player in shopping centers (Ofer Malls) and prime offices for tech firms.",
      he: "שחקנית גדולה בקניונים (קניוני עופר) ובמשרדי יוקרה לחברות הייטק.",
    },
  },
  {
    slug: "gav-yam",
    name: "Gav-Yam",
    nameHe: "גב-ים",
    category: "commercial",
    blurb: {
      fr: "Spécialiste historique des parcs technologiques et industriels de pointe (Herzliya, Matam…).",
      en: "Historic specialist in advanced tech and industrial parks (Herzliya, Matam…).",
      he: "מומחית ותיקה בפארקי טכנולוגיה ותעשייה מתקדמים (הרצליה, מתם…).",
    },
  },
];

export const CATEGORY_ORDER: DevCategory[] = ["historiques", "premium", "renouvellement", "commercial"];

export const CATEGORY_LABELS: Record<DevCategory, { fr: string; en: string; he: string }> = {
  historiques: { fr: "Géants historiques", en: "Historic giants", he: "ענקיות ותיקות" },
  premium: { fr: "Résidentiel premium", en: "Premium residential", he: "מגורי יוקרה" },
  renouvellement: { fr: "Renouvellement urbain", en: "Urban renewal", he: "התחדשות עירונית" },
  commercial: { fr: "Commercial & bureaux", en: "Commercial & offices", he: "מסחר ומשרדים" },
};

export const DEV_UI = {
  sectionLabel: {
    fr: "Les grands promoteurs du marché israélien",
    en: "Israel's leading real-estate developers",
    he: 'יזמי הנדל"ן המובילים בישראל',
  },
  pageSubtitle: {
    fr: "Un panorama des groupes qui façonnent l'immobilier en Israël — des géants de l'infrastructure aux spécialistes du renouvellement urbain.",
    en: "An overview of the groups shaping real estate in Israel — from infrastructure giants to urban-renewal specialists.",
    he: 'מבט על הקבוצות שמעצבות את שוק הנדל"ן בישראל — מענקיות התשתית ועד מובילי ההתחדשות העירונית.',
  },
  disclaimer: {
    fr: "Liste informative des principaux acteurs du marché. Les marques citées appartiennent à leurs propriétaires respectifs.",
    en: "Informative list of the market's main players. All trademarks belong to their respective owners.",
    he: "רשימה אינפורמטיבית של השחקנים המרכזיים בשוק. הסימנים המסחריים שייכים לבעליהם.",
  },
};
