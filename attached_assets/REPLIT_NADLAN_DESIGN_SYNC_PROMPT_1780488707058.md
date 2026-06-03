# Prompt Replit — Synchronisation design NadlanConnect ↔ Simulateur

## Objectif

Les deux sites (israel-simzip.replit.app et nadlan-connect.replit.app) doivent
former une famille visuelle cohérente. Un utilisateur qui passe de l'un à l'autre
doit reconnaître immédiatement qu'ils appartiennent au même écosystème.

Voici exactement ce qu'il faut modifier sur NadlanConnect pour aligner les deux.

---

## DIFFÉRENCES CONSTATÉES ENTRE LES DEUX SITES

| Élément | Simulateur (référence) | NadlanConnect (à corriger) |
|---|---|---|
| Fond header | `#1A3A5C` bleu ardoise | `#1A3A5C` ✓ OK |
| Bannière marché | 1 ligne compacte fond noir | Présente mais à aligner |
| Police titre | DM Serif Display | Police serif différente |
| Bouton CTA | `#C9A84C` or, border-radius 24px | `#C9A84C` or mais forme différente |
| Fond page | `#F8F7F4` beige chaud | `#F0EBE1` trop crème / jauni |
| Hero | SVG skyline semi-transparent | Photo réelle de ville (style différent) |
| Cartes | Fond blanc, bordure `#E5E7EB`, radius 10px | Radius trop arrondi, ombre trop forte |
| Score badge | Badge or `#C9A84C` fond | Badge présent ✓ mais style différent |
| Footer | Fond `#0F2235` très sombre | Fond `#1A3A5C` moins sombre |
| Logo icône | Bâtiment or sur fond bleu carré | Bâtiment similaire ✓ OK |
| Onglet actif | Souligné `#C9A84C` | Texte or sans soulignement |

---

## CORRECTION 1 — Fond de page

```css
/* AVANT */
background-color: #F0EBE1; /* trop crème/jauni */

/* APRÈS — identique au simulateur */
background-color: #F8F7F4;
```

Applique `background: #F8F7F4` sur :
- Le `<body>` ou le conteneur racine
- Toutes les sections de fond clair
- Les cartes de propriétés (fond blanc `#FFFFFF` avec bordure `#E5E7EB`)

---

## CORRECTION 2 — Typographie

Installe les mêmes fonts que le simulateur dans `index.html` :

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Applique dans le CSS global :
```css
body {
  font-family: 'Plus Jakarta Sans', sans-serif;
}

h1, h2, .hero-title, .section-title-serif {
  font-family: 'DM Serif Display', Georgia, serif;
  font-weight: 400;
}
```

Le titre hero "Trouvez l'investissement parfait en Israël" doit être en
**DM Serif Display**, même style exact que "Estimate, invest, develop in Israel"
sur le simulateur.

---

## CORRECTION 3 — Hero section

### Actuellement
Photo réelle d'une ville en arrière-plan avec overlay sombre.

### À faire — Remplacer par le même style SVG skyline que le simulateur

```jsx
// Remplace le hero actuel par :
<div style={{
  background: 'linear-gradient(160deg, #0F2235 0%, #1A3A5C 60%, #0F2235 100%)',
  padding: '60px 24px 48px',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  minHeight: 420,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}}>

  {/* Skyline SVG identique au simulateur */}
  <div style={{
    position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none'
  }}>
    <svg width="100%" height="100%" viewBox="0 0 1200 200"
      preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <rect x="0"   y="80"  width="80"  height="120" fill="white"/>
      <rect x="90"  y="40"  width="120" height="160" fill="white"/>
      <rect x="220" y="60"  width="80"  height="140" fill="white"/>
      <rect x="310" y="20"  width="100" height="180" fill="white"/>
      <rect x="420" y="50"  width="90"  height="150" fill="white"/>
      <rect x="520" y="30"  width="130" height="170" fill="white"/>
      <rect x="660" y="55"  width="85"  height="145" fill="white"/>
      <rect x="755" y="15"  width="110" height="185" fill="white"/>
      <rect x="875" y="65"  width="90"  height="135" fill="white"/>
      <rect x="975" y="35"  width="120" height="165" fill="white"/>
      <rect x="1105" y="70" width="95"  height="130" fill="white"/>
    </svg>
  </div>

  {/* Badge eyebrow */}
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(201, 168, 76, 0.15)',
    border: '1px solid rgba(201, 168, 76, 0.35)',
    borderRadius: 20,
    padding: '5px 14px',
    marginBottom: 20,
    position: 'relative',
  }}>
    <span style={{ fontSize: 14 }}>🇮🇱</span>
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      color: '#C9A84C',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    }}>
      Plateforme immobilière israélienne
    </span>
  </div>

  {/* Titre */}
  <h1 style={{
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: 'clamp(28px, 5vw, 48px)',
    fontWeight: 400,
    color: 'white',
    lineHeight: 1.2,
    marginBottom: 16,
    position: 'relative',
    maxWidth: 700,
  }}>
    Promoteurs, agences,<br />
    <span style={{ color: '#C9A84C' }}>connectez-vous. Vendez plus.</span>
  </h1>

  {/* Sous-titre */}
  <p style={{
    fontSize: 15,
    color: '#85B7EB',
    lineHeight: 1.6,
    marginBottom: 28,
    maxWidth: 520,
    position: 'relative',
  }}>
    La première plateforme qui connecte promoteurs et agences
    pour vendre des programmes neufs en Israël.
  </p>

  {/* 2 CTA côte à côte */}
  <div style={{
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 32,
  }}>
    <button style={{
      background: '#C9A84C',
      color: '#0F2235',
      border: 'none',
      borderRadius: 24,
      padding: '12px 28px',
      fontSize: 14,
      fontWeight: 700,
      cursor: 'pointer',
    }}>
      Je suis promoteur →
    </button>
    <button style={{
      background: 'rgba(255,255,255,0.12)',
      color: 'white',
      border: '1px solid rgba(255,255,255,0.3)',
      borderRadius: 24,
      padding: '12px 28px',
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
    }}>
      Je suis une agence →
    </button>
  </div>

  {/* Stats */}
  <div style={{
    display: 'flex',
    gap: 40,
    justifyContent: 'center',
    position: 'relative',
  }}>
    {[
      { val: '50 000+', lbl: 'transactions Nadlan' },
      { val: '12 villes', lbl: 'couvertes' },
      { val: '3 outils', lbl: 'de valorisation' },
    ].map((s, i) => (
      <div key={i} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#C9A84C' }}>{s.val}</div>
        <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{s.lbl}</div>
      </div>
    ))}
  </div>

</div>
```

---

## CORRECTION 4 — Cartes de propriétés

```jsx
// Style unifié des cartes — identique aux cartes du simulateur
const cardStyle = {
  background: 'white',
  border: '0.5px solid #E5E7EB',
  borderRadius: 10,           // IMPORTANT : 10px comme le simulateur, pas 16px
  overflow: 'hidden',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',   // ombre très légère
  transition: 'box-shadow 0.15s',
  cursor: 'pointer',
}

// Au hover :
// box-shadow: '0 4px 16px rgba(26, 58, 92, 0.12)'
// border-color: '#C9A84C'
```

---

## CORRECTION 5 — Score badge

```jsx
// Badge score — identique au simulateur
function ScoreBadge({ score }) {
  const color = score >= 70 ? '#0F6E56' : score >= 45 ? '#BA7517' : '#993C1D'
  const bg    = score >= 70 ? '#EAF3DE' : score >= 45 ? '#FAEEDA' : '#FCEBEB'
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: bg,
      color: color,
      fontSize: 11,
      fontWeight: 700,
      padding: '3px 8px',
      borderRadius: 6,
    }}>
      ★ {score}/100
    </span>
  )
}
```

---

## CORRECTION 6 — Navbar active state

```jsx
// Onglet actif : soulignement or identique au simulateur
const navLinkStyle = (isActive) => ({
  color: isActive ? '#C9A84C' : 'rgba(255,255,255,0.7)',
  fontWeight: isActive ? 600 : 400,
  borderBottom: isActive ? '2px solid #C9A84C' : '2px solid transparent',
  padding: '4px 0',
  fontSize: 14,
  textDecoration: 'none',
  transition: 'color 0.15s',
})
```

---

## CORRECTION 7 — Footer

```jsx
// Footer identique au simulateur
<footer style={{
  background: '#0F2235',   // plus sombre que #1A3A5C
  color: '#6B7280',
  padding: '32px 24px',
}}>
  {/* Ligne or fine en haut */}
  <div style={{
    borderTop: '0.5px solid #C9A84C',
    paddingTop: 24,
  }}>
    {/* Logo + description */}
    {/* Liens rapides */}
    {/* Langues FR/EN/עב */}
    {/* Copyright */}
    <p style={{ fontSize: 11, color: '#4B5563', textAlign: 'center', marginTop: 16 }}>
      © 2025 NadlanConnect · Estimations indicatives, non contractuelles.
    </p>
  </div>
</footer>
```

---

## CORRECTION 8 — Bannière marché

La bannière marché doit être **identique** au simulateur :

```jsx
// Même composant MarketBanner que le simulateur
<div style={{
  background: '#0A1628',
  padding: '5px 24px',
  display: 'flex',
  alignItems: 'center',
  gap: 20,
  overflowX: 'auto',
  fontSize: 11,
  whiteSpace: 'nowrap',
}}>
  <span style={{ color: '#6B7280' }}>
    📊 <span style={{ color: '#85B7EB' }}>Marché au 01/06/2025</span>
  </span>
  <span style={{ color: '#6B7280' }}>
    BOI <strong style={{ color: '#C9A84C' }}>4.5%</strong>
  </span>
  <span style={{ color: '#6B7280' }}>
    Hypo <strong style={{ color: '#C9A84C' }}>5.2%</strong>
  </span>
  <span style={{ color: '#6B7280' }}>
    CBS <strong style={{ color: '#C9A84C' }}>285.4</strong>
  </span>
  <span style={{ color: '#0F6E56' }}>▲ 6.2% / 12 mois</span>
</div>
```

---

## RÉCAPITULATIF DES VARIABLES CSS GLOBALES

Ajoute ce fichier `src/styles/tokens.css` et importe-le dans `main.jsx` :

```css
:root {
  /* Couleurs — identiques aux deux sites */
  --color-navy:     #0F2235;
  --color-blue:     #1A3A5C;
  --color-blue2:    #2A5080;
  --color-gold:     #C9A84C;
  --color-gold-lt:  #FDF6E3;
  --color-bg:       #F8F7F4;
  --color-white:    #FFFFFF;
  --color-grey:     #E5E7EB;
  --color-text:     #111827;
  --color-muted:    #6B7280;
  --color-success:  #0F6E56;
  --color-error:    #993C1D;
  --color-warning:  #BA7517;

  /* Typographie */
  --font-serif: 'DM Serif Display', Georgia, serif;
  --font-sans:  'Plus Jakarta Sans', system-ui, sans-serif;

  /* Espacements */
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  16px;
  --radius-cta: 24px;

  /* Ombres */
  --shadow-card: 0 1px 4px rgba(0,0,0,0.06);
  --shadow-hover: 0 4px 16px rgba(26,58,92,0.12);
}
```

---

## CHECKLIST DE VALIDATION

Une fois les modifications appliquées, vérifie que les deux sites se ressemblent :

- [ ] Fond page : même beige chaud `#F8F7F4`
- [ ] Header : même bleu `#1A3A5C`, même hauteur ~52px
- [ ] Bannière marché : même 1 ligne compacte fond `#0A1628`
- [ ] Hero : même style SVG skyline semi-transparent sur dégradé bleu marine
- [ ] Titre hero : DM Serif Display, même taille, même couleur or sur blanc
- [ ] CTA principal : même forme pill, même gold `#C9A84C`
- [ ] Cartes : même fond blanc, même bordure grise, même radius 10px
- [ ] Score badge : même style vert/orange/rouge selon valeur
- [ ] Footer : même fond `#0F2235`, même ligne or fine en haut
- [ ] Lien vers l'autre site dans la navbar des deux côtés
