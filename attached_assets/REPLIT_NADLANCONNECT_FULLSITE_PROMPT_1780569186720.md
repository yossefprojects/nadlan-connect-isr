# Prompt Replit — Refonte complète TOUT le site nadlanconnect.com
# Navbar + Home + Propriétés (/listings) + Analyse IA (/outils/analyse-ia) + Footer + 404

## Règle principale
Seul le design change. Les données, la logique de l'agent IA, les appels API,
les formulaires et leur fonctionnement restent IDENTIQUES.

## Palette (conservée et renforcée)
```css
:root {
  --navy:      #0A1628;   /* fond très sombre */
  --blue:      #1A3A5C;   /* bleu principal */
  --blue2:     #2A5080;
  --gold:      #C9A84C;
  --gold2:     #E8C96A;
  --gold-lt:   rgba(201,168,76,0.12);
  --bg:        #F8F7F4;   /* fond clair beige chaud */
  --bg2:       #F0ECE4;
  --white:     #FFFFFF;
  --text:      #0C1A2E;
  --muted:     #64748B;
  --border:    #E2E8F0;
  --green:     #0F6E56;
  --red:       #8B1A1A;

  --font-serif: 'DM Serif Display', Georgia, serif;
  --font-sans:  'Plus Jakarta Sans', system-ui, sans-serif;
}
```

Dans index.html :
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

## INSTALL
```bash
npm install framer-motion
```

---

## 1 — CSS ANIMATIONS GLOBALES

```css
@keyframes fadeInUp {
  from { opacity:0; transform:translateY(28px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes fadeInDown {
  from { opacity:0; transform:translateY(-18px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes shimmer-gold {
  0%   { background-position:-200% center; }
  100% { background-position:200% center; }
}
@keyframes float-particle {
  0%,100% { transform:translateY(0) rotate(0deg); }
  50%      { transform:translateY(-10px) rotate(4deg); }
}
@keyframes pulse-dot {
  0%,100% { opacity:1; transform:scale(1); }
  50%      { opacity:0.4; transform:scale(0.7); }
}
@keyframes bounce-down {
  0%,100% { transform:translateX(-50%) translateY(0); }
  50%      { transform:translateX(-50%) translateY(7px); }
}
@keyframes countUp {
  from { opacity:0; transform:scale(0.85); }
  to   { opacity:1; transform:scale(1); }
}

.reveal {
  opacity:0; transform:translateY(30px);
  transition:opacity .65s cubic-bezier(.16,1,.3,1), transform .65s cubic-bezier(.16,1,.3,1);
}
.reveal.visible       { opacity:1; transform:translateY(0); }
.reveal-left  { opacity:0; transform:translateX(-30px);
  transition:opacity .65s cubic-bezier(.16,1,.3,1), transform .65s cubic-bezier(.16,1,.3,1); }
.reveal-left.visible  { opacity:1; transform:translateX(0); }
.reveal-right { opacity:0; transform:translateX(30px);
  transition:opacity .65s cubic-bezier(.16,1,.3,1), transform .65s cubic-bezier(.16,1,.3,1); }
.reveal-right.visible { opacity:1; transform:translateX(0); }
```

```javascript
// src/hooks/useScrollReveal.js
import { useEffect } from 'react'
export function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal,.reveal-left,.reveal-right')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}
```

---

## 2 — NAVBAR — glassmorphism au scroll

Trouve le composant Navbar existant. Ajoute l'effet scroll + redesign :

```jsx
const [scrolled, setScrolled] = useState(false)
useEffect(() => {
  const fn = () => setScrolled(window.scrollY > 50)
  window.addEventListener('scroll', fn)
  return () => window.removeEventListener('scroll', fn)
}, [])

// Remplace le style du conteneur nav par :
style={{
  position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
  height: 60,
  // Transparent sur le hero, opaque au scroll
  background: scrolled
    ? 'rgba(10, 22, 40, 0.94)'
    : 'rgba(10, 22, 40, 0.75)',
  backdropFilter: 'blur(20px)',
  borderBottom: scrolled
    ? '1px solid rgba(201,168,76,0.2)'
    : '1px solid rgba(255,255,255,0.06)',
  transition: 'all 0.35s ease',
  display: 'flex', alignItems: 'center',
  padding: '0 32px', gap: 32,
}}

// Logo — texte avec "Connect" en gold
<a href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
  {/* Icône SVG existante — conserver */}
  <span style={{
    fontFamily: "'DM Serif Display', serif",
    fontSize: 20, color: 'white',
  }}>
    Nadlan<span style={{ color: '#C9A84C' }}>Connect</span>
  </span>
</a>

// Liens nav — hover gold underline
{['Accueil','Propriétés','Analyse IA'].map((l, i) => (
  <a key={l} href={['/', '/listings', '/outils/analyse-ia'][i]} style={{
    fontSize: 14, fontWeight: 500,
    color: isActive ? '#C9A84C' : 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    borderBottom: isActive ? '1.5px solid #C9A84C' : '1.5px solid transparent',
    paddingBottom: 2,
    transition: 'color .2s, border-color .2s',
  }} />
))}

// Bouton Connexion — plus élégant
<a href="/auth/login" style={{
  background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
  color: '#0A1628',
  borderRadius: 24, padding: '8px 22px',
  fontSize: 13, fontWeight: 700,
  textDecoration: 'none',
  boxShadow: '0 4px 14px rgba(201,168,76,0.35)',
  transition: 'all .2s',
  marginLeft: 'auto',
}}
onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(201,168,76,0.5)'}
onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(201,168,76,0.35)'}
>
  Connexion
</a>
```

---

## 3 — PAGE HOME — améliorations ciblées

La home a déjà une bonne base. Ajoute `useScrollReveal()` et ces améliorations :

### 3a — Ajoute la classe `reveal` sur toutes les sections
```jsx
// Section stats
<div className="reveal" style={{ ... }}>
  50 000+ / 12 / 98%
</div>

// Section "3 étapes"
<div className="reveal" style={{ transitionDelay: `${i * 0.15}s` }}>
  {/* chaque carte */}
</div>

// Section Agent Shamai
<div className="reveal-left" style={{ ... }}>

// Section programmes
<div className="reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
```

### 3b — Stats avec CountUp animé
```jsx
// Remplace les chiffres statiques par des compteurs animés
function CountUp({ end, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) setStarted(true)
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const duration = 1800
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * end))
      if (progress >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [started, end])

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString('fr-FR')}{suffix}
    </span>
  )
}

// Usage :
<CountUp end={50000} suffix="+" /> // → 50 000+
<CountUp end={12} />               // → 12
<CountUp end={98} suffix="%" />    // → 98%
```

### 3c — Section "Programmes à la une" — état vide amélioré
```jsx
// Quand il n'y a pas encore de programmes, affiche ça au lieu du vide :
{programmes.length === 0 && (
  <div className="reveal" style={{
    gridColumn: '1 / -1',
    textAlign: 'center', padding: '60px 24px',
    background: 'white',
    border: '1px dashed #E2E8F0',
    borderRadius: 16,
  }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>🏗️</div>
    <h3 style={{
      fontFamily: "'DM Serif Display', serif",
      fontSize: 22, color: '#1A3A5C', marginBottom: 8,
    }}>
      Les premiers programmes arrivent bientôt
    </h3>
    <p style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>
      Inscrivez-vous pour être notifié dès la mise en ligne des premiers programmes.
    </p>
    <a href="/auth/register" style={{
      background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
      color: '#0A1628', borderRadius: 50,
      padding: '10px 24px', fontSize: 14, fontWeight: 700,
      textDecoration: 'none', display: 'inline-block',
    }}>
      S'inscrire gratuitement →
    </a>
  </div>
)}
```

### 3d — Section CTA "Rejoignez l'élite" — overlay amélioré
```jsx
// Sur le conteneur dark avec la photo réunion, ajoute :
style={{
  // ... styles existants ...
  position: 'relative', overflow: 'hidden',
  borderRadius: 20,
  boxShadow: '0 24px 64px rgba(10,22,40,0.3)',
}}

// Overlay gradient plus élégant sur la photo :
<div style={{
  position: 'absolute', inset: 0,
  background: 'linear-gradient(to right, rgba(10,22,40,0.92) 0%, rgba(10,22,40,0.5) 60%, transparent 100%)',
  zIndex: 1,
}} />

// Ligne décorative gold en haut :
<div style={{
  position: 'absolute', top: 0, left: 0, right: 0,
  height: 2,
  background: 'linear-gradient(to right, #C9A84C, transparent)',
  zIndex: 2,
}} />
```

---

## 4 — PAGE PROPRIÉTÉS (/listings) — refonte complète

```jsx
// Trouve le composant de la page Propriétés (probablement ListingsPage.jsx ou Properties.jsx)
// Remplace TOUT son contenu par :

import { useScrollReveal } from '../hooks/useScrollReveal'

export function ListingsPage() {
  useScrollReveal()
  const [ville, setVille] = useState('')
  const [type, setType] = useState('')
  // ... state existant conservé ...

  return (
    <div style={{ paddingTop: 60, minHeight: '100vh', background: '#F8F7F4' }}>

      {/* ── HEADER PAGE ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0A1628 0%, #1A3A5C 100%)',
        padding: '72px 40px 52px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Motif de points en fond */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(201,168,76,0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }} />
        {/* Glow gold */}
        <div style={{
          position: 'absolute', bottom: -60, right: '10%',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#C9A84C',
            letterSpacing: '0.14em', textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            🏢 Catalogue de programmes
          </div>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(28px, 4vw, 48px)',
            color: 'white', fontWeight: 400, marginBottom: 8,
          }}>
            Propriétés
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>
            Trouvez votre prochain investissement parmi notre sélection premium.
          </p>
        </div>
      </div>

      {/* ── FILTRES ── */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #E2E8F0',
        padding: '16px 40px',
        position: 'sticky', top: 60, zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', gap: 12, alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          {/* Select Ville */}
          <select
            value={ville} onChange={e => setVille(e.target.value)}
            style={{
              border: '1.5px solid #E2E8F0', borderRadius: 10,
              padding: '9px 14px', fontSize: 13,
              color: ville ? '#0C1A2E' : '#94A3B8',
              background: 'white', cursor: 'pointer',
              outline: 'none', minWidth: 180,
              transition: 'border-color .2s',
            }}
            onFocus={e => e.target.style.borderColor = '#1A3A5C'}
            onBlur={e => e.target.style.borderColor = '#E2E8F0'}
          >
            <option value="">🏙️ Toutes les villes</option>
            <option value="tlv">Tel Aviv</option>
            <option value="herzliya">Herzliya</option>
            <option value="jerusalem">Jérusalem</option>
            <option value="netanya">Netanya</option>
            <option value="raanana">Ra'anana</option>
          </select>

          {/* Select Type */}
          <select
            value={type} onChange={e => setType(e.target.value)}
            style={{
              border: '1.5px solid #E2E8F0', borderRadius: 10,
              padding: '9px 14px', fontSize: 13,
              color: type ? '#0C1A2E' : '#94A3B8',
              background: 'white', cursor: 'pointer',
              outline: 'none', minWidth: 180,
              transition: 'border-color .2s',
            }}
            onFocus={e => e.target.style.borderColor = '#1A3A5C'}
            onBlur={e => e.target.style.borderColor = '#E2E8F0'}
          >
            <option value="">🏠 Tous les types</option>
            <option value="appartement">Appartement</option>
            <option value="penthouse">Penthouse</option>
            <option value="villa">Villa</option>
            <option value="commercial">Commercial</option>
          </select>

          {/* Bouton Filtrer */}
          <button style={{
            background: '#1A3A5C', color: 'white',
            border: 'none', borderRadius: 10,
            padding: '9px 20px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            transition: 'background .2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#C9A84C'}
          onMouseLeave={e => e.currentTarget.style.background = '#1A3A5C'}
          >
            ⚡ Filtrer
          </button>

          {/* Compteur résultats */}
          <span style={{ fontSize: 12, color: '#64748B', marginLeft: 'auto' }}>
            {filteredListings.length} bien(s) trouvé(s)
          </span>
        </div>
      </div>

      {/* ── GRILLE PROPRIÉTÉS ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px' }}>
        {filteredListings.length === 0 ? (

          /* État vide */
          <div className="reveal" style={{
            textAlign: 'center', padding: '80px 24px',
            background: 'white', border: '1px dashed #E2E8F0',
            borderRadius: 20,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏗️</div>
            <h3 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 26, color: '#1A3A5C', marginBottom: 10,
            }}>
              Les premiers programmes arrivent bientôt
            </h3>
            <p style={{ fontSize: 15, color: '#64748B', marginBottom: 24, maxWidth: 480, margin: '0 auto 24px' }}>
              Inscrivez-vous pour être notifié dès la mise en ligne
              des premiers programmes exclusifs.
            </p>
            <a href="/auth/register" style={{
              background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
              color: '#0A1628', borderRadius: 50,
              padding: '12px 32px', fontSize: 14, fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(201,168,76,0.35)',
              display: 'inline-block',
            }}>
              S'inscrire gratuitement →
            </a>
          </div>

        ) : (

          /* Grille cartes */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 28,
          }}>
            {filteredListings.map((listing, i) => (
              <PropertyCard key={listing.id} listing={listing} delay={i * 0.08} />
            ))}
          </div>

        )}
      </div>
    </div>
  )
}

/* ── CARTE PROPRIÉTÉ redesignée ── */
function PropertyCard({ listing, delay }) {
  const [hovered, setHovered] = useState(false)

  // Photo Unsplash par ville
  const photos = {
    'Tel Aviv':    'https://images.unsplash.com/photo-1574958269340-fa927503f3dd?w=600&q=80',
    'Herzliya':   'https://images.unsplash.com/photo-1600607686527-6fb886090705?w=600&q=80',
    'Jérusalem':  'https://images.unsplash.com/photo-1562979314-bee7453e911c?w=600&q=80',
    'default':    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
  }
  const photo = listing.image || photos[listing.ville] || photos.default
  const score = listing.score_investissement || listing.score || 75
  const scoreColor = score >= 75 ? '#0F6E56' : score >= 50 ? '#BA7517' : '#8B1A1A'

  return (
    <div className="reveal" style={{ transitionDelay: `${delay}s` }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: 'white',
          borderRadius: 16, overflow: 'hidden',
          border: hovered ? '1.5px solid #C9A84C' : '1px solid #E2E8F0',
          boxShadow: hovered ? '0 20px 56px rgba(10,22,40,0.16)' : '0 2px 10px rgba(0,0,0,0.05)',
          transition: 'all .28s cubic-bezier(.16,1,.3,1)',
          transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
          cursor: 'pointer',
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', overflow: 'hidden', height: 220 }}>
          <img src={photo} alt={listing.titre}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transition: 'transform .5s ease',
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
            }}
          />
          {/* Overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(10,22,40,0.65) 0%, transparent 55%)',
          }} />
          {/* Statut badge */}
          <div style={{
            position: 'absolute', top: 14, left: 14,
            background: 'rgba(10,22,40,0.75)', backdropFilter: 'blur(8px)',
            color: 'white', fontSize: 11, fontWeight: 600,
            padding: '4px 10px', borderRadius: 20,
          }}>
            {listing.statut === 'en_construction' ? '🏗 En construction'
              : listing.statut === 'livraison_proche' ? '🔑 Livraison proche'
              : '✅ Livré'}
          </div>
          {/* Score */}
          <div style={{
            position: 'absolute', top: 14, right: 14,
            background: 'rgba(10,22,40,0.75)', backdropFilter: 'blur(8px)',
            color: scoreColor, fontSize: 12, fontWeight: 700,
            padding: '4px 10px', borderRadius: 20,
            border: `1px solid ${scoreColor}50`,
          }}>
            ★ {score}/100
          </div>
          {/* Prix en bas de l'image */}
          <div style={{
            position: 'absolute', bottom: 14, left: 14,
          }}>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 22, color: '#C9A84C', fontWeight: 400,
            }}>
              {((listing.prix_min || 2000000) / 1000000).toFixed(1)}M ₪
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>
              À partir de
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: '#C9A84C', fontWeight: 600, marginBottom: 5 }}>
            📍 {listing.ville} · {listing.quartier}
          </div>
          <h3 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 18, color: '#0C1A2E', marginBottom: 10,
            lineHeight: 1.3,
          }}>
            {listing.titre || listing.name}
          </h3>
          <div style={{
            display: 'flex', gap: 14, marginBottom: 14,
            fontSize: 12, color: '#64748B',
          }}>
            <span>📐 {listing.surface_min}–{listing.surface_max} m²</span>
            <span>🏠 {listing.nb_logements} logements</span>
          </div>
          <div style={{
            paddingTop: 14, borderTop: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>
              {listing.agences_count || 1} agence(s) mandatée(s)
            </div>
            <button style={{
              background: hovered ? '#C9A84C' : '#1A3A5C',
              color: hovered ? '#0A1628' : 'white',
              border: 'none', borderRadius: 20,
              padding: '7px 16px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all .2s',
            }}>
              Voir →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 5 — PAGE ANALYSE IA (/outils/analyse-ia) — refonte complète

```jsx
// Trouve le composant AnalyseIA / Dashboard Investisseur
// Conserve toute la logique, améliore uniquement le design

export function AnalyseIAPage() {
  useScrollReveal()
  // ... state existant conservé ...

  return (
    <div style={{ paddingTop: 60, minHeight: '100vh', background: '#F8F7F4' }}>

      {/* ── HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0A1628 0%, #1A3A5C 100%)',
        padding: '64px 40px 48px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow ambiant */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600, height: 300,
          background: 'radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
          {/* Badge existant — améliore son style */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 24, padding: '5px 14px',
            marginBottom: 16,
          }}>
            <span style={{ fontSize: 14 }}>⚖️</span>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#C9A84C',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              Agent Shamai IA · Évaluation
            </span>
          </div>

          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(26px, 4vw, 44px)',
            color: 'white', fontWeight: 400, marginBottom: 8,
          }}>
            Dashboard Investisseur
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 24 }}>
            Expert en évaluation immobilière agréé Israël (שמאי מקרקעין). Estimation indicative.
          </p>

          {/* Onglets Analyse structurée / Conversation Shamai — redesign */}
          <div style={{ display: 'flex', gap: 4 }}>
            {['Analyse structurée', 'Conversation Shamai'].map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 50,
                  border: 'none',
                  background: activeTab === i
                    ? 'linear-gradient(135deg, #C9A84C, #E8C96A)'
                    : 'rgba(255,255,255,0.08)',
                  color: activeTab === i ? '#0A1628' : 'rgba(255,255,255,0.65)',
                  fontSize: 13, fontWeight: activeTab === i ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all .2s',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {i === 0 ? '📊 ' : '💬 '}{tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '32px 40px',
        display: 'grid',
        gridTemplateColumns: '1fr 1.4fr',
        gap: 28,
        alignItems: 'start',
      }}>

        {/* ── COLONNE GAUCHE : Formulaire ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Card champs rapides */}
          <div style={{
            background: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: 16, padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: '#1A3A5C',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 16,
            }}>
              Champs rapides <span style={{ color: '#94A3B8', fontWeight: 400 }}>(optionnel)</span>
            </div>

            {/* Grille 2 colonnes des champs existants */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Conserver les inputs existants — applique juste ce style sur chaque input : */}
              {/* style={{ border:'1.5px solid #E2E8F0', borderRadius:10, padding:'9px 12px',
                          fontSize:13, outline:'none', width:'100%',
                          transition:'border-color .2s', background:'#FAFCFA' }}
                 onFocus/onBlur → borderColor #1A3A5C / #E2E8F0 */}
            </div>

            {/* Bouton "Pré-remplir" */}
            <button style={{
              width: '100%', marginTop: 12,
              background: '#F8F7F4', color: '#1A3A5C',
              border: '1px solid #E2E8F0', borderRadius: 10,
              padding: '9px', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', transition: 'all .2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#1A3A5C'
              e.currentTarget.style.color = 'white'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#F8F7F4'
              e.currentTarget.style.color = '#1A3A5C'
            }}>
              ↗ Pré-remplir depuis les champs
            </button>
          </div>

          {/* Card textarea annonce */}
          <div style={{
            background: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: 16, padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: '#1A3A5C',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              L'annonce à analyser
            </div>
            <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 12 }}>
              Copiez-collez le texte complet de l'annonce.
            </p>

            {/* Textarea existant — applique ce style : */}
            {/* style={{ width:'100%', border:'1.5px solid #E2E8F0', borderRadius:10,
                        padding:'12px', fontSize:13, minHeight:160, resize:'vertical',
                        outline:'none', transition:'border-color .2s', background:'#FAFCFA',
                        fontFamily:'inherit', lineHeight:1.6 }}
               onFocus → borderColor #1A3A5C */}

            {/* Bouton Analyser — full redesign */}
            <button style={{
              width: '100%', marginTop: 14,
              background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
              color: '#0A1628', border: 'none', borderRadius: 12,
              padding: '13px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(201,168,76,0.38)',
              transition: 'all .25s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 10px 28px rgba(201,168,76,0.48)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(201,168,76,0.38)'
            }}>
              ⚡ Analyser le bien
            </button>
          </div>
        </div>

        {/* ── COLONNE DROITE : Résultats ── */}
        <div>
          {/* État vide — améliore l'état "Aucune analyse pour le moment" */}
          {!hasResult && (
            <div style={{
              background: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: 16, padding: '60px 32px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              minHeight: 400,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Cercle animé */}
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(26,58,92,0.08))',
                border: '1.5px solid rgba(201,168,76,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20, fontSize: 32,
                animation: 'float-particle 3s ease-in-out infinite',
              }}>
                ⚖️
              </div>
              <h3 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 22, color: '#1A3A5C', marginBottom: 8,
              }}>
                Aucune analyse pour le moment
              </h3>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, maxWidth: 320 }}>
                Collez une annonce et lancez l'analyse pour voir les résultats ici.
              </p>
            </div>
          )}

          {/* Résultats — quand il y en a — applique ce style sur le conteneur : */}
          {hasResult && (
            <div style={{
              background: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            }}>
              {/* Header résultat avec score */}
              <div style={{
                background: 'linear-gradient(135deg, #0A1628, #1A3A5C)',
                padding: '20px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Score investissement
                  </div>
                  <div style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 36, color: '#C9A84C',
                  }}>
                    {score}/100
                  </div>
                </div>
                <div style={{
                  padding: '8px 16px', borderRadius: 20,
                  background: recommendation === 'ACHETER' ? 'rgba(15,110,86,0.3)'
                    : recommendation === 'PRUDENCE' ? 'rgba(186,119,23,0.3)'
                    : 'rgba(139,26,26,0.3)',
                  color: recommendation === 'ACHETER' ? '#52B788'
                    : recommendation === 'PRUDENCE' ? '#F0C040'
                    : '#FCA5A5',
                  fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
                }}>
                  {recommendation}
                </div>
              </div>
              {/* Contenu résultat existant — conserver, ajouter padding */}
              <div style={{ padding: '24px' }}>
                {/* ... résultats existants ... */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## 6 — FOOTER — refonte complète

Trouve le composant Footer. Remplace entièrement par :

```jsx
function Footer() {
  return (
    <footer style={{ background: '#0A1628' }}>

      {/* Ligne gold */}
      <div style={{
        height: 1, margin: '0 48px',
        background: 'linear-gradient(to right, transparent, #C9A84C, transparent)',
      }} />

      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '48px 40px 28px',
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: 48,
      }}>

        {/* Brand */}
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            {/* Logo existant conservé */}
            <span style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 18, color: 'white',
            }}>
              Nadlan<span style={{ color: '#C9A84C' }}>Connect</span>
            </span>
          </div>
          <p style={{
            fontSize: 13, color: 'rgba(255,255,255,0.4)',
            lineHeight: 1.7, marginBottom: 20, maxWidth: 280,
          }}>
            La plateforme premium pour l'immobilier israélien.
            Connectez-vous avec les meilleurs agents et promoteurs.
          </p>
          {/* Réseaux sociaux */}
          <div style={{ display:'flex', gap:8 }}>
            {[
              { icon: '💼', label: 'LinkedIn', href: '#' },
              { icon: '📸', label: 'Instagram', href: '#' },
              { icon: '📧', label: 'Email', href: 'mailto:contact@nadlanconnect.co.il' },
            ].map(s => (
              <a key={s.label} href={s.href} title={s.label} style={{
                width: 36, height: 36, borderRadius: 9,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 15,
                textDecoration: 'none',
                transition: 'border-color .2s, background .2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'
                e.currentTarget.style.background = 'rgba(201,168,76,0.08)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              }}
              >{s.icon}</a>
            ))}
          </div>
        </div>

        {/* Liens rapides */}
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#C9A84C',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: 16,
          }}>
            Navigation
          </div>
          {[
            { label: 'Accueil', href: '/' },
            { label: 'Propriétés', href: '/listings' },
            { label: 'Analyse IA', href: '/outils/analyse-ia' },
            { label: 'Connexion', href: '/auth/login' },
            { label: 'S\'inscrire', href: '/auth/register' },
          ].map(l => (
            <a key={l.href} href={l.href} style={{
              display: 'block', fontSize: 13,
              color: 'rgba(255,255,255,0.4)',
              textDecoration: 'none', marginBottom: 8,
              transition: 'color .2s',
            }}
            onMouseEnter={e => e.target.style.color = '#C9A84C'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
            >{l.label}</a>
          ))}
        </div>

        {/* Contact */}
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#C9A84C',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: 16,
          }}>
            Contact
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
            📍 Tel Aviv, Israël
          </div>
          <a href="mailto:contact@nadlanconnect.co.il" style={{
            fontSize: 13, color: 'rgba(255,255,255,0.4)',
            textDecoration: 'none', display: 'block', marginBottom: 8,
            transition: 'color .2s',
          }}
          onMouseEnter={e => e.target.style.color = '#C9A84C'}
          onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
          >
            ✉️ contact@nadlanconnect.co.il
          </a>
          {/* Lien simulateur */}
          <a href="https://simmoisrael.com" target="_blank" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginTop: 16,
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.2)',
            color: '#C9A84C', borderRadius: 8,
            padding: '7px 14px', fontSize: 12, fontWeight: 600,
            textDecoration: 'none', transition: 'all .2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(201,168,76,0.18)'
            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(201,168,76,0.1)'
            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'
          }}
          >
            🏗️ Simulateur →
          </a>
        </div>
      </div>

      {/* Copyright */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '16px 40px', textAlign: 'center',
      }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>
          © 2026 NadlanConnect · Estimations indicatives, non contractuelles.
        </p>
      </div>

    </footer>
  )
}
```

---

## 7 — PAGE 404 — redesign

Trouve le composant 404 (probablement NotFound.jsx ou dans le router).
Remplace par :

```jsx
export function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0A1628',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: 24,
      paddingTop: 60,
    }}>
      <div>
        {/* Numéro 404 stylisé */}
        <div style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 'clamp(80px, 15vw, 160px)',
          color: 'rgba(201,168,76,0.15)',
          lineHeight: 1, marginBottom: -20,
          fontWeight: 400,
        }}>404</div>

        <div style={{ fontSize: 40, marginBottom: 16 }}>🏗️</div>

        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 'clamp(22px, 4vw, 36px)',
          color: 'white', marginBottom: 12, fontWeight: 400,
        }}>
          Page introuvable
        </h1>
        <p style={{
          fontSize: 15, color: 'rgba(255,255,255,0.5)',
          lineHeight: 1.6, marginBottom: 32,
          maxWidth: 400, margin: '0 auto 32px',
        }}>
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/" style={{
            background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
            color: '#0A1628', borderRadius: 50,
            padding: '12px 28px', fontSize: 14, fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 6px 20px rgba(201,168,76,0.35)',
          }}>
            Retour à l'accueil
          </a>
          <a href="/listings" style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
            color: 'white', borderRadius: 50,
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '12px 28px', fontSize: 14, fontWeight: 500,
            textDecoration: 'none',
          }}>
            Voir les propriétés
          </a>
        </div>
      </div>
    </div>
  )
}
```

---

## 8 — COMPOSANTS PARTAGÉS — boutons, inputs, badges

```jsx
// Bouton primaire — bleu marine
const BtnPrimary = ({ children, onClick, style = {} }) => (
  <button onClick={onClick} style={{
    background: '#1A3A5C', color: 'white', border: 'none',
    borderRadius: 10, padding: '10px 22px',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    transition: 'all .2s',
    boxShadow: '0 4px 12px rgba(26,58,92,0.25)', ...style,
  }}
  onMouseEnter={e => e.currentTarget.style.background = '#2A5080'}
  onMouseLeave={e => e.currentTarget.style.background = '#1A3A5C'}
  >{children}</button>
)

// Bouton gold — CTA principal
const BtnGold = ({ children, href, onClick, style = {} }) => {
  const s = {
    background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
    color: '#0A1628', border: 'none', borderRadius: 50,
    padding: '11px 28px', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', display: 'inline-block', textDecoration: 'none',
    boxShadow: '0 6px 18px rgba(201,168,76,0.38)',
    transition: 'all .25s', ...style,
  }
  if (href) return <a href={href} style={s}>{children}</a>
  return <button onClick={onClick} style={s}
    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 10px 28px rgba(201,168,76,0.5)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 6px 18px rgba(201,168,76,0.38)'}
  >{children}</button>
}

// Input standard
const Input = ({ placeholder, value, onChange, style = {} }) => (
  <input
    placeholder={placeholder} value={value} onChange={onChange}
    style={{
      width: '100%', border: '1.5px solid #E2E8F0',
      borderRadius: 10, padding: '9px 12px',
      fontSize: 13, color: '#0C1A2E', background: '#FAFCFA',
      outline: 'none', transition: 'border-color .2s', ...style,
    }}
    onFocus={e => e.target.style.borderColor = '#1A3A5C'}
    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
  />
)

// Badge score investissement
const ScoreBadge = ({ score }) => {
  const color = score >= 75 ? '#0F6E56' : score >= 50 ? '#BA7517' : '#8B1A1A'
  const bg    = score >= 75 ? '#E6F4EF' : score >= 50 ? '#FEF8EC' : '#FCEBEB'
  return (
    <span style={{
      background: bg, color,
      fontSize: 11, fontWeight: 700,
      padding: '3px 9px', borderRadius: 6,
      border: `1px solid ${color}30`,
    }}>★ {score}/100</span>
  )
}
```

---

## RÉCAPITULATIF — pages et composants touchés

| Page / Composant | Modifications |
|---|---|
| Navbar | Glassmorphism scroll, logo typographique, liens hover gold underline, bouton Connexion gradient |
| Home (`/`) | useScrollReveal sur toutes les sections, CountUp sur les stats, cartes process redesignées, état vide programmes amélioré, CTA overlay plus élégant |
| Propriétés (`/listings`) | Header bleu marine premium, filtres redesignés sticky, grille cartes avec photos Unsplash, hover zoom image + border gold, état vide avec CTA |
| Analyse IA (`/outils/analyse-ia`) | Header premium avec badge, onglets pill gold, formulaire en cards blanches, textarea et inputs avec focus states, bouton analyser gradient, état vide animé, résultats avec score mis en valeur |
| Footer | Fond `#0A1628`, ligne gold, 3 colonnes, réseaux sociaux, lien simulateur, hover gold |
| 404 | Full page sombre, 404 en filigrane, CTAs gold + glassmorphism |
| Composants partagés | BtnPrimary, BtnGold, Input, ScoreBadge — à utiliser partout |
