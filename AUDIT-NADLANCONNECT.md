# Rapport de vérification pré-lancement — NadlanConnect

_Date : 2026-06-24 · Périmètre : code source du dépôt `nadlan-connect-isr` (frontend `artifacts/nadlan-connect` + API `artifacts/api-server`)._

## Portée et limites de cette vérification
- ✅ **Vérifiable ici** : tout ce qui se déduit du **code source** (liens, routes, 404, balises SEO, sitemap/robots, pages légales, formulaires, validation, sécurité applicative, alt, placeholders, responsive, favicon…).
- ⏳ **Non vérifiable ici (bloqué par la politique réseau)** : l'accès sortant vers `nadlanconnect.com`, `nadlanconnect.fr` et `simmoisrael.com` est refusé (HTTP 403 au niveau du proxy). Donc : handshake SSL réel, réponse 404 réelle, redirections www / http→https, vitesse en conditions réelles, présence d'Analytics/Search Console **en production**, et tests sur appareils réels → **à confirmer en ligne**.
- ❌ **Simmo (`simmoisrael.com`)** : application Replit **séparée**, non présente dans ce dépôt et injoignable ici. Non auditée. Voir la section dédiée.

Légende : ✅ OK · 🟡 à améliorer · 🔴 bloquant avant lancement · ⏳ à vérifier en ligne/infra.

---

## 1. Technique

| Item | Statut | Détail / preuve | Correctif |
|---|---|---|---|
| Liens internes | ✅ | Tous les `<Link href>` pointent vers des routes déclarées (`src/App.tsx:47-95`). Aucun lien mort. | — |
| Liens externes | ✅ | `simmoisrael.com` en `target="_blank" rel="noopener noreferrer"` (`app-layout.tsx:24,95`). | — |
| Liens placeholder | 🟡 | LinkedIn & Instagram = `href="#"` (`app-layout.tsx:50-51`). | Mettre les vraies URL ou masquer les icônes. |
| Page 404 | ✅ | Route catch-all `<Route component={NotFound}>` (`App.tsx:95`) → `pages/not-found.tsx` (404 personnalisée, i18n, CTA). | — |
| Responsive | ✅ | Tailwind `sm/md/lg/xl`, menu mobile (`Sheet`), support RTL. Viewport présent (`index.html:5`). | — |
| Accessibilité zoom | 🟡 | `viewport … maximum-scale=1` bloque le pinch-zoom (`index.html:5`). | Retirer `maximum-scale=1`. |
| Compatibilité navigateurs | ⏳ | Code standard (React/Vite/Tailwind), aucun hack spécifique détecté. | Tester Chrome/Firefox/Safari/Edge en réel. |
| Vitesse / images | 🟡 | `public/hero-bg.png` **1,56 Mo** ; assets source 1,2–1,34 Mo (WebP présent pour les héros ✅). Pas de `srcset/sizes`. Pas de code-splitting des pages lourdes (`analyse-ia`, rapports) — tout est importé en eager (`App.tsx`). | Compresser hero-bg (WebP/AVIF), ajouter `React.lazy()` sur les routes lourdes, `srcset`. |
| Cache / build | ✅ | Vite hash le nom des assets (cache-busting). | Vérifier les en-têtes `Cache-Control` côté hébergeur. |
| Formulaires | ✅ | 7 formulaires validés (zod front+back), messages d'erreur affichés. Détails en §5. | — |
| SSL (HTTPS) | ⏳ | Hébergement Replit fournit HTTPS ; **non vérifiable ici**. | Confirmer cadenas + chaîne de certificat en ligne. |
| Favicon | ✅/🟡 | `favicon.png` câblé (`index.html:32`). Mais `favicon.svg` = **carré orange placeholder** ; pas d'`apple-touch-icon` ni `manifest.json`. | Remplacer/supprimer `favicon.svg`, ajouter apple-touch-icon + manifest PWA. |

---

## 2. Contenu

| Item | Statut | Détail / preuve | Correctif |
|---|---|---|---|
| Orthographe / grammaire | ⏳ | Trilingue FR/EN/HE dans `src/lib/i18n.ts` ; pas d'erreur évidente détectée automatiquement. | Relecture humaine FR/EN/HE recommandée. |
| Cohérence couleurs/polices | ✅ | Tokens centralisés (`src/index.css:76-121`) : navy `#1A3A5C`, or `#C9A84C`, fond `#F8F7F4` ; DM Serif Display + Plus Jakarta Sans. | 🟡 Quelques navy/gold codés en dur dans le CSS markdown — passer aux variables. |
| Images + alt | ✅/🟡 | Quasi toutes les `<img>` ont un `alt` pertinent. 1 cas `alt=""` (`demolition-new.tsx:231`, aperçu de doc). | Ajouter un alt ou `role="presentation"`. |
| Placeholder / lorem | ✅/🟡 | Aucun « lorem ipsum ». Placeholders d'input légitimes (i18n). 🟡 `login.tsx:126` : `placeholder="vous@exemple.com"` codé en dur (non i18n). | Passer le placeholder par i18n. |
| Coordonnées | ✅/🟡 | `contact@nadlanconnect.co.il` cohérent (footer). Localisation « Tel Aviv, Israël ». **Pas de téléphone ni d'adresse postale**. | Ajouter tél + adresse si pertinent (et requis en mentions légales). |

---

## 3. SEO

| Item | Statut | Détail / preuve | Correctif |
|---|---|---|---|
| **Domaine canonique** | 🔴 | Incohérence sur 3 fichiers : canonical `index.html:9` = **.com**, fallback `prerender.ts:25` = **.fr**, `robots.txt:9` → sitemap sur **replit.app**. | Choisir UN domaine de prod et l'aligner partout. |
| title / meta description | ✅ | Uniques par page via `prerender.ts` (home, listings, analyse-ia, cgu, cgv, + listings/programmes dynamiques). | — |
| Structure Hn | 🟡 | 1 `<h1>` par page sauf **double h1** sur `register-pro.tsx` (283,340) et `abonnement.tsx` (139,147) (états conditionnels). | Passer le 2ᵉ en `h2`. |
| URLs propres | ✅ | Slugs SEO pour listings/programmes. | — |
| robots.txt | 🟡 | Présent, `Disallow` corrects (dashboard/admin/auth) mais sitemap pointe vers le mauvais domaine. | Corriger l'URL du sitemap. |
| **sitemap.xml** | 🔴 | **Absent** de `public/` alors que `robots.txt` le référence. | Générer le sitemap (statique + routes dynamiques) au build. |
| Données structurées | ✅ | JSON-LD riche : WebSite/SearchAction, CollectionPage, RealEstateListing, Residence, BreadcrumbList, Organization… `safeJsonLd()` anti-XSS. | 🟡 Harmoniser `Residence` (prerender) vs `ApartmentComplex` (runtime). |
| Analytics / Search Console | 🔴 | Aucun GA4/gtag ni balise `google-site-verification`. | Installer GA4 + vérifier dans Search Console. |
| Build SEO | 🟡 | `prerender.ts` **échoue si `DATABASE_URL` absent** au build (`:256-266`). | Sécuriser le build (sitemap découplé de la DB). |

---

## 4. Légal

| Item | Statut | Détail / preuve | Correctif |
|---|---|---|---|
| CGU | ✅ | `/cgu` (`cgu.tsx` + `legal-content.ts:21-229`), lié au footer. | — |
| CGV (vente en ligne) | ✅ | `/cgv` (`legal-content.ts:231-403`), commissions, rétractation. | 🟡 Lier la rétractation depuis le checkout `abonnement.tsx`. |
| **Mentions légales** | 🔴 | **Absentes** (éditeur, immatriculation, hébergeur, directeur de publication). | Créer la page (obligatoire, ex. LCEN côté FR). |
| **Politique de confidentialité (RGPD)** | 🔴 | **Absente**, alors que l'analyse IA **transfère des données à Anthropic (USA)** (cf. `LEGAL-DRAFTS.md §2.5`). | Rédiger + publier (bases légales, durées, transfert hors-UE/DPA, droits, DPO). |
| **Bandeau cookies** | 🔴 | **Aucun**. Un cookie technique (état sidebar) est posé sans consentement. | Ajouter un bandeau de consentement (cookies non essentiels). |
| Infos société légales | 🟡 | Pas de SIRET/immatriculation, pas d'adresse, pas de contact DPO. | Compléter dans les mentions légales / confidentialité. |
| Statut courtier | 🟡 | Non clarifié dans l'app (`LEGAL-DRAFTS.md §1.1` : décision en attente IL/FR). | Trancher et afficher le cas échéant. |

> Note : `LEGAL-DRAFTS.md` reste un **brouillon** (`[à compléter]` : DPO, %, durée…) à faire valider par un juriste avant mise en ligne.

---

## 5. Sécurité & maintenance

| Item | Statut | Détail / preuve | Correctif |
|---|---|---|---|
| **IDOR sur les leads** | 🔴 **CRITIQUE** | `GET/PATCH /leads/:leadId` et `GET /leads/:leadId/messages` ne vérifient **pas** le propriétaire (`routes/leads.ts:162-255`). Tout compte peut lire/modifier les leads et messages d'autrui. | Contrôler `buyerId`/`listing.ownerId`/admin avant réponse. |
| Autorisation MAJ statut lead | 🔴 | `PATCH /leads/:leadId` modifiable par tout utilisateur authentifié (devrait être « pro only »). | Ajouter contrôle de rôle/propriété. |
| Anti-spam / rate-limit | 🟡 | Rate-limit **seulement** sur les routes IA (15/60s, `anthropic.ts`). **Aucun** sur `register`/`profiles/*` (création de comptes en masse possible). Pas de captcha/honeypot. | Rate-limit + captcha sur inscription et formulaires publics. |
| CORS | 🟡 | `cors({ credentials:true, origin:true })` accepte **toute origine** (`app.ts:39`). | Restreindre à une whitelist en prod. |
| En-têtes de sécurité | 🟡 | Pas de **helmet** (ni CSP, X-Frame-Options, X-Content-Type-Options). | Ajouter `helmet` + CSP. |
| Validation tél/email | 🟡 | Email/téléphone (démolition, profils) stockés sans format ni vérification. | Valider le format + vérifier l'email propriétaire (démolition). |
| Hash mots de passe | ✅ | bcrypt (12 rounds) (`lib/auth.ts`). | — |
| Sessions | ✅ | Cookie HttpOnly + Secure + SameSite=lax (`auth.ts:30-38`). | — |
| Admin protégé | ✅ | Middleware `requireAdmin` (`authMiddleware.ts:61-83`). | — |
| Secrets | ✅ | DB/PayPlus/Anthropic via variables d'env ; aucun secret en dur. | — |
| Fuite de données | ✅ | `passwordHash` jamais renvoyé (`serializeProfile`). | — |
| Sauvegarde DB | ⏳ | Hors code (infra Replit/Postgres). | Mettre en place des sauvegardes régulières. |
| MAJ dépendances | ⏳ | À vérifier (`pnpm audit`). | Lancer `pnpm audit` et mettre à jour. |
| Mots de passe admin robustes | ⏳ | Hors code (compte admin créé manuellement). | Utiliser un mot de passe fort + (idéalement) 2FA. |

---

## 6. Avant le lancement final

| Item | Statut | Détail | Correctif |
|---|---|---|---|
| Test appareils réels | ⏳ | Non réalisable ici. | Tester iOS/Android/desktop réels. |
| Redirections www / http→https | ⏳ | Non vérifiable ici (réseau bloqué). | Vérifier en ligne (301 cohérents vers le domaine canonique). |
| Suppression env. de test/staging | 🟡 | `artifacts/mockup-sandbox` (bac à sable de maquettes) présent dans le repo. | S'assurer qu'il **n'est pas déployé** en prod. |

---

## Simmo (`simmoisrael.com`)
Site **séparé** (application Replit distincte), absent de ce dépôt et **injoignable depuis cet environnement** (réseau bloqué). Je n'ai donc **pas pu l'auditer**. Pour le couvrir, deux options :
1. M'ouvrir l'accès au **dépôt de Simmo** (idéal — même audit code complet), ou
2. **Autoriser** `simmoisrael.com` dans la politique réseau pour des contrôles en ligne (liens, SSL, 404, meta, robots/sitemap).
La même checklist (ci-dessus) s'applique telle quelle.

---

## Top priorités (ordre conseillé)
1. 🔴 **Sécurité** : corriger l'IDOR + l'autorisation sur `/leads/:leadId*`.
2. 🔴 **Légal** : publier mentions légales + politique de confidentialité (RGPD/Anthropic) + bandeau cookies.
3. 🔴 **SEO** : unifier le domaine canonique (.com/.fr) + générer `sitemap.xml` + corriger `robots.txt`.
4. 🟡 **Durcissement** : rate-limit + captcha sur inscriptions, CORS restreint, `helmet`.
5. 🟡 **Perf** : compresser `hero-bg.png`, code-splitting des pages lourdes.
6. 🟡 **Finitions** : double `<h1>`, liens sociaux `#`, favicon.svg placeholder, apple-touch-icon, GA4/Search Console.
7. ⏳ **À faire en ligne** : SSL, redirections www/http→https, tests multi-appareils, `pnpm audit`, sauvegardes, exclusion du sandbox.
