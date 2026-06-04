# Prompt Replit — Refonte complète design NadlanConnect
# Design moderne, animations, vidéo, sophistiqué

## Objectif

Refonte totale de la page d'accueil avec un design 2025 premium :
- Éléments animés (CSS + Framer Motion ou CSS animations)
- Vidéo de fond dans le hero
- Photos immobilières réelles via Unsplash
- Sections qui apparaissent au scroll (scroll-triggered animations)
- Typographie plus affirmée
- Effets visuels modernes (glassmorphism, gradients, particles)

---

## INSTALL

```bash
npm install framer-motion
```

---

## SECTION 1 — VARIABLES CSS GLOBALES

Dans `src/index.css`, remplace tout par :

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

:root {
  --navy:      #0A1628;
  --blue:      #1A3A5C;
  --blue2:     #2A5080;
  --gold:      #C9A84C;
  --gold2:     #E8C96A;
  --white:     #FFFFFF;
  --bg:        #F8F7F4;
  --text:      #0A1628;
  --muted:     #64748B;
  --border:    rgba(255,255,255,0.1);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background: var(--bg);
  color: var(--text);
  overflow-x: hidden;
}

h1, h2, h3, .serif {
  font-family: 'DM Serif Display', Georgia, serif;
}

/* Scroll reveal — état initial */
.reveal {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
.reveal-left {
  opacity: 0;
  transform: translateX(-40px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.reveal-left.visible {
  opacity: 1;
  transform: translateX(0);
}
.reveal-right {
  opacity: 0;
  transform: translateX(40px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.reveal-right.visible {
  opacity: 1;
  transform: translateX(0);
}
```

---

## SECTION 2 — HOOK useScrollReveal

Crée `src/hooks/useScrollReveal.js` :

```javascript
import { useEffect } from 'react'

export function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.15 }
    )
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
      .forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}
```

---

## SECTION 3 — NAVBAR moderne

```jsx
// src/components/Navbar.jsx
import { useState, useEffect } from 'react'

export function Navbar({ lang, setLang }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 1000,
      padding: '0 32px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      // Glassmorphism au scroll
      background: scrolled
        ? 'rgba(10, 22, 40, 0.92)'
        : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(201, 168, 76, 0.2)' : 'none',
      transition: 'all 0.4s ease',
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* SVG logo ici */}
        <span style={{
          fontFamily: 'DM Serif Display, serif',
          fontSize: 22,
          color: 'white',
          letterSpacing: '-0.02em',
        }}>
          Nadlan<span style={{ color: '#C9A84C' }}>Connect</span>
        </span>
      </div>

      {/* Nav links — desktop */}
      <div style={{
        display: 'flex', gap: 32, alignItems: 'center'
      }} className="nav-desktop">
        {['Programmes', 'Agences', 'Tarifs', 'À propos'].map(link => (
          <a key={link} href="#" style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.target.style.color = '#C9A84C'}
          onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.75)'}
          >{link}</a>
        ))}
      </div>

      {/* Droite */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {/* Langues */}
        <div style={{ display: 'flex', gap: 2 }}>
          {['FR', 'EN', 'עב'].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              background: lang === l ? '#C9A84C' : 'transparent',
              color: lang === l ? '#0A1628' : 'rgba(255,255,255,0.6)',
              border: 'none',
              borderRadius: 6,
              padding: '4px 9px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}>{l}</button>
          ))}
        </div>

        {/* CTA */}
        <a href="/auth/register" style={{
          background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
          color: '#0A1628',
          padding: '8px 20px',
          borderRadius: 24,
          fontSize: 13,
          fontWeight: 700,
          textDecoration: 'none',
          boxShadow: '0 4px 15px rgba(201,168,76,0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          e.target.style.transform = 'translateY(-1px)'
          e.target.style.boxShadow = '0 8px 25px rgba(201,168,76,0.5)'
        }}
        onMouseLeave={e => {
          e.target.style.transform = 'translateY(0)'
          e.target.style.boxShadow = '0 4px 15px rgba(201,168,76,0.4)'
        }}
        >
          S'inscrire
        </a>
      </div>
    </nav>
  )
}
```

---

## SECTION 4 — HERO avec vidéo de fond

```jsx
// Dans src/pages/Landing.jsx

function HeroSection() {
  return (
    <section style={{
      position: 'relative',
      height: '100vh',
      minHeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>

      {/* Vidéo de fond — Tel Aviv skyline */}
      <video
        autoPlay muted loop playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      >
        {/* Vidéo Pexels libre de droits — skyline Tel Aviv / ville israélienne */}
        <source
          src="https://www.pexels.com/download/video/3571264/"
          type="video/mp4"
        />
        {/* Fallback image si vidéo ne charge pas */}
      </video>

      {/* Si la vidéo Pexels ne charge pas, utilise cette image Unsplash comme fallback */}
      {/* en background-image sur la section */}

      {/* Overlay gradient sombre */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(10,22,40,0.6) 0%, rgba(10,22,40,0.75) 50%, rgba(10,22,40,0.9) 100%)',
        zIndex: 1,
      }} />

      {/* Particules flottantes (étoiles/points) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
            background: '#C9A84C',
            borderRadius: '50%',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            opacity: Math.random() * 0.6 + 0.2,
            animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: Math.random() * 3 + 's',
          }} />
        ))}
      </div>

      {/* Contenu hero */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        textAlign: 'center',
        padding: '0 24px',
        maxWidth: 860,
      }}>

        {/* Badge animé */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(201,168,76,0.15)',
          border: '1px solid rgba(201,168,76,0.4)',
          borderRadius: 24,
          padding: '6px 16px',
          marginBottom: 24,
          animation: 'fadeInDown 0.8s ease forwards',
        }}>
          <span style={{
            width: 6, height: 6,
            background: '#C9A84C',
            borderRadius: '50%',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#C9A84C',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            🇮🇱 Plateforme immobilière israélienne
          </span>
        </div>

        {/* Titre principal */}
        <h1 style={{
          fontFamily: 'DM Serif Display, serif',
          fontSize: 'clamp(36px, 7vw, 72px)',
          fontWeight: 400,
          color: 'white',
          lineHeight: 1.1,
          marginBottom: 20,
          animation: 'fadeInUp 1s ease 0.2s forwards',
          opacity: 0,
        }}>
          Promoteurs, agences,<br />
          <span style={{
            background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            connectez-vous.
          </span>
        </h1>

        {/* Sous-titre */}
        <p style={{
          fontSize: 'clamp(15px, 2vw, 18px)',
          color: 'rgba(255,255,255,0.7)',
          lineHeight: 1.7,
          marginBottom: 36,
          maxWidth: 560,
          margin: '0 auto 36px',
          animation: 'fadeInUp 1s ease 0.4s forwards',
          opacity: 0,
        }}>
          La première plateforme qui relie promoteurs et agences
          pour vendre des programmes neufs en Israël.
          Mandats, leads, analytics — tout en un.
        </p>

        {/* CTAs */}
        <div style={{
          display: 'flex',
          gap: 14,
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: 60,
          animation: 'fadeInUp 1s ease 0.6s forwards',
          opacity: 0,
        }}>
          <a href="/auth/register?role=promoteur" style={{
            background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
            color: '#0A1628',
            padding: '14px 32px',
            borderRadius: 50,
            fontSize: 15,
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 8px 30px rgba(201,168,76,0.45)',
            transition: 'all 0.3s ease',
          }}>
            Je suis promoteur →
          </a>
          <a href="/auth/register?role=agence" style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            padding: '14px 32px',
            borderRadius: 50,
            fontSize: 15,
            fontWeight: 600,
            textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.3)',
            transition: 'all 0.3s ease',
          }}>
            Je suis une agence →
          </a>
        </div>

        {/* Stats animées */}
        <div style={{
          display: 'flex',
          gap: 48,
          justifyContent: 'center',
          animation: 'fadeInUp 1s ease 0.8s forwards',
          opacity: 0,
        }}>
          {[
            { val: '50K+', lbl: 'transactions Nadlan' },
            { val: '12', lbl: 'villes couvertes' },
            { val: '98%', lbl: 'leads qualifiés' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'DM Serif Display, serif',
                fontSize: 32,
                color: '#C9A84C',
                lineHeight: 1,
              }}>{s.val}</div>
              <div style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                marginTop: 4,
                letterSpacing: '0.05em',
              }}>{s.lbl}</div>
            </div>
          ))}
        </div>

      </div>

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        animation: 'bounce 2s infinite',
      }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
          DÉCOUVRIR
        </span>
        <div style={{
          width: 1, height: 40,
          background: 'linear-gradient(to bottom, rgba(201,168,76,0.6), transparent)',
        }} />
      </div>

    </section>
  )
}
```

---

## SECTION 5 — CSS ANIMATIONS globales

Dans `src/index.css`, ajoute :

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.8); }
}

@keyframes bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50%       { transform: translateX(-50%) translateY(6px); }
}

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-60px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes countUp {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

---

## SECTION 6 — Section "Comment ça marche" animée

```jsx
function HowItWorksSection() {
  useScrollReveal() // déclenche les animations au scroll

  const steps = [
    {
      icon: '🏗️',
      title: 'Le promoteur publie',
      desc: 'Créez votre programme en 10 minutes. Photos, plans, prix, statut — tout en un.',
      color: '#1A3A5C',
    },
    {
      icon: '🤝',
      title: "L'agence obtient son mandat",
      desc: "Candidature en 1 clic. Le promoteur valide. Vous accédez aux documents complets.",
      color: '#C9A84C',
    },
    {
      icon: '🏡',
      title: "L'acheteur trouve son bien",
      desc: "Catalogue filtrable, score d'investissement /100, contact direct avec l'agence mandatée.",
      color: '#0F6E56',
    },
  ]

  return (
    <section style={{
      padding: '120px 24px',
      background: '#0A1628',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Ligne décorative en fond */}
      <div style={{
        position: 'absolute',
        top: '50%', left: 0, right: 0,
        height: 1,
        background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.3), transparent)',
      }} />

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header section */}
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 80 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: '#C9A84C',
            letterSpacing: '0.15em', textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            Le process
          </div>
          <h2 style={{
            fontFamily: 'DM Serif Display, serif',
            fontSize: 'clamp(28px, 4vw, 48px)',
            color: 'white',
            lineHeight: 1.2,
          }}>
            3 étapes pour vendre plus vite
          </h2>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
        }}>
          {steps.map((step, i) => (
            <div
              key={i}
              className="reveal"
              style={{
                transitionDelay: `${i * 0.15}s`,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: 36,
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s, border-color 0.3s',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px)'
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              }}
            >
              {/* Numéro en fond */}
              <div style={{
                position: 'absolute',
                top: 16, right: 20,
                fontFamily: 'DM Serif Display, serif',
                fontSize: 80,
                color: 'rgba(255,255,255,0.04)',
                lineHeight: 1,
                pointerEvents: 'none',
              }}>
                {String(i + 1).padStart(2, '0')}
              </div>

              <div style={{ fontSize: 40, marginBottom: 20 }}>{step.icon}</div>
              <h3 style={{
                fontFamily: 'DM Serif Display, serif',
                fontSize: 22,
                color: 'white',
                marginBottom: 12,
              }}>
                {step.title}
              </h3>
              <p style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.7,
              }}>
                {step.desc}
              </p>

              {/* Accent line */}
              <div style={{
                position: 'absolute',
                bottom: 0, left: 0,
                width: '40%', height: 2,
                background: step.color,
                borderRadius: '0 2px 0 0',
              }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

---

## SECTION 7 — Programmes en vedette avec photos Unsplash

```jsx
function ProgrammesSection({ programmes }) {
  return (
    <section style={{
      padding: '120px 24px',
      background: '#F8F7F4',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div className="reveal" style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 56,
          flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
              Sélection du moment
            </div>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(24px, 4vw, 42px)', color: '#0A1628' }}>
              Programmes à la une
            </h2>
          </div>
          <a href="/programmes" style={{ color: '#1A3A5C', fontSize: 14, fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid #C9A84C', paddingBottom: 2 }}>
            Voir tous les programmes →
          </a>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 28,
        }}>
          {(programmes || DEMO_PROGRAMMES).map((prog, i) => (
            <div
              key={prog.id || i}
              className="reveal"
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <ProgrammeCard prog={prog} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Carte programme avec photo Unsplash
function ProgrammeCard({ prog }) {
  const [hovered, setHovered] = useState(false)

  // Photos Unsplash par ville
  const photos = {
    'Tel Aviv': 'https://images.unsplash.com/photo-1574958269340-fa927503f3dd?w=600&q=80',
    'Herzliya': 'https://images.unsplash.com/photo-1600607686527-6fb886090705?w=600&q=80',
    'Jerusalem': 'https://images.unsplash.com/photo-1562979314-bee7453e911c?w=600&q=80',
    'Netanya': 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&q=80',
    'default': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
  }

  const photo = prog.images?.[0] || photos[prog.ville] || photos.default

  const scoreColor = prog.score >= 75 ? '#0F6E56'
    : prog.score >= 50 ? '#BA7517' : '#993C1D'

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: hovered
          ? '0 20px 60px rgba(26,58,92,0.18)'
          : '0 2px 12px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.3s, transform 0.3s',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div style={{ position: 'relative', overflow: 'hidden', height: 220 }}>
        <img
          src={photo}
          alt={prog.titre}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
          }}
        />
        {/* Overlay gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(10,22,40,0.6) 0%, transparent 60%)',
        }} />
        {/* Badges */}
        <div style={{
          position: 'absolute', top: 14, left: 14,
          display: 'flex', gap: 6,
        }}>
          <span style={{
            background: 'rgba(10,22,40,0.75)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            fontSize: 11, fontWeight: 600,
            padding: '4px 10px', borderRadius: 20,
          }}>
            {prog.statut === 'en_construction' ? '🏗 En construction'
              : prog.statut === 'livraison_proche' ? '🔑 Livraison proche'
              : '✅ Livré'}
          </span>
        </div>
        {/* Score */}
        <div style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(10,22,40,0.75)',
          backdropFilter: 'blur(8px)',
          color: scoreColor,
          fontSize: 12, fontWeight: 700,
          padding: '4px 10px', borderRadius: 20,
          border: `1px solid ${scoreColor}40`,
        }}>
          ★ {prog.score}/100
        </div>
      </div>

      {/* Contenu */}
      <div style={{ padding: '20px 20px 18px' }}>
        <div style={{ fontSize: 12, color: '#C9A84C', fontWeight: 600, marginBottom: 6 }}>
          📍 {prog.ville} · {prog.quartier}
        </div>
        <h3 style={{
          fontFamily: 'DM Serif Display, serif',
          fontSize: 19,
          color: '#0A1628',
          marginBottom: 10,
          lineHeight: 1.3,
        }}>
          {prog.titre}
        </h3>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: '#64748B' }}>
            📐 {prog.surface_min}–{prog.surface_max} m²
          </span>
          <span style={{ fontSize: 12, color: '#64748B' }}>
            🏠 {prog.nb_logements} logements
          </span>
        </div>

        {/* Prix */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 14,
          borderTop: '1px solid #F1F5F9',
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>À partir de</div>
            <div style={{
              fontFamily: 'DM Serif Display, serif',
              fontSize: 22,
              color: '#0A1628',
              fontWeight: 400,
            }}>
              {(prog.prix_min / 1000000).toFixed(1)}M ₪
            </div>
          </div>
          <button style={{
            background: '#1A3A5C',
            color: 'white',
            border: 'none',
            borderRadius: 24,
            padding: '9px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.target.style.background = '#C9A84C'}
          onMouseLeave={e => e.target.style.background = '#1A3A5C'}
          >
            Voir →
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## SECTION 8 — Section chiffres animés (counter)

```jsx
function StatsSection() {
  const [counted, setCounted] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setCounted(true) },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const stats = [
    { val: 50000, suffix: '+', label: 'Transactions Nadlan', prefix: '' },
    { val: 12,    suffix: '',  label: 'Villes couvertes',    prefix: '' },
    { val: 3.2,   suffix: 'Mds ₪', label: 'Volume analysé', prefix: '' },
    { val: 98,    suffix: '%', label: 'Leads qualifiés',     prefix: '' },
  ]

  return (
    <section ref={ref} style={{
      padding: '100px 24px',
      background: 'linear-gradient(135deg, #0A1628 0%, #1A3A5C 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow effect */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 900, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 48,
        position: 'relative',
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'DM Serif Display, serif',
              fontSize: 48,
              color: '#C9A84C',
              lineHeight: 1,
              marginBottom: 8,
            }}>
              {counted ? (
                <CountUp end={s.val} suffix={s.suffix} />
              ) : '0'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// Composant simple CountUp
function CountUp({ end, suffix }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const duration = 2000
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(eased * end)
      if (progress >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [end])
  return <>{end < 100 ? count.toFixed(1) : Math.round(count)}{suffix}</>
}
```

---

## SECTION 9 — Section Tarifs avec toggle mensuel/annuel

```jsx
function PricingSection() {
  const [billing, setBilling] = useState('mensuel')
  const [role, setRole] = useState('agence')

  return (
    <section style={{ padding: '120px 24px', background: '#F8F7F4' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 42, color: '#0A1628', marginBottom: 12 }}>
            Des tarifs transparents
          </h2>
          <p style={{ color: '#64748B', fontSize: 16 }}>30 jours gratuits — aucune carte requise</p>
        </div>

        {/* Toggle Agence / Promoteur */}
        <div className="reveal" style={{ display: 'flex', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
          <div style={{
            display: 'flex',
            background: 'white',
            borderRadius: 50,
            padding: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            {['agence', 'promoteur'].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{
                padding: '8px 24px',
                borderRadius: 50,
                border: 'none',
                background: role === r ? '#1A3A5C' : 'transparent',
                color: role === r ? 'white' : '#64748B',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize',
              }}>
                {r === 'agence' ? '🤝 Agence' : '🏗️ Promoteur'}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="reveal" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
        }}>
          {(role === 'agence' ? PLANS_AGENCE : PLANS_PROMOTEUR).map((plan, i) => (
            <div key={i} style={{
              background: plan.highlight ? '#1A3A5C' : 'white',
              borderRadius: 20,
              padding: 32,
              border: plan.highlight ? 'none' : '1px solid #E2E8F0',
              position: 'relative',
              overflow: 'hidden',
              transform: plan.highlight ? 'scale(1.02)' : 'scale(1)',
              boxShadow: plan.highlight ? '0 20px 60px rgba(26,58,92,0.3)' : 'none',
            }}>
              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  background: '#C9A84C', color: '#0A1628',
                  fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                }}>
                  POPULAIRE
                </div>
              )}
              <div style={{ fontSize: 16, fontWeight: 700, color: plan.highlight ? 'white' : '#0A1628', marginBottom: 8 }}>
                {plan.name}
              </div>
              <div style={{ marginBottom: 24 }}>
                <span style={{
                  fontFamily: 'DM Serif Display, serif',
                  fontSize: 40,
                  color: plan.highlight ? '#C9A84C' : '#0A1628',
                }}>
                  {plan.price}₪
                </span>
                <span style={{ fontSize: 13, color: plan.highlight ? 'rgba(255,255,255,0.5)' : '#94A3B8' }}>
                  /mois
                </span>
              </div>
              <ul style={{ listStyle: 'none', marginBottom: 28 }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{
                    fontSize: 13,
                    color: plan.highlight ? 'rgba(255,255,255,0.75)' : '#475569',
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    marginBottom: 10,
                  }}>
                    <span style={{ color: '#C9A84C', flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button style={{
                width: '100%',
                background: plan.highlight
                  ? 'linear-gradient(135deg, #C9A84C, #E8C96A)'
                  : '#1A3A5C',
                color: plan.highlight ? '#0A1628' : 'white',
                border: 'none', borderRadius: 50,
                padding: '12px', fontSize: 14,
                fontWeight: 700, cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}>
                Commencer gratuitement →
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const PLANS_AGENCE = [
  { name: 'Starter', price: 490, highlight: false,
    features: ['5 mandats simultanés', '20 leads/mois', 'Profil vérifié', 'Badge Agence partenaire'] },
  { name: 'Pro', price: 990, highlight: true,
    features: ['Mandats illimités', 'Leads illimités', 'Mise en avant', 'Accès off-market', 'Support dédié'] },
]
const PLANS_PROMOTEUR = [
  { name: 'Starter', price: 990, highlight: false,
    features: ['1 programme actif', '3 agences max', 'Dashboard leads', 'Visibilité standard'] },
  { name: 'Pro', price: 2490, highlight: true,
    features: ['Programmes illimités', 'Agences illimitées', 'Programme vedette', 'Analytics complets', 'Manager dédié'] },
]
```

---

## SECTION 10 — Assemblage final de Landing.jsx

```jsx
// src/pages/Landing.jsx
import { useScrollReveal } from '../hooks/useScrollReveal'
import { Navbar } from '../components/Navbar'

export function Landing() {
  useScrollReveal()

  return (
    <div>
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <ProgrammesSection />
      <StatsSection />
      <PricingSection />
      <Footer />
    </div>
  )
}
```

---

## RÉCAPITULATIF DES EFFETS VISUELS AJOUTÉS

| Effet | Où | Comment |
|---|---|---|
| Vidéo de fond | Hero | `<video autoPlay muted loop>` |
| Particules flottantes | Hero | CSS `@keyframes float` sur points aléatoires |
| Navbar glassmorphism | Header au scroll | `backdrop-filter: blur(20px)` conditionnel |
| Texte gradient or | Titre hero | `background-clip: text` |
| Scroll reveal | Toutes sections | IntersectionObserver + classes CSS |
| Hover lift cards | Cartes programmes | `translateY(-6px)` + box-shadow |
| Zoom image au hover | Photos programmes | `scale(1.05)` sur `<img>` |
| Compteurs animés | Section stats | CountUp avec requestAnimationFrame |
| Toggle plans | Section tarifs | State React agence/promoteur |
| Scroll indicator | Bas du hero | `@keyframes bounce` |
