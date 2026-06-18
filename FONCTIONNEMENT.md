# Principe de fonctionnement — OpenOverlay

> Document de référence technique. Décrit exactement comment le système fonctionne, de l'authentification au chargement des modules. À maintenir à jour à chaque évolution de l'architecture.

---

## 1. Vue d'ensemble

OpenOverlay est une application web hébergée sur **Netlify**. Elle ne nécessite aucun serveur local ni installation : le streamer la déploie sur son propre compte Netlify (plan gratuit) en y déposant le dossier du projet.

Le système se compose de :

| Composant | URL | Rôle |
|---|---|---|
| **Overlay** | `/overlay/` | Source navigateur dans OBS — affiche les modules sur le stream. Au chargement, affiche « ● OpenOverlay » sur fond transparent (masqué en fin d'init) |
| **Dashboard (admin)** | `/admin/` | Interface de configuration — accessible depuis n'importe quel appareil |
| **Auth** | `/auth.html` | Page d'authentification Twitch OAuth + configuration initiale du Client ID |
| **Netlify Functions** | `/api/*` | Backend serverless — config, assets, modules store, économie, historique, Nexus, proxy IA optionnel |
| **Netlify Blobs** | *(interne)* | Stockage persistant — config, assets, fichiers de modules store, historique, économie |

La version de l'instance est lue dans `/package.json` (publié par Netlify) — source unique de vérité, utilisée notamment pour la vérification `minSystemVersion` des modules.

---

## 2. Déploiement

Le projet est déployé tel quel sur Netlify via glisser-déposer (Netlify Drop) ou via GitHub. Variables d'environnement côté Netlify :

| Variable | Requis | Rôle |
|---|---|---|
| `TWITCH_CLIENT_ID` | ✅ | Client ID de l'application Twitch déclarée sur dev.twitch.tv |
| `TWITCH_CLIENT_SECRET` | ✅ | Client Secret associé (jamais exposé au navigateur) |
| `OPENOVERLAY_STORE_API_URL` | optionnel | API Store centrale alternative en développement (défaut : `https://store.openoverlay.fr/api/store`) |
| `OPENOVERLAY_NEXUS_API_URL` | optionnel | API Nexus centrale alternative en développement |
| `OPENOVERLAY_AI_API_KEY` | optionnel | Clé du fournisseur IA compatible OpenAI, utilisée uniquement côté serveur par `/api/ai` |
| `OPENOVERLAY_AI_PROVIDER` | optionnel | `openai`, `openrouter` ou `custom` (défaut : `openai`) |
| `OPENOVERLAY_AI_MODEL` | optionnel | Modèle IA à utiliser (défaut : `gpt-4o-mini`) |
| `OPENOVERLAY_AI_BASE_URL` | optionnel | Base URL OpenAI-compatible pour OpenRouter/custom |

---

## 3. Authentification Twitch

Le flux d'authentification utilise **OAuth 2.0 Authorization Code avec PKCE** :

1. L'utilisateur clique "Se connecter avec Twitch" sur `/auth.html`
2. Redirection vers `id.twitch.tv/oauth2/authorize` avec `code_challenge` (PKCE) et `state` anti-CSRF
3. Twitch redirige vers `/auth.html?code=...` — le `state` est vérifié
4. Le client envoie le code à `POST /api/token-exchange` — la fonction injecte `client_secret` côté serveur et retourne `access_token` + `refresh_token` (endpoint rate-limité : 10 req/min/IP)
5. Les credentials sont stockés dans **localStorage** sous les clés `oo_*`
6. À chaque appel API, le token est validé côté serveur via `https://id.twitch.tv/oauth2/validate` (module partagé `_auth.mjs`, cache 60 s) avec vérification d'appartenance (`login === user`)

**Clés localStorage (préfixe `oo_`, système ≥ 1.24.0)** : `oo_token`, `oo_refresh_token`, `oo_token_expires`, `oo_broadcaster_id`, `oo_channel`, `oo_client_id`, `oo_config_<login>`, `oo_test_username`, `oo_dev_mode`. Les anciennes clés `twitch_*`/`overlay_*` sont migrées automatiquement (déplacées) par `utils.js` au chargement.

> **localStorage** : seul l'état d'authentification et quelques préférences locales y sont stockés. Toutes les données métier (config, assets, modules) sont dans Netlify Blobs.

---

## 4. Stockage — Netlify Blobs

Toutes les données persistantes sont stockées dans **Netlify Blobs**, une base clé/valeur managée par Netlify. Elles sont **privées** et **liées à chaque utilisateur** par son login Twitch.

| Store Blobs | Clé | Contenu |
|---|---|---|
| `overlay-configs` | `<login>` | Config JSON de l'utilisateur (max 100 Ko) |
| `overlay-assets` | `<login>/<filename>` | Assets uploadés — 3 Mo/fichier, **50 fichiers max par utilisateur** |
| `overlay-user-mods` | `<login>/<modId>/<filename>` | Fichiers des modules store installés |
| `overlay-history` | `<login>` | Historique des événements (100 max, événements Twitch + événements de modules) |
| `overlay-economy` | `<login>/viewers/<viewer>`, `<login>/log`, `<login>/followers` | Économie virtuelle (mod stream_coins) |
| `overlay-mobile-status` | `<login>` | Statut mobile (batterie, réseau, ville) — lecture réservée au propriétaire |
| *(Store central)* | — | Accès Nexus et polling Tipeee vivent dans `openoverlay-store`, pas dans l'instance ZIP utilisateur |

Aucun fichier n'est stocké en local sur l'appareil de l'utilisateur (hors localStorage d'authentification).

---

## 5. Configuration

La config est un objet JSON unique par utilisateur, structuré par `configKey` de chaque module :

```json
{
  "alerts":          { "enabled": true, "sound": "user://alert.mp3" },
  "ticker":          { "enabled": false, "messages": [] },
  "mon_mod_store":   { "enabled": true }
}
```

**Flux de lecture** :
1. `/config.json` — valeurs par défaut globales du déploiement (statique)
2. `defaultConfig` de chaque manifest — valeurs par défaut par module
3. Netlify Blobs (`/api/config`) — préférences sauvegardées de l'utilisateur
4. Fusion profonde (`OO.deepMerge`) dans cet ordre de priorité (3 > 2 > 1)

**Flux d'écriture** :
1. L'utilisateur modifie un réglage dans le dashboard → `markDirty()` (barre de sauvegarde)
2. L'utilisateur clique "Sauvegarder" → `POST /api/config` → stocké dans Netlify Blobs
3. Le dashboard envoie `{ type: 'config_reload' }` via **BroadcastChannel** à l'overlay
4. L'overlay recharge la config et rappelle `onConfigReload(api)` sur tous les modules

---

## 6. Communication dashboard ↔ overlay

Les deux pages communiquent en temps réel via l'API **BroadcastChannel** — canal **`OO.CHANNEL`** (`'oo-admin'`, système ≥ 1.24.0 ; jamais de chaîne en dur), sans serveur intermédiaire.

| Émetteur | Récepteur | Type de message | Usage |
|---|---|---|---|
| Dashboard | Overlay | `config_reload` | Config sauvegardée → l'overlay se met à jour |
| Dashboard | Overlay | `test_alert`, `test_cp`, `[modId]_[action]` | Tests et actions manuelles depuis un module admin |
| Overlay | Dashboard | `twitch_event` | Événement Twitch ou événement de module → historique en temps réel |

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
| `channel.hype_train.begin` / `.end` | Hype train |
| `channel.shoutout.create` | Shoutout |
| `channel.ban` | Bannissement |

Chaque événement est dispatché à tous les modules via `OO.Mods.dispatch('onTwitchEvent', type, event, api)`, puis persisté dans l'historique (`postHistory()` → `POST /api/history` + notification BroadcastChannel).

### 7.2 Twitch IRC (`wss://irc-ws.chat.twitch.tv`)

Reçoit et envoie les messages du chat Twitch.

- **Réception** : chaque message déclenche `onChatMessage` ; chaque `!commande` déclenche `OO.Mods.dispatch('onChatCommand', cmd, args, api, sender)` + un événement DOM `oo:cmd`
- **Émission** : `api.sendChat(text)` → envoie `PRIVMSG` sur le WebSocket IRC (anti-doublon multi-onglets, 4 s)

**Objet `sender`** passé à `onChatCommand` :

```js
{
  userId:        string,
  login:         string,   // login Twitch (minuscules)
  displayName:   string,
  isBroadcaster: boolean,
  isMod:         boolean,
  isVip:         boolean,
  isSubscriber:  boolean,
}
```

**Commandes core** (gérées par overlay.js, hors mods) : `!titre` (broadcaster) et la **commande d'aide** (`config.commands_help`, configurable dans Outils → Commandes du dashboard) — le viewer la tape et reçoit en chuchotement (`api.sendWhisper`, scope `user:manage:whispers`) la liste des commandes auxquelles son niveau d'accès donne droit, collectée via les `getCommands()` des mods overlay. Cooldown 30 s par viewer. Après tentative, un message chat public confirme l'envoi ou signale l'échec — la liste elle-même n'est jamais exposée publiquement. Si c'est le broadcaster qui tape la commande, aucun effet (Twitch interdit de se chuchoter à soi-même) ; utiliser l'outil Commandes du dashboard à la place.

Les deux WebSockets se reconnectent automatiquement en cas de coupure (backoff exponentiel jusqu'à 60 s).

---

## 8. Modules — architecture

### 8.1 Modules intégrés (built-in)

Inclus dans le dépôt principal. Listés dans `mods/index.json` (généré au build par `scripts/gen-mods-index.js`). Chargés depuis `/mods/<id>/` (fichiers statiques servis par Netlify).

| ID | Nom |
|---|---|
| `alerts` | Alertes animées |
| `channel_points` | Points de chaîne (sync Twitch : activation, cooldown, limites par stream / par viewer) |
| `logo` | Logo animé |
| `series` | Série / jeu en cours |
| `cmds` | Commandes chat + QR code |
| `ticker` | Bandeau défilant |

### 8.2 Modules store (optionnels)

Hébergés et servis par le **Store central** (`openoverlay-store`). L'instance ZIP utilisateur ne lit pas directement le dépôt GitHub du Store : elle passe par l'API centrale, puis copie les fichiers installés dans ses propres Netlify Blobs.

Un manifest peut déclarer **`minSystemVersion`** : si l'instance est plus ancienne, le dashboard masque l'installation/mise à jour (badge « Requiert OpenOverlay ≥ x.y.z ») et le serveur refuse avec un `409 system_outdated`. Les modules **premium** (`premium: true` dans le catalogue) nécessitent un accès **Nexus** actif validé par l'API centrale du Store. Les grants Nexus et le polling Tipeee ne vivent pas dans les instances ZIP utilisateur.

### 8.3 Structure d'un module

```
mods/<id>/
├── manifest.json    ← métadonnées, defaultConfig, version, changelog, minSystemVersion?
├── overlay.js       ← logique overlay : OO.Mods.register({id, hooks…})
├── overlay.html     ← HTML injecté dans l'overlay
├── overlay.css      ← styles overlay
├── admin.js         ← interface dashboard : OO.Admin.register({id, render, getCommands})
└── admin.css        ← styles dashboard
```

---

## 9. Installation d'un module store

L'utilisateur clique **"Installer"** dans la section Store du dashboard (ou **"⬆ Tout mettre à jour"** quand plusieurs mises à jour sont disponibles — installations séquentielles). Le flux serveur :

```
Dashboard (client)
  │  POST /api/mod-install
  │  { source: 'store', modId: 'discord' }
  │  Authorization: Bearer ***
  ▼
mod-install.mjs (Netlify Function de l'instance)
  │  1. Valide le token Twitch → login
  │  2. Lit catalog.json via l'API Store centrale (/api/store)
  │  3. Vérifie que modId existe dans le catalogue
  │  4. Si premium : vérifie l'accès Nexus via l'API centrale (/api/nexus/validate)
  │  5. Récupère manifest.json public depuis le Store central
  │  6. Vérifie minSystemVersion contre la version de l'instance (409 si trop ancienne)
  │  7. Télécharge chaque fichier déclaré par le manifest via le Store central
  │     (manifest.json, overlay.js, admin.js requis ; échec explicite si un fichier manque)
  │  8. Stocke les fichiers dans Netlify Blobs
  │     clé : <login>/<modId>/<filename>
  ▼
{ ok: true, id: 'discord', name: 'Discord Live Alert' }
```

Le dashboard confirme la disponibilité réelle (polling) puis invite à recharger la page. Au rechargement, le module est chargé depuis les Blobs.

**Chargement depuis les Blobs :**

```
admin.js
  │  GET /api/mod-install?user=<login>                          (auth requise)
  │  → liste des manifests installés
  │
  │  Pour chaque mod :
  │  GET /api/mod-install?user=<login>&mod=<id>&file=admin.js   (auth requise)
  │  GET /api/mod-install?user=<login>&mod=<id>&file=admin.css
  │  → fichiers lus depuis Netlify Blobs
  │  → scripts injectés via Blob URL (blob:) pour respecter la CSP
```

---

## 10. Mode développeur

Permet d'installer un module sans le publier sur le store. Activable dans le dashboard (avec avertissement de sécurité).

```
POST /api/mod-install
{
  source: 'developer',
  files: {
    'manifest.json': '<base64>',
    'overlay.js':    '<base64>',
    ...
  }
}
```

Le manifest est marqué `_devInstalled: true` (500 Ko max par fichier). `minSystemVersion` est vérifié comme pour le store. Le module est stocké dans les mêmes Blobs que les modules store.

---

## 11. Assets utilisateur

Les fichiers uploadés (GIFs, sons, images) sont stockés dans Netlify Blobs sous `overlay-assets/<login>/<filename>`.

- **Upload** : `tools.uploadAsset(file)` → `POST /api/asset?filename=<name>` avec body JSON `{ mimeType, data }` (base64) → retourne `{ ok, path: "user://<name>" }`. Limites : **3 Mo/fichier**, **50 fichiers/utilisateur** (l'écrasement reste permis)
- **Suppression** : `DELETE /api/asset?filename=<name>` (auth) → `{ ok: true }`
- **Liste** : `GET /api/assets` (auth) → `{ files: [{ name, path, mimeType }] }`
- **Résolution** : `api.resolveAsset('user://<name>')` → `/api/asset?user=<login>&file=<name>` (lecture publique — nécessaire pour l'overlay)

Les assets sont référencés dans la config par le préfixe `user://`, résolu au moment du rendu.

### Gestionnaire dans le dashboard

La section **Outils → Mes fichiers** liste tous les fichiers uploadés avec aperçu (miniature ou lecteur audio), upload et suppression.

### Pattern admin — createAssetField

Dans les mods, ne jamais gérer l'upload manuellement. Utiliser `tools.createAssetField({ type, value, onChange })` qui retourne un `<div class="asset-field">` contenant un sélecteur (assets intégrés + fichiers uploadés), un bouton d'upload (drag & drop supporté) et une prévisualisation automatique.

```js
container.querySelector('#mon-asset-field').replaceWith(
  createAssetField({
    type: 'sound',          // 'image', 'gif' ou 'sound'
    value: cfg.sound ?? '',
    onChange: (path) => { cfg.sound = path; markDirty(); },
  })
);
```

---

## 12. Proxy IA optionnel

`POST /api/ai` fournit un proxy IA sécurisé pour les modules. Il est authentifié par token Twitch, rate-limité, borné en taille et ne supporte que des tâches cadrées. Première tâche disponible : `stream_summary`.

```js
await api.ai('stream_summary', {
  messages,
  participants,
  events,
  highlights,
  style: 'chaleureux et drôle',
}, { modId: 'generique' });
```

La clé fournisseur reste dans les variables Netlify `OPENOVERLAY_AI_*`. Les modules ne doivent pas stocker de clé API IA dans leur configuration front et doivent conserver un fallback local quand `/api/ai` retourne `ai_not_configured` ou qu'une ancienne instance ne fournit pas encore `api.ai`.

---

## 13. Historique

L'onglet **Historique** du dashboard conserve les **100 derniers événements** (Netlify Blobs, `overlay-history`).

- **Événements Twitch** : postés automatiquement par l'overlay à chaque notification EventSub
- **Événements de modules** (système ≥ 1.26.0) : un mod overlay appelle `api.logEvent?.({ modId, label, icon?, user?, detail? })` — stocké en `eventType: "mod:<id>"`, affiché avec l'icône/libellé fournis (ex. stream_coins : achats boutique 🛒, montées de rang 🏅)
- Affichage : date + heure (`JJ/MM HH:MM`), mise à jour **en temps réel** via BroadcastChannel si l'onglet est ouvert

---

## 14. Namespace `OO`

`window.OO` est défini dans `assets/js/utils.js` (chargé en premier sur les trois pages : overlay, admin, auth). Il affiche la signature console OpenOverlay et exécute la migration des anciennes clés localStorage.

| Propriété | Rôle |
|---|---|
| `OO.CHANNEL` | Nom du BroadcastChannel admin ↔ overlay (`'oo-admin'`) |
| `OO.escHtml(str)` | Échappe le HTML |
| `OO.deepMerge(a, b)` | Fusion profonde d'objets (protégée contre la prototype pollution) |
| `OO.loadScript(url, headers?)` | Charge un script (Blob URL si headers d'auth) |
| `OO.fmt(template, vars)` | Interpolation de templates (`{var}`) |
| `OO.semverCompare(a, b)` | Comparaison semver → -1/0/1 (utilisée pour `minSystemVersion`) |
| `OO.anim(el, keyframes, options)` | Wrapper `Element.animate()` → Promise |
| `OO.AlertQueue` | File d'alertes séquentielles avec compteur de génération |
| `OO.Mods` | Registre des modules overlay (`overlay/overlay.js`) |
| `OO.Admin` | Registre des modules dashboard (`admin/admin.js`) |

**Aliases dépréciés** (rétro-compatibilité uniquement) : `window.OverlayMods = OO.Mods`, `window.AdminMods = OO.Admin`.

---

## 15. Cycle de vie d'un module

### Overlay

```
OO.Mods.register({ id, init, onTwitchEvent, onChatCommand, onChatMessage,
                   onAdminMessage, onConfigReload, onFirstChatter })
         ↓
init(api)                    ← au démarrage, config chargée
onConfigReload(api)          ← après chaque sauvegarde depuis le dashboard
onTwitchEvent(type, ev, api) ← à chaque événement Twitch
onChatMessage(text, api, sender)       ← à chaque message du chat
onChatCommand(cmd, args, api, sender)  ← à chaque message !commande
onAdminMessage(data, api)    ← à chaque message BroadcastChannel
onFirstChatter(user, isFirstEver, api) ← premier message d'un viewer (session/historique)
```

L'objet `api` expose notamment : `config`, `token`, `broadcasterId`, `channelName`, `sendChat`, `sendWhisper`, `playSound`, `resolveAsset`, `checkPermission`, `getMod`, `emit`, `trigger`, `twitchFetch`, `ai`, `logEvent`.

### Dashboard

```
OO.Admin.register({ id, render, getCommands })
         ↓
render(config, container, tools)  ← à chaque navigation vers ce module
getCommands(config)               ← alimente l'onglet "Commandes" (et la détection de conflits de noms)
```

---

## 16. Sécurité

- **Secrets** : exclusivement en variables d'environnement Netlify — jamais dans le code ni exposés au navigateur
- **CSP stricte** (netlify.toml) : pas de script inline, `script-src 'self' blob:`, frame-ancestors none
- **Validation serveur** : token Twitch validé (`_auth.mjs`, cache 60 s) + contrôle d'appartenance `login === user` sur toutes les API utilisateur
- **Rate limiting** (`_ratelimit.mjs`, par IP) : token-exchange (10/min), mobile-status (GET 60/min, POST 10/min), nexus-validate (30/min), nexus-admin (10/min), ai (12/min)
- **Bornes** : config 100 Ko, historique POST 10 Ko, assets 3 Mo × 50 fichiers, fichiers dev 500 Ko + payload dev global 5 Mo, proxy IA 80 Ko
- **Échappement HTML** systématique (`OO.escHtml` / `textContent`) pour tout contenu issu des viewers

---

*Dernière mise à jour : 14 juin 2026 — système v1.32.0.*
