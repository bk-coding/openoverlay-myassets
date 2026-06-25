# Développer un module — OpenOverlay

Guide complet pour créer un module intégré (dans `openoverlay/mods/`) ou store (dans `openoverlay-store/mods/`).

---

## Table des matières

1. [Structure d'un module](#1-structure-dun-module)
2. [overlay.js — hooks disponibles](#2-overlayjs--hooks-disponibles)
3. [admin.js — interface de configuration](#3-adminjs--interface-de-configuration)
4. [API overlay (objet `api`)](#4-api-overlay-objet-api)
5. [API admin (objet `tools`)](#5-api-admin-objet-tools)
6. [Namespace global OO](#6-namespace-global-oo)
7. [Système d'alertes partagé (OO.AlertBox / OO.AlertQueue)](#7-système-dalertes-partagé-oocalertbox--ooalertqueue)
8. [Assets et uploads](#8-assets-et-uploads)
9. [Persistance d'état](#9-persistance-détat)
10. [manifest.json](#10-manifestjson)
11. [Conventions de nommage](#11-conventions-de-nommage)
12. [CSS — règles obligatoires](#12-css--règles-obligatoires)
13. [Patterns courants](#13-patterns-courants)
14. [Workflow de développement](#14-workflow-de-développement)

---

## 1. Structure d'un module

```
mods/<id>/
├── manifest.json     ← métadonnées, config par défaut, changelog
���── overlay.js        ← logique de l'overlay (affiché dans OBS)
├── overlay.html      ← structure HTML de l'overlay
├── overlay.css       ← styles de l'overlay
├── admin.js          ← interface de configuration dans le dashboard
└── admin.css         ← styles spécifiques au panneau admin (optionnel)
```

Les six fichiers sont requis pour un module Store. `admin.css` peut être vide.

---

## 2. overlay.js — hooks disponibles

```js
OO.Mods.register({
  id: 'mon_mod',

  // Appelé AVANT init() avec l'état sauvegardé ou null (système ≥ 1.45.0)
  onStateRestore(data, api) {
    if (data) { /* restaurer l'affichage */ }
  },

  // Initialisation — accès à la config et au DOM overlay
  init(api) {
    const cfg = api.config.mon_mod;
    if (cfg.enabled === false) return;
    // setup...
  },

  // Commande chat — ex: !macommande arg1 arg2
  onChatCommand(cmd, args, api, sender) {
    if (!api.config.mon_mod?.enabled) return;
    if (cmd !== api.config.mon_mod.commandName) return;
    if (!api.checkPermission(sender, 'moderator')) return;
    // ...
  },

  // Événement Twitch (follow, sub, bits, raid, channel_point_redemption…)
  onTwitchEvent(type, event, api) {
    if (!api.config.mon_mod?.enabled) return;
    // ...
  },

  // Message envoyé depuis le dashboard via tools.sendToOverlay()
  onAdminMessage(data, api) {
    if (!api.config.mon_mod?.enabled) return;
    // ...
  },

  // Config rechargée (après sauvegarde dans le dashboard)
  onConfigReload(api) {
    // appliquer la nouvelle config sans rechargement de page
  },

  // Commandes exposées au core (aide chat, onglet Commandes du dashboard)
  getCommands(config) {
    if (config.enabled === false) return [];
    return [{ cmd: '!' + config.commandName, desc: 'Description', permission: config.commandPermission }];
  },
});
```

**`getCommands` est obligatoire** — retourner `[]` si le module est désactivé.

---

## 3. admin.js — interface de configuration

```js
OO.Admin.register({
  id: 'mon_mod',

  render(config, container, tools) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header"><span class="card-title">Configuration</span></div>
        <div class="card-body">
          <div class="field field-inline">
            <span class="field-inline-label">Option</span>
            <label class="toggle">
              <input type="checkbox" id="opt-enabled">
              <span class="toggle-track"></span>
            </label>
          </div>
        </div>
      </div>`;

    const toggle = container.querySelector('#opt-enabled');
    toggle.checked = config.mon_option ?? true;
    toggle.addEventListener('change', e => {
      config.mon_option = e.target.checked;
      tools.markDirty();
    });
  },

  // Commandes listées dans l'onglet Commandes du dashboard
  getCommands(config) {
    if (config.enabled === false) return [];
    return [{ cmd: '!' + config.commandName, desc: 'Description' }];
  },
});
```

**Ne jamais ajouter un toggle "Activer le module"** — le dashboard en fournit déjà un.

---

## 4. API overlay (objet `api`)

| Méthode | Description |
|---|---|
| `api.config.<modId>` | Config du module (objet live) |
| `api.token` | Token Twitch de l'utilisateur |
| `api.broadcasterId` | ID du broadcaster |
| `api.channelName` | Nom du channel Twitch |
| `api.sendChat(text)` | Envoie un message dans le chat |
| `api.playSound(src, volume)` | Joue un son (`user://` ou chemin relatif) |
| `api.resolveAsset(path)` | Résout un chemin `user://` en URL signée Netlify Blobs |
| `api.checkPermission(sender, level)` | Vérifie le niveau d'accès (sync) — `'everyone'`, `'follower'`, `'subscriber'`, `'moderator'`, `'streamer'` |
| `api.checkPermissionAsync(sender, level)` | Idem en async — résout le statut follower réel via Helix (≥ 1.31.0) |
| `api.isFollower(userId)` | `Promise<bool>`, cache 5 min (≥ 1.31.0) |
| `api.getMod(id)` | Récupère un autre module overlay par son id |
| `api.emit(method, ...args)` | Appelle une méthode sur tous les modules |
| `api.trigger(cmd, args, sender?)` | Déclenche une commande chat comme si elle venait du chat |
| `api.twitchFetch(endpoint, opts)` | Appel Helix authentifié |
| `api.logEvent({ modId, label, icon?, user?, detail? })` | Ajoute un événement dans l'historique (≥ 1.26.0) |
| `api.sendWhisper(toUserId, msg)` | Envoie un chuchotement Twitch (≥ 1.30.0, async → bool) |
| `api.sendToAdmin(modId, payload)` | Envoie un message au dashboard (��� 1.37.0) |
| `api.saveState(modId, data)` | Sauvegarde l'état dans Netlify Blobs (≥ 1.45.0, fire-and-forget) |
| `api.loadState(modId)` | Charge l'état depuis Netlify Blobs (≥ 1.45.0, async → data\|null) |
| `api.ai?.(task, input, opts?)` | Proxy IA sécurisé (≥ 1.32.0) — prévoir toujours un fallback local |

---

## 5. API admin (objet `tools`)

| Méthode | Description |
|---|---|
| `tools.markDirty()` | Signale que la config a changé (active le bouton Sauvegarder) |
| `tools.sendToOverlay(data)` | Envoie un message à l'overlay (reçu par `onAdminMessage`) |
| `tools.showToast(msg, type)` | Affiche une notification (`'success'` \| `'error'`) |
| `tools.uploadAsset(file)` | Upload un fichier vers Netlify Blobs — retourne `{ ok, path: 'user://...' }` |
| `tools.deleteAsset(filename)` | Supprime un fichier uploadé |
| `tools.resolveAsset(path)` | Résout `user://` en URL signée |
| `tools.addDropZone(el, accept, onFile)` | Zone de glisser-déposer sur un élément |
| `tools.createAssetField({ type, value, onChange })` | Champ d'upload avec sélecteur et aperçu (voir §8) |
| `tools.permissionSelect(id, value)` | Crée un `<select>` de niveau d'accès |
| `tools.twitchFetch(endpoint, opts)` | Appel Helix depuis l'admin |
| `tools.username` | Login Twitch du streamer |
| `tools.broadcasterId` | ID du broadcaster |
| `tools.testUsername` | Pseudo de test pour les prévisualisations |
| `tools.saveModState(modId, data)` | Sauvegarde l'état (≥ 1.45.0, fire-and-forget) |
| `tools.loadModState(modId)` | Charge l'état (≥ 1.45.0, async → data\|null) |

---

## 6. Namespace global OO

Défini dans `assets/js/utils.js`, disponible partout (overlay, admin, auth).

| Propriété | Rôle |
|---|---|
| `OO.CHANNEL` | Nom du BroadcastChannel admin ↔ overlay (`'oo-admin'`) — ne jamais hardcoder |
| `OO.escHtml(str)` | Échappe le HTML — obligatoire pour tout contenu issu des viewers |
| `OO.deepMerge(a, b)` | Fusion profonde d'objets (protégée contre la prototype pollution) |
| `OO.loadScript(url, headers?)` | Charge un script (Blob URL si headers d'auth) |
| `OO.fmt(template, vars)` | Interpolation `{clé}` dans une chaîne |
| `OO.semverCompare(a, b)` | Comparaison semver → -1/0/1 |
| `OO.anim(el, keyframes, opts)` | `Element.animate()` → Promise |
| `OO.AlertBox` | Thèmes + animations des boîtes d'alertes (≥ 1.49.0) — voir §7 |
| `OO.AlertQueue` | File d'alertes séquentielles (≥ 1.49.0) — voir §7 |
| `OO.Mods` | Registre des modules overlay |
| `OO.Admin` | Registre des modules dashboard |

---

## 7. Système d'alertes partagé (OO.AlertBox / OO.AlertQueue)

Pour les modules qui affichent une boîte d'alerte centrée (follow, sub, channel point…).

### OO.AlertBox

Applique automatiquement le thème et l'animation configurés par le streamer dans **Préférences → Style des alertes**.

```js
// Dans init() — configure une fois au chargement
OO.AlertBox.configure(api.config.alert_style);

// Sur la boîte HTML — applique le thème actif
OO.AlertBox.applyTheme(document.getElementById('ma-box'));

// Animations
await OO.AlertBox.animIn(boxEl, prefixText);   // entrée
await OO.AlertBox.animOut(boxEl);              // sortie
```

**Thèmes disponibles** (configurables dans les Préférences) :

| Thème | Forme |
|---|---|
| `glass` | Rectangle arrondi 14px, fond verre dépoli (défaut) |
| `solid` | Angles vifs 4px, bordure accent, fond sombre |
| `neon` | Arrondi 22px, lueur colorée |
| `minimal` | Bande avec bordure gauche colorée, pas de fond |
| `bd` | Bulle BD 48px avec queue (triangle) |

### OO.AlertQueue

File d'attente séquentielle — chaque alerte attend la fin de la précédente.

```js
// Initialisation (dans init())
this._queue = new OO.AlertQueue(
  (data, isCurrentGen) => this._show(data, isCurrentGen),
  {
    box: document.getElementById('ma-box'),
    getPrefix: () => this._prefix ?? '',
    withLogo: true,  // active la séquence logo complète (≥ 1.50.0)
  }
);

// Ajouter une alerte
this._queue.add(data);

// Vider la file (annule l'alerte en cours)
this._queue.clear();
```

**Séquence avec `withLogo: true`** :
`animLogoArc` → `animIn box` → `animLogoExit` → `showFn` → `animOut box` → `animLogoFadeIn`

La fonction `showFn(data, isCurrentGen)` n'a besoin que de peupler le contenu et d'attendre la durée :
```js
async _show(data, isCurrentGen) {
  if (!isCurrentGen()) return;
  document.getElementById('titre').textContent = data.titre;
  await new Promise(r => setTimeout(r, data.duration));
}
```

---

## 8. Assets et uploads

Les fichiers uploadés par le streamer sont stockés dans Netlify Blobs (store `overlay-assets`).
Chemin dans la config : `user://nom-du-fichier` — résolu en URL signée via `api.resolveAsset()` / `tools.resolveAsset()`.

**Assets intégrés** (disponibles sans upload) :
- `overlay/assets/gifs/defaut.gif`
- `overlay/assets/sounds/defaut.mp3`

### Champ d'upload dans l'admin

Utiliser le pattern placeholder pour insérer `createAssetField` après `container.innerHTML` :

```html
<!-- Dans le template HTML du render() -->
<div class="asset-ph" data-ph-type="gif" data-ph-value="${cfg.gif ?? ''}"></div>
```

```js
// Après container.innerHTML = ...
container.querySelectorAll('.asset-ph').forEach(ph => {
  ph.replaceWith(tools.createAssetField({
    type: ph.dataset.phType,          // 'gif' | 'image' | 'sound' | 'video'
    value: ph.dataset.phValue ?? '',
    onChange: path => { cfg.gif = path; tools.markDirty(); },
  }));
});
```

Types acceptés : `gif`, `image`, `sound`, `video` — limites : **4 Mo/fichier**, **50 fichiers max** par utilisateur.

---

## 9. Persistance d'état

Pour sauvegarder l'état d'un module entre les rechargements (ex : série active, file d'attente…).

```js
// overlay.js — restauration au démarrage (appelé AVANT init)
onStateRestore(data, api) {
  if (data?.activeSerie) this._activeSerie = data.activeSerie;
},

// Sauvegarder après chaque changement d'état
api.saveState?.('mon_mod', { activeSerie: this._activeSerie });
```

Utiliser `api.saveState?.()` (optionnel chaining) pour la rétrocompatibilité avec les instances < 1.45.0.
Mettre `minSystemVersion: "1.45.0"` dans le manifest si ce hook est requis.

---

## 10. manifest.json

```json
{
  "id": "mon_mod",
  "name": "Mon Module",
  "description": "Description courte.",
  "icon": "🎯",
  "types": ["display", "chat"],
  "tags": ["display", "chat"],
  "configKey": "mon_mod",
  "defaultConfig": {
    "enabled": true,
    "commandName": "macommande",
    "commandPermission": "moderator"
  },
  "version": "1.0.0",
  "author": "Pseudo",
  "minSystemVersion": "1.24.0",
  "longDescription": "Description détaillée affichée dans le Store.",
  "files": ["manifest.json", "overlay.js", "overlay.html", "overlay.css", "admin.js", "admin.css"],
  "changelog": [
    { "version": "1.0.0", "date": "2026-01-01", "notes": "Version initiale." }
  ]
}
```

**Types** (`types`) : `display`, `chat`, `events`, `integration`
**Tags** (officiels uniquement) : `display`, `widget`, `chat`, `events`, `integration`, `interactive`

Bumper `version` (semver) et ajouter une entrée `changelog` à **chaque modification** du module.

---

## 11. Conventions de nommage

| Élément | Convention | Exemple |
|---|---|---|
| ID de module | snake_case | `channel_points` |
| localStorage | préfixe `oo_` | `oo_token`, `oo_config_bastien` |
| Events DOM | préfixe `oo:` | `oo:cmd` |
| BroadcastChannel | toujours `OO.CHANNEL` | — |
| Netlify Blobs stores | préfixe `overlay-*` | `overlay-assets`, `overlay-configs` |
| Exception Blobs | `mod-memory` (état mods, ≥ 1.45.0) | — |

---

## 12. CSS — règles obligatoires

**Trois interdictions absolues :**

1. **Pas de `style="..."`** dans le HTML généré par `admin.js` ou `overlay.js`. Exception unique : `el.style.setProperty('--var', valeur)` en JS pour les couleurs dynamiques.

2. **Pas de `var(--x, fallback)`** dans `overlay.css` ni `admin.css`. Toutes les variables système ont leurs valeurs par défaut dans `:root` d'`overlay/style.css`. Écrire uniquement `var(--x)`.

3. **Pas de `position: fixed`** dans `overlay.css` si le module utilise le système de zones (`api.placeInZone`). Le conteneur de zone gère le positionnement.

**Variables CSS système disponibles dans `overlay.css` :**

| Variable | Valeur par défaut | Rôle |
|---|---|---|
| `--mod-z-{id}` | Valeur spécifique | Z-index — défini par l'ordre des modules dans le dashboard |
| `--oo-safe-bottom` | `0px` | Espace réservé en bas (ex : ticker actif) |
| `--oo-alert-radius` | `14px` | Rayon de la boîte d'alerte (surchargé par les thèmes) |

**Variables CSS disponibles dans `admin.css` :**
`--bg`, `--surface`, `--surface2`, `--surface3`, `--border`, `--text`, `--muted`,
`--purple` (#7c5cfc), `--accent` (#7c5cfc), `--accent2` (#c9b8ff),
`--green` (#00c896), `--red` (#ff4040), `--yellow` (#f0a000), `--radius` (14px)

Les contrôles `button` et `input` n'héritent pas de `font-family` — ajouter `font-family: inherit` explicitement.

---

## 13. Patterns courants

### Toggle booléen (admin)

```html
<div class="field field-inline">
  <span class="field-inline-label">Afficher le titre</span>
  <label class="toggle">
    <input type="checkbox" id="opt-show-title">
    <span class="toggle-track"></span>
  </label>
</div>
```

### Sélecteur de niveau d'accès

```js
const select = tools.permissionSelect('cmd-perm', cfg.commandPermission ?? 'moderator');
select.addEventListener('change', e => { cfg.commandPermission = e.target.value; tools.markDirty(); });
container.querySelector('#perm-placeholder').replaceWith(select);
```

### Couleur dynamique issue de la config

```css
/* overlay.css */
#mon-element { background: var(--mon-mod-color); }
```
```js
// overlay.js
document.documentElement.style.setProperty('--mon-mod-color', cfg.color);
```

### Visibilité d'un élément

```js
// Toujours via classList — jamais el.style.display
el.classList.toggle('hidden', !condition);
```

### Safe bottom — élément positionné en bas

```css
#mon-widget {
  position: fixed;
  bottom: calc(16px + var(--oo-safe-bottom));
  right: 16px;
}
```

---

## 14. Workflow de développement

### Après chaque modification de module

```bash
npm run build       # régénère mods/index.json (obligatoire après ajout/renommage)
```

Puis dans `manifest.json` :
- Incrémenter `version` (semver : fix → patch, feat → minor, breaking → major)
- Ajouter une entrée dans `changelog` avec la date du jour

### Avant chaque push (branche `dev`)

```bash
# 1. Incrémenter la version dans package.json
# 2. Committer package.json avec les changements
git add <fichiers> package.json
git commit -m "feat/fix/chore(...): description"
git push origin dev
```

### Après merge dev → main

La release (ZIP + `latest.json`) est **automatique** via GitHub Actions — aucune action manuelle requise.

### Vérifier les docs

À chaque modification système (core, admin, overlay, API), mettre à jour :
- `openoverlay-docs/developpement.php`
- `openoverlay-docs/normalisation.php`
- `openoverlay-docs/installation.php` (si l'installation change)
- `openoverlay-myassets/ARCHITECTURE.md` (si l'architecture change)
