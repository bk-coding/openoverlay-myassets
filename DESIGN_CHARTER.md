# Charte Graphique — OpenOverlay

> Référence visuelle et stylistique pour tous les développements graphiques d'OpenOverlay (site, système d'overlay, dashboard admin).

---

## Table des matières

1. [Identité & esprit](#1-identité--esprit)
2. [Palette de couleurs](#2-palette-de-couleurs)
3. [Typographie](#3-typographie)
4. [Espacement & mise en page](#4-espacement--mise-en-page)
5. [Effets visuels & textures](#5-effets-visuels--textures)
6. [Composants UI](#6-composants-ui)
7. [Animations & transitions](#7-animations--transitions)
8. [Iconographie & emojis](#8-iconographie--emojis)
9. [Overlay (canvas de stream)](#9-overlay-canvas-de-stream)
10. [Responsive & breakpoints](#10-responsive--breakpoints)
11. [Bonnes pratiques](#11-bonnes-pratiques)

---

## 1. Identité & esprit

OpenOverlay est un outil technique destiné aux **streamers IRL Twitch**. Son identité graphique reflète :

- **Technologie invisible** : l'interface disparaît derrière le contenu. L'obscurité est la norme, le contenu ressort.
- **Précision over décoration** : pas de surcharge visuelle. Chaque élément a une raison d'être.
- **Couleurs Twitch-adjacent** : le violet est l'accent principal, en écho à l'écosystème Twitch, sans imiter sa charte.
- **Minimalisme sombre** : dark mode exclusif — jamais de thème clair.
- **Légèreté perçue** : malgré la complexité technique, l'interface doit paraître simple et rapide.

### Mots-clés de l'identité
`sombre` · `violet` · `net` · `fluide` · `technique` · `confiant` · `IRL`

---

## 2. Palette de couleurs

### 2.1 Variables CSS canoniques

Toutes les couleurs sont définies via des custom properties CSS dans `:root`. **Ne jamais coder une couleur en dur** sans raison justifiée.

```css
:root {
  /* ── Fonds ──────────────────────────── */
  --bg:       #0c0c10;   /* fond de page principal */
  --bg2:      #13131a;   /* fond secondaire (cartes, sections) */
  --bg3:      #1a1a24;   /* fond tertiaire (inputs, sections imbriquées) */
  --surface:  #1e1e2a;   /* surface élevée (modales, sidebars) */
  --surface2: #252535;   /* surface admin niveau 2 */
  --surface3: #2e2e42;   /* surface admin niveau 3 (focus) */

  /* ── Bordures ─────────────────────── */
  --border:   rgba(255,255,255,0.07);   /* bordure standard */
  /* Variante admin : rgba(255,255,255,0.08) */

  /* ── Accents ──────────────────────── */
  --accent:   #7c5cfc;   /* violet principal */
  --accent2:  #c084fc;   /* violet clair (textes liens, tags) */
  --accent-h: #6847e8;   /* violet hover */

  /* ── Aliases admin (nomenclature propre à admin.css) ─ */
  --purple:   #7c5cfc;   /* = --accent  — utilisé dans admin.css */
  --purple-h: #6847e8;   /* = --accent-h — utilisé dans admin.css */

  /* ── Sémantique ─────────────────────── */
  --live:       #ff4554;   /* badge LIVE, danger */
  --green:      #22c55e;   /* succès / validation positive */
  --green-bg:   rgba(34,197,94,0.1); /* fond succès */
  /* Admin/overlay : --green vaut #00c896 (vert cyan), surchargé dans leur CSS */
  --red:        #ff4040;   /* erreur */
  --yellow:     #f0a000;   /* avertissement */

  /* ── Texte ────────────────────────── */
  --text:     #f0eeff;   /* texte principal (légère teinte violette) */
  --muted:    #7c7a99;   /* texte secondaire / désactivé */

  /* ── Backgrounds fonctionnels ─────────── */
  --tag-bg:   rgba(124,92,252,0.12);   /* fond des tags et badges accent */
}
```

### 2.2 Tableau des couleurs

| Rôle | Hex / Valeur | Contexte |
|---|---|---|
| Fond principal | `#0c0c10` | Page entière |
| Fond cartes | `#13131a` | Cards, sections alternées |
| Fond inputs | `#1a1a24` | Champs de formulaire, toolbar |
| Surface | `#1e1e2a` | Modales, sidebar admin, auth cards |
| Bordure | `rgba(255,255,255,0.07)` | Tous les séparateurs |
| **Accent primaire** | **`#7c5cfc`** (`--accent` / `--purple`) | **Boutons, liens actifs, logo dot** |
| Accent secondaire | `#c084fc` | Textes de liens, tags, sous-titres colorés |
| Accent hover | `#6847e8` (`--accent-h` / `--purple-h`) | État hover des boutons primaires |
| Live / Alerte | `#ff4554` | Badge LIVE, états d'erreur importants |
| Succès | `#22c55e` (`--green`) | Formulaires, validation positive |
| Succès (admin/overlay) | `#00c896` (surcharge de `--green` dans admin/overlay CSS) | Confirmations, états actifs |
| Erreur | `#ff4040` | Validation négative |
| Warning | `#f0a000` | Avertissements |
| Texte principal | `#f0eeff` | Corps de texte, titres |
| Texte muted | `#7c7a99` | Descriptions, métadonnées |
| Fond tag accent | `rgba(124,92,252,0.12)` | Badges, tags, step-num |

### 2.3 Couleurs Twitch (branding externe uniquement)

```css
/* Utilisé uniquement pour les boutons d'authentification Twitch */
--twitch-purple: #9147ff;
--twitch-hover:  #772ce8;
```

### 2.4 Couleur de série (overlay)

```css
:root {
  --series-color:      #E8A838;   /* couleur dynamique, modifiable en JS */
  --series-text-color: #1a1a1a;   /* texte sur fond de série */
}
```

### 2.5 Gradients

```css
/* Gradient texte accent (titres héros) */
background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;

/* Glow de fond (hero, sections) */
background: radial-gradient(circle, rgba(124,92,252,0.16) 0%, transparent 70%);

/* Séparateur horizontal accent */
background: linear-gradient(90deg, transparent, var(--accent), transparent);
```

---

## 3. Typographie

### 3.1 Familles de polices

| Rôle | Police | Poids | Source |
|---|---|---|---|
| **Titres / Logotype** | **Syne** | 700, 800 | Google Fonts |
| **Corps / Interface** | **DM Sans** | 300, 400, 500 | Google Fonts |
| Overlay display | TiltNeon | 400 | Fichier local (`/overlay/assets/fonts/`) |
| Monospace / Code | `'Consolas', 'Monaco', monospace` | — | Système |
| Fallback interface | `'Segoe UI', system-ui, -apple-system, sans-serif` | — | Système |

**Import Google Fonts :**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet">
```

### 3.2 Échelle typographique

```css
/* ── Titres héros (pages d'accueil) */
font-family: 'Syne', sans-serif;
font-weight: 800;
font-size: clamp(2.8rem, 8vw, 5.5rem);
line-height: 1.05;
letter-spacing: -0.03em;

/* ── Titres de section */
font-family: 'Syne', sans-serif;
font-weight: 700;
font-size: clamp(1.8rem, 4vw, 2.8rem);
line-height: 1.15;
letter-spacing: -0.02em;

/* ── Titres de page (pages intérieures) */
font-family: 'Syne', sans-serif;
font-weight: 800;
font-size: clamp(2rem, 5vw, 3.2rem);
line-height: 1.1;
letter-spacing: -0.03em;

/* ── Titre de carte / composant */
font-family: 'Syne', sans-serif;
font-weight: 700;
font-size: 1rem;        /* ou 0.95rem–1.05rem selon contexte */
letter-spacing: -0.01em;

/* ── Logotype / marque */
font-family: 'Syne', sans-serif;
font-weight: 800;
font-size: 1.1rem;
letter-spacing: -0.02em;

/* ── Corps de texte standard */
font-family: 'DM Sans', sans-serif;
font-weight: 400;
font-size: 1rem;         /* 16px base */
line-height: 1.6;

/* ── Corps de texte léger (descriptions) */
font-weight: 300;
font-size: 0.9rem–1.05rem;
line-height: 1.65–1.75;
color: var(--muted);

/* ── Labels / métadonnées */
font-size: 0.8rem–0.85rem;
font-weight: 300–400;

/* ── Labels uppercase (catégories, sections) */
font-size: 0.72rem–0.75rem;
font-weight: 500;
letter-spacing: 0.10em–0.12em;
text-transform: uppercase;
color: var(--accent) ou var(--accent2) ou var(--muted);

/* ── Micro-texte (badges, tags, hints) */
font-size: 0.7rem–0.78rem;

/* ── Admin — corps de formulaire */
font-size: 14px; /* base admin fixe, pas de rem */
line-height: 1.5;
```

### 3.3 Règles typographiques

- **Jamais de texte en majuscules pour les corps de texte.** L'uppercase est réservé aux labels de section et aux badges.
- **Jamais de `font-weight: 900`** — le poids maximum est 800 (Syne uniquement).
- **DM Sans 300** pour les descriptions longues, sous-titres, et texte muted.
- **Syne uniquement pour** : titres, logotype, boutons CTA principaux, numéros de step décoratifs, titres de sidebar.
- `clamp()` est obligatoire pour tous les titres de niveau h1/h2 affichés dans des sections fluides.

---

## 4. Espacement & mise en page

### 4.1 Variables de layout

```css
:root {
  --radius: 14px;   /* rayon de bordure standard pour les cartes */
  --gap:    20px;   /* gouttière standard de grille */
}
```

### 4.2 Tableau des border-radius

| Valeur | Usage |
|---|---|
| `4px` | Inline code, micro-badges |
| `6px` | Type badges, petits éléments |
| `8px` | Inputs, boutons admin, toasts |
| `10px` | Callouts, form cards, image thumbnails |
| `14px` (`--radius`) | **Cards standard** (mod-card, sidebar-card) |
| `16px` | Auth cards, form cards larges |
| `20px` | Grilles de features/steps |
| `24px` | Sections mises en avant (irl-inner) |
| `28px` | Phone mockup |
| `100px` | **Pills** : boutons CTA, filtres, tags, recherche |
| `50%` | Points circulaires (logo-dot, live-dot, toggles) |

### 4.3 Conteneur principal

```css
.container {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 2rem;      /* 32px latéral */
  position: relative;
  z-index: 1;
}
```

### 4.4 Espacements de sections

```css
/* Section standard */
padding: 5rem 0;          /* 80px vertical */

/* Section grande (héros, features) */
padding: 7rem 0;          /* 112px vertical */

/* Hero */
padding: 8rem 2rem 6rem;  /* 128px top */

/* Page header intérieure */
padding: 9rem 2rem 4rem;
```

### 4.5 Grilles

```css
/* Grille de cartes (modules) */
display: grid;
grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
gap: 20px;

/* Grille features 2 colonnes */
grid-template-columns: repeat(2, 1fr);
gap: 1px;                /* séparateur par couleur de fond */
background: var(--border);
border-radius: 20px;
overflow: hidden;

/* Grille steps 3 colonnes */
grid-template-columns: repeat(3, 1fr);
gap: 1.5px;

/* Grille modules 3 colonnes */
grid-template-columns: repeat(3, 1fr);
gap: 1rem;

/* Grille détail mod */
grid-template-columns: 1fr 300px;
gap: 2rem;

/* Admin — card body 2 colonnes */
grid-template-columns: 1fr 1fr;
gap: 12px 20px;
```

---

## 5. Effets visuels & textures

### 5.1 Texture de bruit (noise overlay)

Appliquée sur **toutes les pages** via `body::before`. Effet subtil de grain sur fond sombre.

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}
```

### 5.2 Grille de fond (grid-bg)

Utilisée dans les sections héros et headers. Visible uniquement en haut de la section (masquée par gradient).

```css
.grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(124,92,252,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(124,92,252,0.04) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 80%);
  pointer-events: none;
}
```

### 5.3 Glow violet (hero-glow)

Halo de lumière violet positionné derrière l'élément central.

```css
.hero-glow {
  position: absolute;
  width: 700px;
  height: 400px;      /* ou 700px pour le héros principal */
  border-radius: 50%;
  background: radial-gradient(circle, rgba(124,92,252,0.16) 0%, transparent 70%);
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}
/* Variante page-header (glow plus compact) : width: 500px; height: 500px; rgba(...,0.12) */
```

### 5.4 Frosted glass (navigation & panels)

```css
/* Navigation principale */
background: rgba(12,12,16,0.85);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border-bottom: 1px solid var(--border);

/* Mobile nav (plus opaque) */
background: rgba(12,12,16,0.97);
backdrop-filter: blur(20px);

/* Sidebar admin */
background: rgba(30,30,42,0.92);
backdrop-filter: blur(20px);
```

### 5.5 Radial hover sur cartes

```css
/* Effet lumineux apparaissant au survol des cartes */
.mod-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top left, rgba(124,92,252,0.07), transparent 65%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}
.mod-card:hover::after { opacity: 1; }
```

### 5.6 Box shadow (phone mockup)

```css
box-shadow:
  0 40px 80px rgba(0,0,0,0.6),
  0 0 0 1px rgba(255,255,255,0.04);
```

---

## 6. Composants UI

### 6.1 Navigation principale

- Élément HTML : `<nav>` (HTML5 sémantique — jamais `<header class="...">`)
- Position : `fixed`, top 0, z-index 100
- Hauteur approximative : **57px**
- Structure : `.logo-nav` → `<ul><li>` → `.nav-cta` → `.burger-btn`
- Logo : `<a class="logo-nav">` avec `<span class="logo-dot">` animé (voir §7.1)
- Liens : DM Sans 400, 0.9rem, couleur `--muted` → `--text` au hover, dans `<ul><li>`
- Lien actif : couleur `--accent2` (classe `.active`)
- CTA : `<a class="nav-cta">`, enfant direct de `<nav>`, pill (`border-radius: 100px`), `background: var(--accent)`
- Include PHP : `<?php $page = 'xxx'; include __DIR__ . '/_nav.php'; ?>`

### 6.2 Logo / Marque

```html
<!-- Structure standard -->
<a href="/" class="logo-nav">
  <span class="logo-dot"></span>
  OpenOverlay
</a>
<!-- Le point est un <span>, non un <div> -->
```

```css
.logo-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse-dot 2s ease-in-out infinite;
}
```

### 6.3 Boutons

```css
/* Base commune */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px–8px;
  padding: 8px 16px;        /* admin */
  padding: 11px 24px;       /* site, pill */
  border-radius: 100px;     /* site, pill */
  border-radius: 8px;       /* admin */
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;        /* 13px admin */
  font-weight: 500;         /* 600 admin */
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s, transform 0.2s;
}

/* Variantes */
.btn-primary   { background: var(--accent); color: #fff; }
.btn-primary:hover { background: var(--accent-h); transform: translateY(-1px); }

.btn-secondary { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
.btn-secondary:hover { background: var(--surface3); }

.btn-ghost     { background: transparent; color: var(--muted); border: 1px solid var(--border); }
.btn-ghost:hover { background: var(--surface2); color: var(--text); }

.btn-danger    { background: transparent; color: var(--red); border: 1px solid rgba(255,64,64,0.4); }
.btn-danger:hover { background: rgba(255,64,64,0.1); border-color: var(--red); }

.btn:active:not(:disabled) { transform: scale(0.97); }
.btn:disabled { opacity: 0.4; cursor: default; }
```

**CTA principal héros** (avec glow) :
```css
box-shadow: 0 0 30px rgba(124,92,252,0.35);
```

### 6.4 Cartes (mod-card)

```css
.mod-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);    /* 14px */
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.25s, transform 0.25s, background 0.25s;
  position: relative;
  overflow: hidden;
}

.mod-card:hover {
  border-color: rgba(124,92,252,0.45);
  transform: translateY(-4px);
  background: var(--bg3);
}
```

### 6.5 Tags & Badges

```css
/* Tag accent (catégorie) */
.tag {
  background: var(--tag-bg);                     /* rgba(124,92,252,0.12) */
  border: 1px solid rgba(124,92,252,0.2);
  border-radius: 100px;
  font-size: 0.7rem;
  color: var(--accent2);
  padding: 2px 10px;
  font-weight: 400;
}

/* Badge sémantique (admin) */
.badge-green { background: rgba(0,200,150,0.12); color: var(--green); }
.badge-red   { background: rgba(255,64,64,0.12);  color: var(--red); }
.badge-muted { background: var(--surface2); color: var(--muted); }
/* padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; */

/* Badge LIVE */
.badge-live {
  background: rgba(255,69,84,0.12);
  border: 1px solid rgba(255,69,84,0.3);
  color: var(--live);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 100px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Type badge (monospace) */
.type-badge {
  background: var(--tag-bg);
  border: 1px solid rgba(124,92,252,0.2);
  border-radius: 6px;
  font-size: 0.7rem;
  color: var(--accent2);
  padding: 2px 8px;
  font-family: monospace;
}
```

### 6.6 Champs de formulaire

```css
input[type="text"],
input[type="email"],
input[type="url"],
textarea,
select {
  width: 100%;
  background: var(--bg2);       /* var(--surface2) admin */
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-family: inherit;
  font-size: 0.88rem;           /* 13px admin */
  padding: 9px 12px;
  outline: none;
  transition: border-color 0.2s, background 0.15s;
}

input:focus,
textarea:focus,
select:focus {
  border-color: rgba(124,92,252,0.5);
  background: var(--surface);   /* var(--surface3) admin */
}

/* Barre de recherche (pill) */
#search {
  border-radius: 100px;
  padding: 11px 20px 11px 42px;  /* laisser place à l'icône */
}
```

### 6.7 Toggle switch (admin)

```css
.toggle { position: relative; display: inline-block; width: 40px; height: 22px; }
.toggle-track {
  position: absolute; inset: 0;
  background: var(--surface3);
  border-radius: 22px;
  transition: background 0.2s;
}
.toggle-track::after {
  content: ''; position: absolute;
  left: 3px; top: 3px;
  width: 16px; height: 16px;
  border-radius: 50%; background: #fff;
  transition: transform 0.2s;
}
.toggle input:checked + .toggle-track { background: var(--purple); /* = var(--accent) */ }
.toggle input:checked + .toggle-track::after { transform: translateX(18px); }
```

### 6.8 Toast / Notification (admin)

```css
#toast {
  position: fixed;
  bottom: 24px; right: 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 18px;
  font-size: 13px;
  backdrop-filter: blur(12px);
  transition: opacity 0.2s, transform 0.2s;
}
#toast.success { border-color: rgba(0,200,150,0.4); color: var(--green); }
#toast.error   { border-color: rgba(255,64,64,0.4);  color: var(--red); }
```

### 6.9 Callouts

```css
/* Avertissement */
.callout-warn {
  background: rgba(251,191,36,0.08);
  border: 1px solid rgba(251,191,36,0.25);
  border-radius: 10px;
  color: #fde68a;
}

/* Info */
.callout-info {
  background: var(--tag-bg);
  border: 1px solid rgba(124,92,252,0.2);
  border-radius: 10px;
  color: #c5b8ff;
}

/* Erreur / Succès (état formulaire) */
.form-status.error   { background: rgba(255,69,84,0.1);  border: 1px solid rgba(255,69,84,0.3);  color: #f87171; }
.form-status.success { background: rgba(34,197,94,0.1);  border: 1px solid rgba(34,197,94,0.3);  color: #4ade80; }
```

### 6.10 Sidebar admin

- Largeur fixe : **220px**
- `position: sticky; top: 0; height: 100vh; overflow-y: auto;`
- Border-right : `1px solid var(--border)`
- Item nav actif : `border-left: 2px solid var(--purple)` (= `var(--accent)`) + `background: rgba(124,92,252,0.10)`
- Icônes : 16–18px, alignées avec gap de 10px

### 6.11 Range input (admin)

```css
input[type="range"] {
  height: 4px;
  border-radius: 4px;
  background: var(--surface3);
}
input[type="range"]::-webkit-slider-thumb {
  width: 14px; height: 14px;
  border-radius: 50%;
  background: var(--purple);   /* = var(--accent) */
  box-shadow: 0 0 0 3px rgba(124,92,252,0.2);
}
```

### 6.12 Carousel (images)

- Navigation par boutons circulaires (36px) avec blur backdrop
- Dots indicateurs : 6px, `background: var(--border)` → `var(--accent)` actif
- Dot actif : `transform: scale(1.4)`
- Transition : `transform 0.35s ease`

---

## 7. Animations & transitions

### 7.1 pulse-dot (logo)

```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.65); }
}
animation: pulse-dot 2s ease-in-out infinite;
```

### 7.2 blink (badge LIVE)

```css
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.2; }
}
animation: blink 1.2s ease-in-out infinite;
```

### 7.3 fade-in (scroll reveal)

```css
.fade-in {
  opacity: 0;
  transform: translateY(18px–24px);
  transition: opacity 0.55s–0.6s ease, transform 0.55s–0.6s ease;
}
.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}
```
Déclenché via `IntersectionObserver` (threshold: 0.12), avec délai échelonné (`i * 80ms`) pour les groupes d'éléments.

### 7.4 float (tags flottants)

```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}
/* Délai décalé par élément : 0s, 1.2s, 2.4s */
```

### 7.5 slideUp (alertes overlay)

```css
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
animation: slideUp 0.4s cubic-bezier(0.22,1,0.36,1) forwards;
```

### 7.6 spin (loader)

```css
@keyframes spin { to { transform: rotate(360deg); } }
.loading-spinner {
  width: 36px; height: 36px;
  border: 3px solid rgba(255,255,255,0.08);
  border-top-color: var(--purple);   /* = var(--accent) */
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
```

### 7.7 Mobile nav

```css
/* Fermeture */
transform: translateY(-6px);
opacity: 0;
pointer-events: none;
transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease;

/* Ouverture */
transform: translateY(0);
opacity: 1;
pointer-events: auto;
```

### 7.8 Règles générales de transition

| Propriété | Durée | Easing |
|---|---|---|
| Couleur, opacité | `0.15s–0.2s` | `ease` |
| Bordure, fond | `0.2s–0.25s` | `ease` |
| Transform (hover cartes) | `0.25s` | `ease` |
| Scroll reveal | `0.55s–0.6s` | `ease` |
| Mobile nav | `0.22s` | `cubic-bezier(0.22,1,0.36,1)` |
| Carousel | `0.35s` | `ease` |
| Alertes overlay | `0.4s` | `cubic-bezier(0.22,1,0.36,1)` |

---

## 8. Iconographie & emojis

- **Pas de bibliothèque d'icônes** — les icônes UI sont des emojis système.
- Les emojis servent d'icônes fonctionnelles dans les cartes, étapes, features, nav admin.
- Taille standard : 1.1rem–1.2rem (icônes de boutons), 1.8rem–2.2rem (icônes de cartes), 3.5rem (icônes de détail).
- Les icônes dans les conteneurs (`.feat-icon`, `.step-icon`, `.mod-icon`) utilisent un fond `var(--tag-bg)` avec `border-radius: 10px`.

```css
/* Conteneur d'icône standard */
.feat-icon {
  width: 42px; height: 42px;
  flex-shrink: 0;
  background: var(--tag-bg);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
```

- **Numéros décoratifs de step** : Syne 800, `font-size: 3.5rem`, `color: rgba(124,92,252,0.12)` — très discrets.
- **Step numérotés (progress)** : cercles 36px, fond `var(--tag-bg)`, actif sur fond `var(--accent)` avec glow (`box-shadow: 0 0 20px rgba(124,92,252,0.4)`).

---

## 9. Overlay (canvas de stream)

L'overlay est une page web en fond transparent, dimensionnée à une résolution fixe.

### 9.1 Canvas

```css
body {
  background: transparent;
  overflow: hidden;
  width: 1280px;
  height: 720px;   /* 720p fixe — ne pas modifier */
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}
```

### 9.2 Police display overlay

```css
@font-face {
  font-family: 'TiltNeon';
  src: url('/overlay/assets/fonts/TiltNeon-Regular.woff2') format('woff2'),
       url('/overlay/assets/fonts/TiltNeon-Regular.ttf')   format('truetype');
  font-weight: normal;
  font-style: normal;
}
```

TiltNeon est utilisé pour les éléments d'interface visibles à l'écran (logo overlay, alertes, titres de modules). Son style arrondi et néon s'adapte à l'esthétique stream.

### 9.3 Couleur de série

Variable CSS dynamique, modifiée en JavaScript selon la série en cours :

```css
:root {
  --series-color:      #E8A838;   /* couleur primaire (orange chaud par défaut) */
  --series-text-color: #1a1a1a;   /* texte sur ce fond */
}
```

### 9.4 Popup d'alerte (structure)

```css
.alert-popup {
  background: rgba(20,12,40,0.92);
  border: 1px solid rgba(124,92,252,0.4);
  border-radius: 8px;
  animation: slideUp 0.4s cubic-bezier(0.22,1,0.36,1) forwards;
}
```

### 9.5 Règles overlay

- **Pas de fond plein** sur le body — transparent obligatoire.
- **Pas de scroll** — overflow hidden.
- Éléments de l'overlay positionnés en **absolu** à l'intérieur du canvas 1280×720.
- Les modules sont **indépendants** — chaque module gère son propre positionnement.

---

## 10. Responsive & breakpoints

| Breakpoint | Largeur | Changements principaux |
|---|---|---|
| Desktop | > 768px | Layout complet |
| Tablette / Mobile large | ≤ 768px | Nav → burger (`nav ul` + `.nav-cta` masqués), grilles → 1 colonne, steps → vertical |
| Petit mobile | ≤ 480px | Nav padding réduit, modules → 1 colonne |
| Admin mobile | ≤ 768px | Sidebar → barre horizontale scrollable en haut |
| Admin small | ≤ 600px | Tables → mode bloc |

### Comportement du menu mobile

1. `nav ul` + `.nav-cta` masqués
2. `.burger-btn` affiché (`display: flex`)
3. `.mobile-nav` : slide-down animé depuis `translateY(-6px)`
4. Fermeture : clic extérieur, touche Escape, clic sur lien

---

## 11. Bonnes pratiques

### Ce qu'il faut faire

- ✅ Utiliser **exclusivement les variables CSS** pour les couleurs et rayons
- ✅ Utiliser **Syne** pour tous les titres et la marque
- ✅ Utiliser **DM Sans** pour tout le reste du texte d'interface
- ✅ Appliquer la **texture noise** via `body::before` sur toutes les nouvelles pages
- ✅ Mettre un `z-index: 1` sur tout contenu placé au-dessus de `body::before`
- ✅ Utiliser `clamp()` pour les tailles de titre dans les sections fluides
- ✅ Animer les entrées en scroll avec la classe `.fade-in` + `IntersectionObserver`
- ✅ Utiliser `backdrop-filter: blur()` pour les éléments superposés (nav, modales)
- ✅ Utiliser `border-radius: 100px` pour les éléments pill (boutons CTA, filtres, tags)
- ✅ Utiliser `transform: translateY(-4px)` pour le hover des cartes
- ✅ Utiliser `<nav>` comme élément HTML5 de navigation — jamais `<header class="...">`
- ✅ Utiliser `<a class="logo-nav">` avec `<span class="logo-dot">` pour le logo
- ✅ Organiser les liens de nav dans un `<ul><li>`, le CTA nav comme enfant direct de `<nav>`
- ✅ PHP includes : `<?php $page = 'xxx'; include __DIR__ . '/_nav.php'; ?>` et `<?php include __DIR__ . '/_footer.php'; ?>`

### Ce qu'il ne faut pas faire

- ❌ Jamais de thème clair — dark mode uniquement
- ❌ Pas de couleurs codées en dur en dehors des variables
- ❌ Pas de `font-weight: 900`
- ❌ Pas de polices additionnelles sans validation (Syne + DM Sans suffisent)
- ❌ Pas de box-shadow coloré sauf pour le CTA héros et le step actif
- ❌ Pas de `!important` sauf pour `.hidden { display: none !important; }`
- ❌ Pas d'animation sur les éléments de fond (noise, grid-bg) — ils sont statiques
- ❌ Pas de fond blanc ou clair sur aucun élément
- ❌ Pas d'uppercase sur du corps de texte
- ❌ Ne jamais modifier les dimensions du canvas overlay (1280×720)
- ❌ Pas de classe sur l'élément `<footer>` — cibler directement `footer` en CSS

### Hiérarchie des fonds

Pour éviter la confusion, voici l'ordre de profondeur :

```
--bg (#0c0c10)          ← page
  └── --bg2 (#13131a)   ← sections alternées, cartes dans la page
        └── --bg3 (#1a1a24)  ← inputs, zones imbriquées
              └── --surface (#1e1e2a)   ← modales, sidebar, auth
                    └── --surface2 (#252535)  ← [admin] champs focus
                          └── --surface3 (#2e2e42)  ← [admin] focus actif
```

### Code CSS

- Nommage BEM-like ou par composant (`.mod-card`, `.mod-card-header`, `.mod-card-footer`)
- Un fichier CSS par contexte : `style.css` global, `admin.css` dashboard
- Les commentaires de section suivent le format : `/* ── Nom de section ───... */`

---

*Dernière mise à jour : mai 2026 — basée exclusivement sur `openoverlay-site` comme référentiel canonique de tous les projets OpenOverlay.*
