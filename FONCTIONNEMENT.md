# Principe de fonctionnement — OpenOverlay

> Document de référence technique. Décrit exactement comment le système fonctionne, de l'authentification au chargement des modules. À maintenir à jour à chaque évolution de l'architecture.

---

## 1. Vue d'ensemble

OpenOverlay est une application web hébergée sur **Netlify**. Elle ne nécessite aucun serveur local ni installation : le streamer la déploie sur son propre compte Netlify (plan gratuit) en y déposant le dossier du projet.

Le système se compose de :

| Composant | URL | Rôle |
|---|---|---|
| **Overlay** | `/overlay/` | Source navigateur dans OBS — affiche les modules sur le stream |
| **Dashboard (admin)** | `/admin/` | Interface de configuration — accessible depuis n'importe quel appareil |
| **Auth** | `/auth.html` | Page d'authentification Twitch OAuth |
| **Netlify Functions** | `/api/*` | Backend serverless — config, assets, modules store |
| **Netlify Blobs** | *(interne)* | Stockage persistant — config, assets, fichiers de modules store |

---

## 2. Déploiement

Le projet est déployé tel quel sur Netlify via glisser-déposer (Netlify Drop) ou via GitHub. Deux variables d'environnement sont requises côté Netlify :

- `TWITCH_CLIENT_ID` — Client ID de l'application Twitch déclarée sur dev.twitch.tv
- `TWITCH_CLIENT_SECRET` — Client Secret associé

Une troisième variable optionnelle permet d'accéder au repo store privé :

- `GITHUB_TOKEN` — Token GitHub avec accès en lecture sur `bk-coding/openoverlay-store`

---

## 3. Authentification Twitch

Le flux d'authentification utilise **OAuth 2.0 Authorization Code avec PKCE** :

1. L'utilisateur clique "Se connecter avec Twitch" sur `/auth.html`
2. Redirection vers `id.twitch.tv/oauth2/authorize` avec `code_verifier` (PKCE)
3. Twitch redirige vers `/auth.html?code=...`
4. Le client envoie le code à `POST /.netlify/functions/token-exchange` — la fonction injecte `client_secret` côté serveur (non exposé au navigateur) et retourne `access_token` + `refresh_token`
5. `access_token`, `refresh_token`, `broadcaster_id` et `channel_name` sont stockés dans **localStorage**
6. À chaque appel API, le token est validé côté serveur via `https://id.twitch.tv/oauth2/validate` (cache 60 s)

> **localStorage** : seul l'état d'authentification est stocké en localStorage. Toutes les données métier (config, assets, modules) sont dans Netlify Blobs.

---

## 4. Stockage — Netlify Blobs

Tous les données persistantes sont stockées dans **Netlify Blobs**, une base clé/valeur managée par Netlify. Elles sont **privées** et **liées à chaque utilisateur** par son login Twitch.

| Store Blobs | Clé | Contenu |
|---|---|---|
| `overlay-config` | `<username>` | Config JSON de l'utilisateur (max 100 KB) |
| `overlay-assets` | `<username>/<filename>` | Assets uploadés (GIFs, sons, images) |
| `overlay-user-mods` | `<username>/<modId>/<filename>` | Fichiers des modules store installés |
| `overlay-history` | `<username>` | Historique des événements Twitch |

Aucun fichier n'est stocké en local sur l'appareil de l'utilisateur (hors token OAuth).

---

## 5. Configuration

La config est un objet JSON unique par utilisateur, structuré par `configKey` de chaque module :

```json
{
  "alerts":          { "enabled": true, "sound": "user://alert.mp3", ... },
  "ticker":          { "enabled": false, "messages": [...], ... },
  "mon_mod_store":   { "enabled": true, ... }
}
```

**Flux de lecture** :
1. `/config.json` — valeurs par défaut globales du déploiement (statique)
2. `defaultConfig` de chaque manifest — valeurs par défaut par module
3. Netlify Blobs (`/api/config`) — préférences sauvegardées de l'utilisateur
4. Fusion profonde (`OO.deepMerge`) dans cet ordre de priorité (3 > 2 > 1)

**Flux d'écriture** :
1. L'utilisateur modifie un réglage dans le dashboard → `markDirty()` (barre de sauvegarde)
2. L'utilisateur clique "Enregistrer" → `POST /api/config` → stocké dans Netlify Blobs
3. Le dashboard envoie `{ type: 'config_reload' }` via **BroadcastChannel** à l'overlay
4. L'overlay recharge la config et rappelle `onConfigReload(api)` sur tous les modules

---

## 6. Communication dashboard ↔ overlay

Les deux pages (dashboard et overlay) sont ouvertes simultanément sur le même navigateur. Elles communiquent en temps réel via l'API **BroadcastChannel** (canal `'twitch-overlay-admin'`), sans serveur intermédiaire.

| Émetteur | Récepteur | Type de message | Usage |
|---|---|---|---|
| Dashboard | Overlay | `config_reload` | Config sauvegardée → l'overlay se met à jour |
| Dashboard | Overlay | `[modId]_[action]` | Envoi manuel depuis un module admin (ex. `ticker_update`) |
| Overlay | Dashboard | `oo:event` | Notifie le dashboard d'un événement Twitch reçu |
| Overlay | Dashboard | `oo:history` | Met à jour l'historique en temps réel |

> Le BroadcastChannel ne fonctionne qu'entre onglets **du même navigateur sur le même appareil**. Il ne traverse pas Internet.

---

## 7. Connexions Twitch temps réel (overlay)

L'overlay établit deux connexions WebSocket au démarrage :

### 7.1 Twitch EventSub (`wss://eventsub.wss.twitch.tv/ws`)

Reçoit tous les événements Twitch abonnés :

| Événement | Description |
|---|---|
| `channel.follow` | Nouveau follow |
| `channel.subscribe` | Nouvel abonnement |
| `channel.subscription.gift` | Abonnement offert |
| `channel.subscription.message` | Ré-abonnement avec message |
| `channel.cheer` | Bits |
| `channel.raid` | Raid entrant |
| `channel.channel_points_custom_reward_redemption.add` | Récompense de points de chaîne |
| `stream.online` / `stream.offline` | Démarrage / fin du live |
| `channel.prediction.begin` / `.end` | Prédiction |
| `channel.poll.begin` / `.end` | Sondage |

Chaque événement est dispatché à tous les modules via `OO.Mods.dispatch('onTwitchEvent', type, event, api)`.

### 7.2 Twitch IRC (`wss://irc-ws.chat.twitch.tv`)

Reçoit et envoie les messages du chat Twitch.

- **Réception** : chaque message `!commande` déclenche `OO.Mods.dispatch('onChatCommand', cmd, args, api, sender)`
- **Émission** : `api.sendChat(text)` → envoie `PRIVMSG` sur le WebSocket IRC

**Objet `sender`** passé à `onChatCommand` :

```js
{
  login:         string,   // login Twitch (minuscules)
  displayName:   string,   // nom affiché
  isBroadcaster: boolean,
  isMod:         boolean,
  isVip:         boolean,
  isSubscriber:  boolean,
}
```

Les deux WebSockets se reconnectent automatiquement en cas de coupure (backoff exponentiel jusqu'à 60 s).

---

## 8. Modules — architecture

### 8.1 Modules intégrés (built-in)

Inclus dans le dépôt principal. Listés dans `mods/index.json`. Chargés depuis `/mods/<id>/` (fichiers statiques servis par Netlify).

| ID | Nom |
|---|---|
| `alerts` | Alertes animées |
| `channel_points` | Points de chaîne |
| `logo` | Logo animé |
| `series` | Série / jeu en cours |
| `cmds` | Commandes chat + QR code |
| `ticker` | Bandeau défilant |

### 8.2 Modules store (optionnels)

Hébergés dans le dépôt `bk-coding/openoverlay-store` (GitHub). Installés à la demande depuis le dashboard. Stockés dans Netlify Blobs après installation.

### 8.3 Structure d'un module

```
mods/<id>/
├── manifest.json    ← métadonnées, defaultConfig, version, changelog
├── overlay.js       ← logique overlay : OO.Mods.register({id, hooks…})
├── overlay.html     ← HTML injecté dans l'overlay
├── overlay.css      ← styles overlay
├── admin.js         ← interface dashboard : OO.Admin.register({id, render, getCommands})
└── admin.css        ← styles dashboard
```

---

## 9. Installation d'un module store

L'utilisateur clique **"Installer"** dans la section Store du dashboard. Le flux serveur est le suivant :

```
Dashboard (client)
  │  POST /api/mod-install
  │  { source: 'store', modId: 'discord' }
  │  Authorization: Bearer <token>
  ▼
mod-install.mjs (Netlify Function)
  │  1. Valide le token Twitch → login
  │  2. Lit catalog.json depuis le repo store (GitHub API)
  │  3. Vérifie que modId existe dans le catalogue
  │  4. Récupère manifest.json depuis le repo store
  │  5. Télécharge chaque fichier autorisé (overlay.js, admin.js…)
  │     depuis raw.githubusercontent.com avec GITHUB_TOKEN
  │  6. Stocke chaque fichier dans Netlify Blobs
  │     clé : <login>/<modId>/<filename>
  ▼
{ ok: true, id: 'discord', name: 'Discord Live Alert' }
```

Le dashboard affiche une invitation à recharger la page. Au rechargement, le module est chargé depuis les Blobs.

**Chargement depuis les Blobs :**

```
admin.js
  │  GET /api/mod-install?user=<login>
  │  → liste des manifests installés
  │
  │  Pour chaque mod :
  │  GET /api/mod-install?user=<login>&mod=<id>&file=admin.js  (auth requise)
  │  GET /api/mod-install?user=<login>&mod=<id>&file=admin.css
  │  → fichiers lus depuis Netlify Blobs
  │  → scripts injectés via Blob URL (blob:) pour respecter la CSP
```

---

## 10. Mode développeur

Permet d'installer un module sans le publier sur le store. Disponible depuis la section Store du dashboard.

```
POST /api/mod-install
{
  source: 'developer',
  files: {
    'manifest.json': '<base64>',
    'overlay.js':    '<base64>',
    'admin.js':      '<base64>',
    ...
  }
}
```

Le manifest est marqué `_devInstalled: true`. Le module est stocké dans les mêmes Blobs que les modules store.

---

## 11. Assets utilisateur

Les fichiers uploadés par l'utilisateur (GIFs, sons, images) sont stockés dans Netlify Blobs sous `overlay-assets/<username>/<filename>`.

- **Upload** : `tools.uploadAsset(file)` → `POST /api/asset` → retourne `user://filename`
- **Résolution** : `api.resolveAsset('user://filename')` → `GET /api/asset?filename=...` → URL signée ou contenu direct

Les assets sont référencés dans la config par le préfixe `user://`, qui est résolu au moment du rendu côté overlay.

---

## 12. Namespace `OO`

`window.OO` est défini dans `assets/js/utils.js` (chargé en premier sur les deux pages).

| Propriété | Définie dans | Rôle |
|---|---|---|
| `OO.escHtml(str)` | `utils.js` | Échappe le HTML |
| `OO.deepMerge(a, b)` | `utils.js` | Fusion profonde d'objets |
| `OO.loadScript(url, opts?)` | `utils.js` | Charge un script dynamiquement |
| `OO.fmt(template, vars)` | `utils.js` | Interpolation de templates (`{var}`) |
| `OO.anim(el, cls, ms)` | `utils.js` | Animation temporaire par classe CSS |
| `OO.AlertQueue` | `utils.js` | File d'attente d'alertes avec délai |
| `OO.Mods` | `overlay/overlay.js` | Registre des modules overlay |
| `OO.Admin` | `admin/admin.js` | Registre des modules dashboard |

**Aliases dépréciés** (rétro-compatibilité uniquement) :
- `window.OverlayMods = OO.Mods`
- `window.AdminMods = OO.Admin`

---

## 13. Cycle de vie d'un module

### Overlay

```
OO.Mods.register({ id, init, onTwitchEvent, onChatCommand,
                   onAdminMessage, onConfigReload, onFirstChatter })
         ↓
init(api)                    ← au démarrage, config chargée
onConfigReload(api)          ← après chaque sauvegarde depuis le dashboard
onTwitchEvent(type, ev, api) ← à chaque événement Twitch
onChatCommand(cmd, args, api, sender)  ← à chaque message !commande
onAdminMessage(data, api)    ← à chaque message BroadcastChannel
onFirstChatter(user, isFirstEver, api) ← premier message du stream
```

### Dashboard

```
OO.Admin.register({ id, render, getCommands })
         ↓
render(config, container, tools)  ← à chaque navigation vers ce module
getCommands(config)               ← pour alimenter le tableau "Commandes chat"
```

---

*Dernière mise à jour : juin 2026.*
