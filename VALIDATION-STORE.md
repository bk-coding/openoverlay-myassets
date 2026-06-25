# VALIDATION_MOD.md — Référence de validation des modules OpenOverlay

> Document de référence pour la revue humaine assistée par IA des modules proposés à la soumission au Store OpenOverlay.
>
> Objectif : décider si un module peut être accepté, refusé ou renvoyé en correction, en contrôlant **structure**, **sécurité**, **compatibilité système**, **UX streamer**, **qualité technique**, **documentation**, **tests** et **alignement avec l'architecture OpenOverlay**.

---

## 0. Décision de revue

Chaque revue doit produire une décision explicite :

| Décision | Signification |
|---|---|
| **ACCEPTÉ** | Le module respecte toutes les règles bloquantes, les tests passent, les réserves restantes sont mineures. |
| **CORRECTIONS REQUISES** | Le module est prometteur mais viole une ou plusieurs règles non critiques ou manque de preuves de test. |
| **REFUSÉ / BLOQUANT** | Le module viole une règle de sécurité, d'architecture, de confidentialité, de compatibilité ou de confiance. |

Une validation ne doit jamais se limiter à « le code a l'air bon ». Elle doit lister :

1. les fichiers examinés ;
2. les tests exécutés ;
3. les points conformes ;
4. les écarts ;
5. les risques ;
6. la décision finale.

---

## 1. Périmètre d'un module Store

Un module Store OpenOverlay est un dossier :

```text
mods/<id>/
├── manifest.json
├── overlay.js
├── overlay.html
├── overlay.css
├── admin.js
├── admin.css
└── preview/              # optionnel : captures d'écran / médias de présentation
```

Les fichiers requis pour une soumission Store sont :

- `manifest.json`
- `overlay.js`
- `overlay.html`
- `overlay.css`
- `admin.js`
- `admin.css`

Un module peut avoir des fichiers supplémentaires uniquement s'ils sont :

- déclarés dans `manifest.json.files` ;
- nécessaires au fonctionnement ou à la présentation ;
- non dangereux ;
- compatibles avec le modèle de chargement Store ;
- validés par la revue.

---

## 2. Architecture OpenOverlay à respecter

### 2.1 Séparation des responsabilités

Le module doit respecter le modèle OpenOverlay :

- **overlay.js / overlay.html / overlay.css** : rendu stream, événements Twitch, commandes chat, animation, logique visible côté overlay.
- **admin.js / admin.css** : interface de configuration dans le dashboard.
- **manifest.json** : métadonnées, configuration par défaut, fichiers, version, changelog.
- **Store central** : distribution, catalogue, protection des fichiers de code, validation Nexus.
- **Instance OpenOverlay du streamer** : stockage de la config, assets utilisateur, modules installés, proxy IA optionnel.

### 2.2 Interdictions architecturales bloquantes

Refuser le module si :

- il tente de modifier le core OpenOverlay ;
- il dépend d'un patch manuel dans `openoverlay` pour fonctionner, sauf évolution système explicitement acceptée ;
- il modifie directement le DOM, la config ou l'état d'un autre module ;
- il suppose que les modules sont chargés dans un ordre non garanti ;
- il réimplémente le Store, Nexus, l'auth Twitch, l'upload d'assets, l'historique ou le proxy IA au lieu d'utiliser les API existantes ;
- il contourne le Store central ou essaie de lire directement un dépôt GitHub privé/public pour installer du code ;
- il introduit une source de vérité Nexus locale dans l'instance utilisateur.

---

## 3. Convention d'identité et de nommage

### 3.1 Identifiant du module

Le champ `id`, le nom du dossier et `configKey` doivent être identiques sauf exception explicitement justifiée.

Règle de référence :

```text
^[a-z][a-z0-9_]*$
```

Exemples valides :

- `generique`
- `stream_coins`
- `mobile_status`

Refuser ou renvoyer en correction si :

- majuscules ;
- espaces ;
- accents ;
- caractères spéciaux ;
- identifiant ambigu ou générique (`test`, `mod`, `overlay`, `admin`) ;
- collision avec un module existant ou un module intégré ;
- `id`, dossier et `configKey` divergents sans justification forte.

### 3.2 Préfixage obligatoire

Tous les éléments propres au module doivent être préfixés par l'`id` ou une abréviation claire et unique :

- IDs HTML ;
- classes CSS spécifiques ;
- types de messages `sendToOverlay` ;
- clés de stockage local si exception acceptée ;
- variables globales éventuelles, qui doivent idéalement être évitées.

Exemple :

```text
generique_show
gen-command
.gen-roll
openoverlay:generique:v1:<channel>
```

---

## 4. Validation du `manifest.json`

### 4.1 JSON valide

Contrôles obligatoires :

```bash
python3 -m json.tool mods/<id>/manifest.json >/dev/null
```

Refuser si :

- JSON invalide ;
- commentaires dans JSON ;
- trailing commas ;
- encodage non UTF-8 ;
- structure racine autre qu'un objet.

### 4.2 Champs obligatoires

Le manifest doit contenir au minimum :

| Champ | Type | Règle |
|---|---|---|
| `id` | string | Identique au dossier, format `snake_case`. |
| `name` | string | Nom lisible, non vide, sans HTML. |
| `description` | string | Courte, claire, idéalement < 120 caractères, sans promesse trompeuse. |
| `icon` | string | Emoji ou symbole court. |
| `version` | string | SemVer `MAJOR.MINOR.PATCH`. |
| `author` | string | Auteur ou pseudo. |
| `configKey` | string | Identique à `id` sauf exception. |
| `types` | string[] | Une ou plusieurs catégories officielles. |
| `tags` | string[] | Tags utiles et cohérents. |
| `defaultConfig` | object | Inclut au minimum `enabled: true`. |
| `longDescription` | string | Description détaillée pour la fiche Store. |
| `screenshots` | string[] | Peut être `[]`, sinon chemins existants. |
| `files` | string[] | Liste complète des fichiers distribués. |
| `changelog` | object[] | Historique des versions. |

### 4.3 Types officiels

Valeurs autorisées dans `types` :

- `display` — affiche ou modifie un élément visuel dans l'overlay ;
- `widget` — widget persistant/autonome ;
- `chat` — écoute ou envoie des messages Twitch ;
- `events` — réagit aux événements Twitch ;
- `integration` — intègre un service externe ;
- `interactive` — implique une participation active des viewers.

Refuser ou corriger tout type non officiel.

### 4.4 Version et changelog

Règles :

- `version` suit `MAJOR.MINOR.PATCH`.
- La première entrée de `changelog` correspond à `version`.
- Chaque entrée de `changelog` contient :
  - `version` ;
  - `date` au format `YYYY-MM-DD` ;
  - `notes` lisibles.
- Les notes de changelog décrivent ce qui change réellement.
- Une mise à jour fonctionnelle incrémente la version.
- Une correction mineure incrémente au moins le patch.

Refuser si le changelog est absent, incohérent ou mensonger.

### 4.5 `defaultConfig`

Obligatoire :

```json
{
  "enabled": true
}
```

Si le module expose une commande chat :

- `command` sans `!` ;
- `commandPermission` avec une valeur standard ;
- toute commande secondaire doit aussi être configurable si elle peut entrer en conflit.

Valeurs de permission autorisées :

- `streamer`
- `moderator`
- `vip`
- `subscriber`
- `follower`
- `everyone`

Refuser si :

- une commande sensible est ouverte par défaut à `everyone` ;
- une permission est codée en dur sans configuration ;
- le module ne fournit pas de valeur par défaut robuste ;
- la config contient des secrets, tokens, clés API ou credentials.

### 4.6 `files`

Règles :

- tous les fichiers listés existent ;
- tous les fichiers nécessaires sont listés ;
- `manifest.json`, `overlay.js`, `overlay.html`, `overlay.css`, `admin.js`, `admin.css` sont présents sauf exception très justifiée ;
- pas de chemins absolus ;
- pas de `..` ;
- pas de fichiers cachés inutiles ;
- pas de build artifacts lourds ;
- pas de secrets ;
- pas de dépendance à `node_modules`.

Contrôle recommandé :

```bash
python3 - <<'PY'
import json, pathlib, sys
mod = pathlib.Path('mods/<id>')
manifest = json.loads((mod/'manifest.json').read_text(encoding='utf-8'))
missing = [f for f in manifest.get('files', []) if not (mod/f).is_file()]
if missing:
    print('missing files:', missing)
    sys.exit(1)
print('files ok')
PY
```

### 4.7 `minSystemVersion`

Le champ `minSystemVersion` est obligatoire si le module utilise une API introduite dans une version précise, par exemple :

- `api.logEvent` → système ≥ `1.26.0` ;
- `api.sendWhisper` ou commande d'aide basée sur `getCommands` overlay → système ≥ `1.30.0` ;
- `api.ai` / `/api/ai` → système ≥ `1.32.0` ;
- `OO.CHANNEL`, migration `oo_*`, helpers récents ou autres API non historiques → version minimale adaptée.

Refuser si le module utilise une API récente sans `minSystemVersion` cohérent.

### 4.8 Premium / Nexus

Si le module est premium :

- `catalog.json` doit contenir `{ "id": "<id>", "premium": true }` ;
- le manifest peut aussi indiquer clairement le caractère premium si utile pour l'affichage ;
- le module ne doit pas implémenter sa propre validation Nexus comme source de vérité ;
- l'accès est validé par le Store central / API Nexus ;
- aucune whitelist locale, aucun grant local, aucun secret Nexus dans le module.

Refuser si le module contient une validation premium contournable, une whitelist locale, un appel direct à un fichier de grants ou une logique Nexus propriétaire.

---

## 5. Validation du `catalog.json`

Pour une soumission au Store :

- `catalog.json` est un JSON valide ;
- le module y est présent une seule fois ;
- l'entrée minimale est `{ "id": "<id>" }` ;
- si premium : `{ "id": "<id>", "premium": true }` ;
- l'ordre du catalogue reste lisible et volontaire ;
- aucun module existant n'est supprimé ou modifié sans raison.

Contrôle :

```bash
python3 -m json.tool catalog.json >/dev/null
```

---

## 6. Validation de `overlay.js`

### 6.1 Syntaxe et enregistrement

Contrôles obligatoires :

```bash
node --check mods/<id>/overlay.js
```

Le fichier doit :

- appeler `OO.Mods.register({ id: '<id>', ... })` ;
- utiliser le même `id` que le manifest ;
- éviter les variables globales non nécessaires ;
- ne pas écraser `window.OO`, `OO.Mods`, `OO.Admin` ou des APIs core ;
- rester compatible navigateur moderne sans bundler.

### 6.2 Hooks autorisés

Hooks reconnus :

- `init(api)` ;
- `onConfigReload(api)` ;
- `onTwitchEvent(type, event, api)` ;
- `onChatMessage(text, api, sender)` ;
- `onChatCommand(cmd, args, api, sender)` ;
- `onAdminMessage(data, api)` ;
- `onFirstChatter(username, isFirstEver, api)` ;
- `getCommands(config)` si le module expose des commandes — alimente la commande d'aide : liste envoyée en chuchotement au viewer, confirmation (ou échec) en chat public, jamais la liste elle-même.

Tout hook custom doit être justifié et ne doit pas dépendre d'un dispatch core inexistant.

### 6.3 Respect de `enabled`

Chaque hook actif doit respecter la bascule :

```js
if (api.config.<configKey>?.enabled === false) return;
```

À vérifier en particulier pour :

- commandes chat ;
- réactions Twitch ;
- timers ;
- messages envoyés au chat ;
- sons ;
- animations ;
- intégrations externes.

### 6.4 Permissions chat

Pour chaque commande :

- comparer `cmd` en minuscules ;
- lire le niveau depuis la config ;
- utiliser `api.checkPermission(sender, level)` ;
- ne pas se fier uniquement à `sender.isMod`, `sender.isVip`, etc. ;
- le broadcaster doit toujours passer via la méthode officielle ;
- éviter les commandes destructrices ou coûteuses accessibles à `everyone`.

Exemple attendu :

```js
const level = cfg.commandPermission ?? 'moderator';
if (!api.checkPermission(sender, level)) return;
```

### 6.5 Commandes exposées

Si le module expose une ou plusieurs commandes, `overlay.js` doit fournir `getCommands(config)` au minimum sous la forme :

```js
getCommands(config) {
  const cfg = config.<configKey> || {};
  if (cfg.enabled === false) return [];
  return [{ cmd: '!commande', permission: cfg.commandPermission ?? 'moderator' }];
}
```

Le dashboard `admin.js` doit aussi exposer `getCommands(config)` pour l'onglet Commandes.

Refuser si les commandes existent mais ne sont pas déclarées, car elles ne seront pas visibles dans l'aide et les conflits ne seront pas détectables.

### 6.6 Twitch EventSub et IRC

Si le module utilise les événements Twitch :

- filtrer explicitement `type` ;
- gérer les champs absents sans crash ;
- ne pas supposer que tous les événements ont la même forme ;
- ne pas spammer le chat ou l'historique à chaque événement insignifiant ;
- ne pas conserver de données viewers non nécessaires.

Si le module lit chaque message chat :

- borner les buffers ;
- ignorer les bots si pertinent ;
- éviter les traitements lourds sur chaque message ;
- ne pas exfiltrer le chat vers un tiers sans nécessité, consentement explicite et documentation.

### 6.7 Envoi de messages chat

Pour `api.sendChat(text)` :

- messages courts, utiles, non répétitifs ;
- respecter les cooldowns internes et ajouter des cooldowns métier si nécessaire ;
- pas de spam automatique incontrôlé ;
- pas de contenu généré par viewers renvoyé sans échappement/filtrage ;
- pas de commande Twitch dangereuse (`/ban`, `/timeout`, `/mod`, etc.) sans garde forte et validation humaine.

### 6.8 Chuchotements

Pour `api.sendWhisper(toUserId, message)` :

- `minSystemVersion` ≥ `1.30.0` ;
- appeler via optional chaining si compatibilité souhaitée ;
- prévoir fallback `api.sendChat()` ou silence contrôlé ;
- ne jamais chuchoter des secrets ;
- respecter une limite de longueur.

### 6.9 Historique dashboard

Pour `api.logEvent?.({ modId, label, icon?, user?, detail? })` :

- `minSystemVersion` ≥ `1.26.0` ;
- utiliser optional chaining pour compatibilité ;
- `modId` et `label` obligatoires ;
- événements significatifs uniquement ;
- pas de logs verbeux ou messages chat bruts ;
- pas de données sensibles dans `detail`.

### 6.10 IA

Si le module propose de l'IA :

- utiliser `api.ai(task, input, { modId })` ou, pour compatibilité ancienne, un fallback direct vers `/api/ai` avec le token OpenOverlay ;
- `minSystemVersion` ≥ `1.32.0` si `api.ai` est requis ;
- ne jamais demander, stocker ou exposer une clé OpenAI/OpenRouter/autre dans le front ;
- ne jamais mettre de clé IA dans `defaultConfig`, localStorage ou le code ;
- conserver un fallback local lorsque l'IA est absente, non configurée, rate-limitée ou en erreur ;
- n'utiliser que les tâches cadrées disponibles (`stream_summary` actuellement) ;
- ne pas implémenter un proxy prompt libre arbitraire ;
- borner les entrées envoyées (messages, événements, highlights) ;
- documenter clairement ce qui est envoyé au fournisseur IA.

Refuser si le module contient un champ `apiKey`, `aiApiKey`, `openaiKey`, `providerKey` côté front ou une exfiltration IA non contrôlée.

### 6.11 Réseau externe et intégrations

Toute intégration externe doit être déclarée dans :

- manifest `types` avec `integration` ;
- `longDescription` ;
- documentation de configuration ;
- revue sécurité.

Règles :

- pas de secret embarqué ;
- pas de token codé en dur ;
- pas de tracking caché ;
- pas d'appel réseau inutile ;
- pas d'exfiltration de config, token Twitch, login viewers, chat ou événements sans justification ;
- URLs configurables uniquement si cela ne met pas en danger le streamer ;
- webhooks utilisateur traités comme sensibles ;
- erreurs réseau gérées sans casser l'overlay.

Refuser si un module contacte un domaine inconnu, opaque ou non documenté.

### 6.12 Stockage local

Règle générale : les données métier persistantes vont dans la config serveur / Netlify Blobs via le système, pas dans `localStorage`.

Exception acceptable : cache local **transitoire**, borné, non sensible, justifié par le fonctionnement overlay, par exemple une collecte chat de session pour un générique.

Conditions d'exception :

- clé préfixée `openoverlay:<id>:...` ou équivalent clairement namespacé ;
- pas de secrets ;
- pas de données d'autorité ;
- TTL/rétention configuré ;
- taille bornée ;
- suppression possible ;
- ne pas écraser de données mémoire plus fraîches lors d'un reload ;
- documentation dans la revue.

Refuser si `localStorage` contient token, clé API, grants Nexus, config d'autorité, données sensibles ou stockage illimité.

### 6.13 Timers, animations et performances

Vérifier :

- timers arrêtables ou inoffensifs ;
- pas de `setInterval` non borné sans nettoyage ou garde ;
- pas de boucle CPU ;
- pas de traitement lourd sur chaque frame ;
- pas d'animation qui bloque l'overlay ;
- buffers bornés ;
- DOM nettoyé après animation si nécessaire ;
- compatibilité OBS/browser source.

---

## 7. Validation de `overlay.html`

Règles :

- fragments HTML uniquement, pas de document complet (`<!DOCTYPE>`, `<html>`, `<head>`, `<body>` interdits) ;
- pas de `<script>` inline ;
- pas de handlers inline (`onclick=`, `onload=`, etc.) ;
- IDs/classes préfixés ;
- contenu initial caché si l'élément ne doit pas apparaître au chargement ;
- structure lisible et minimale ;
- pas d'iframe sans justification explicite ;
- pas d'asset externe non documenté ;
- pas de texte viewer injecté directement dans le HTML sans échappement côté JS.

---

## 8. Validation de `overlay.css`

Règles :

- classes préfixées par le module ;
- ne pas styler globalement `body`, `html`, `*`, `button`, `input`, etc. sans scope ;
- ne pas redéfinir les styles d'autres modules ;
- pas de `!important` sauf justification exceptionnelle ;
- pas d'import CSS externe ;
- animations nommées/préfixées ;
- respect du fond transparent ;
- lisibilité en 1280×720 ;
- pas de taille fixe qui casse l'overlay mobile/OBS sauf design volontaire ;
- z-index raisonnable et justifié ;
- pas de filtres/ombres très coûteux en boucle.

---

## 9. Validation de `admin.js`

### 9.1 Syntaxe et enregistrement

Contrôle obligatoire :

```bash
node --check mods/<id>/admin.js
```

Le fichier doit :

- appeler `OO.Admin.register({ id: '<id>', render, getCommands })` ;
- utiliser le même `id` que le manifest ;
- initialiser la config module si absente ;
- rendre dans `container` uniquement ;
- appeler `tools.markDirty()` après chaque modification de config.

### 9.2 `render(config, container, tools)`

Règles :

- commencer par une base claire, généralement `container.innerHTML = ...` ;
- ne pas modifier les sections d'autres modules ;
- ne pas attacher d'écouteurs globaux inutiles ;
- ne pas créer de fuite mémoire à chaque navigation ;
- échapper les valeurs injectées dans le HTML ;
- préserver les types de config (booléen, nombre, tableau, objet) ;
- valider/borner les inputs numériques ;
- afficher des hints utiles pour les réglages sensibles.

### 9.3 Helpers officiels

Utiliser les helpers officiels :

- `tools.markDirty()` ;
- `tools.sendToOverlay(data)` ;
- `tools.showToast(message, type?)` ;
- `tools.createAssetField({ type, value, onChange })` pour images/GIF/sons ;
- `tools.resolveAsset(path)` ;
- `tools.uploadAsset(file)` seulement si `createAssetField` ne suffit pas ;
- `tools.addDropZone(...)` ;
- `tools.twitchFetch(url, opts?)` ;
- `tools.permissionSelect(...)` ;
- `tools.testUsername` ;
- `tools.broadcasterId`.

Refuser ou corriger :

- upload manuel réimplémenté alors que `createAssetField` convient ;
- permissions codées à la main sans `permissionSelect` ;
- absence de `markDirty` ;
- champs secrets non nécessaires ;
- UX incompréhensible ou dangereuse.

### 9.4 `getCommands(config)` côté admin

Obligatoire, même si le module n'a aucune commande :

```js
getCommands(config) {
  return [];
}
```

Pour chaque commande :

- `cmd` inclut `!` ;
- `args` décrit les arguments ;
- `desc` est courte et claire ;
- `permission` ou `level` correspond au standard courant du dashboard ;
- le niveau vient de la config ;
- les commandes désactivées ne sont pas listées.

### 9.5 Messages admin → overlay

Tout message envoyé via `tools.sendToOverlay(data)` doit :

- contenir `type` ;
- utiliser la convention `[modId]_[action]` ;
- ne pas transporter de secrets ;
- ne pas transporter d'objets énormes ;
- être géré côté overlay dans `onAdminMessage` ;
- rester compatible avec le fait que BroadcastChannel ne traverse pas Internet.

---

## 10. Validation de `admin.css`

Règles :

- utiliser le framework CSS modules existant quand il couvre le besoin ;
- ne pas redéfinir les classes globales du dashboard ;
- classes spécifiques préfixées ;
- pas de sélecteurs globaux agressifs ;
- pas de `style="..."` dans `admin.js` pour les patterns couverts par le framework ;
- pas de `!important` sauf justification ;
- responsive minimal ;
- lisibilité en thème sombre ;
- contraste suffisant ;
- pas de rupture de layout de la page admin.

Classes framework à privilégier :

- `.mod-list-header`, `.mod-list`, `.mod-item`, `.mod-item-header`, `.mod-item-body`, `.span-full` ;
- `.cmd-prefix-row`, `.cmd-prefix`, `.cmd-hint`, `.input-mono`, `.input-narrow` ;
- `.field-inline`, `.field-inline-label` ;
- `.asset-field`, `.asset-img-preview`, `.asset-sound-preview`, `.asset-preview` ;
- `.pos-picker`, `.pos-btn` ;
- `.size-row`, `.size-val` ;
- `.badge`, `.badge-green`, `.badge-red`, `.badge-muted`.

---

## 11. Assets, médias et fichiers lourds

### 11.1 Assets utilisateur

Si un réglage accepte une image, un GIF ou un son utilisateur :

- stocker la valeur sous forme `user://<filename>` ;
- résoudre via `api.resolveAsset()` côté overlay ;
- utiliser `tools.createAssetField()` côté admin ;
- respecter les limites système : 3 Mo/fichier, 50 fichiers par utilisateur.

### 11.2 Assets embarqués dans le module

Acceptables si :

- listés dans `manifest.json.files` ;
- taille raisonnable ;
- licence claire ;
- pas de contenu protégé sans droit ;
- pas de fichiers exécutables ;
- pas de dépendance externe non maîtrisée.

Refuser :

- binaires opaques ;
- archives dans le module ;
- fichiers très lourds sans justification ;
- médias non libres ou non sourcés ;
- scripts déguisés en médias.

---

## 12. Sécurité et confidentialité

### 12.1 Secrets interdits

Refuser immédiatement si le module contient :

- token Twitch ;
- client secret ;
- clé OpenAI/OpenRouter/autre fournisseur IA ;
- webhook secret non utilisateur ou non documenté ;
- clé API Discord/YouTube/Tipeee/etc. ;
- cookie ;
- fichier `.env` ;
- grant Nexus ;
- credentials de test réels.

Recherche recommandée :

```bash
git grep -n -I -E "(api[_-]?key|secret|token|password|passwd|bearer|authorization|OPENAI|OPENROUTER|TWITCH_CLIENT_SECRET|GITHUB_TOKEN|NEXUS|webhook)" -- mods/<id>
```

Attention : une occurrence peut être légitime dans un texte d'aide, mais toute valeur réelle est bloquante.

### 12.2 APIs dangereuses

Examiner et justifier toute occurrence de :

- `eval` ;
- `new Function` ;
- `innerHTML` avec données non échappées ;
- `insertAdjacentHTML` avec données non échappées ;
- `document.write` ;
- `Function(...)` ;
- `setTimeout(string)` / `setInterval(string)` ;
- accès global à `window` non nécessaire ;
- `localStorage` ;
- `sessionStorage` ;
- `indexedDB` ;
- `fetch` vers domaine externe ;
- WebSocket externe ;
- iframe ;
- script externe ;
- CSS externe.

Refuser si l'usage permet exécution arbitraire, injection, exfiltration ou contournement de la CSP.

### 12.3 Échappement HTML

Toute donnée provenant de viewers, Twitch, config utilisateur ou service externe doit être injectée via :

- `textContent` ;
- création DOM sûre ;
- `OO.escHtml(str)` avant template HTML.

Refuser si un pseudo, message chat, récompense, titre, input config ou réponse externe est injecté en `innerHTML` sans échappement.

### 12.4 Données viewers

Le module doit minimiser les données collectées :

- collecter seulement ce qui est nécessaire ;
- borner et purger ;
- ne pas envoyer à un tiers sans justification ;
- ne pas stocker indéfiniment ;
- ne pas afficher de données sensibles ;
- documenter toute collecte notable.

---

## 13. UX streamer et philosophie produit

OpenOverlay doit être préparé avant le live. Le streamer ne doit pas avoir à gérer une étape complexe en direct.

Valider que :

- le module est configurable avant le live ;
- les valeurs par défaut sont sûres ;
- un bouton de test existe si le module affiche une animation/alerte ;
- les erreurs sont silencieuses ou compréhensibles, pas visibles aux viewers sauf voulu ;
- les fallbacks existent ;
- le module ne demande pas une validation manuelle live permanente ;
- les actions destructrices ont une permission forte ;
- les labels admin sont clairs ;
- les commandes sont documentées ;
- le module n'introduit pas de charge mentale inutile.

Refuser ou demander correction si le module impose un flux « générer → éditer → approuver pendant le live » sans demande produit explicite.

---

## 14. Compatibilité Store central et installation

Le module doit être installable par le flux Store :

1. catalogue public ;
2. manifest public ;
3. fichiers de code protégés ;
4. token Twitch requis pour récupérer le code ;
5. Nexus requis si premium ;
6. copie dans Netlify Blobs de l'instance ;
7. chargement via Blob URL pour respecter la CSP.

Refuser si :

- le module dépend d'une étape manuelle après installation ;
- il requiert un accès direct à GitHub ;
- il requiert `GITHUB_TOKEN`, `OWNER_LOGIN`, `STORE_GITHUB_*`, `premium-grants` ou une ancienne architecture ;
- il suppose que le code est servi publiquement sans authentification ;
- il casse l'installation atomique.

---

## 15. Tests obligatoires

### 15.1 Tests minimaux pour tout module

Depuis `openoverlay-store` :

```bash
python3 -m json.tool catalog.json >/dev/null
python3 -m json.tool mods/<id>/manifest.json >/dev/null
node --check mods/<id>/overlay.js
node --check mods/<id>/admin.js
git diff --check
```

Puis vérifier :

- `catalog.json` contient le module ;
- tous les fichiers listés dans le manifest existent ;
- `id`, dossier, `configKey`, `OO.Mods.register().id`, `OO.Admin.register().id` correspondent ;
- aucun fichier inattendu ;
- pas de secret ;
- pas d'API dangereuse non justifiée.

### 15.2 Harness recommandé

Pour tout module non trivial, exécuter un harness Node/DOM stub qui vérifie au moins :

1. `OO.Mods.register` est appelé ;
2. `OO.Admin.register` est appelé ;
3. `init(api)` ne crashe pas avec config minimale ;
4. `onConfigReload(api)` ne crashe pas ;
5. chaque commande chat respecte `api.checkPermission` ;
6. `onAdminMessage` répond aux types attendus ;
7. `admin.render(config, container, tools)` rend les champs ;
8. les modifications appellent `tools.markDirty()` ;
9. `getCommands()` retourne les commandes attendues ;
10. les fallbacks fonctionnent quand une API optionnelle est absente.

### 15.3 Tests spécialisés

Ajouter des tests spécifiques selon le module :

- chat intensif : buffers bornés, bots ignorés, pas de fuite mémoire ;
- économie/shop : montants bornés, pas de valeurs négatives abusives, logs pertinents ;
- IA : `api.ai` mocké succès/échec/non configuré, fallback local ;
- intégration externe : fetch mocké succès/échec/timeout ;
- audio : volume borné 0–1 ;
- animations : démarrage/arrêt/test/reload ;
- assets : `user://` résolu, asset manquant géré ;
- premium : comportement sans Nexus, avec Nexus, erreur API Nexus.

---

## 16. Revue IA assistée — méthode

Quand une IA aide à valider un module, elle doit recevoir :

- ce document ;
- `manifest.json` ;
- `catalog.json` pertinent ;
- `overlay.js` ;
- `overlay.html` ;
- `overlay.css` ;
- `admin.js` ;
- `admin.css` ;
- tout fichier listé dans `manifest.json.files` ;
- les résultats des commandes de test.

La revue IA doit répondre avec cette structure :

```markdown
# Revue module <id>

## Décision
ACCEPTÉ / CORRECTIONS REQUISES / REFUSÉ

## Résumé
...

## Fichiers examinés
- ...

## Tests exécutés
- commande → résultat

## Conformité
- ...

## Bloquants
- [BLOQUANT] fichier:ligne — règle violée — correction attendue

## Corrections recommandées
- [MAJEUR/MINEUR] fichier:ligne — amélioration

## Sécurité / confidentialité
...

## UX streamer
...

## Compatibilité OpenOverlay
...

## Verdict final
...
```

L'IA ne doit pas inventer de résultats de tests. Si un test n'a pas été exécuté, elle doit écrire `non exécuté`.

---

## 17. Checklist complète de validation

### Identité / Store

- [ ] Dossier `mods/<id>/` présent.
- [ ] `id` en `snake_case`.
- [ ] `id` = dossier = `configKey` = ID overlay = ID admin.
- [ ] Pas de collision avec un module existant.
- [ ] `catalog.json` valide.
- [ ] Entrée catalogue présente une seule fois.
- [ ] `premium: true` dans le catalogue si module Nexus.

### Manifest

- [ ] JSON valide.
- [ ] Tous les champs obligatoires présents.
- [ ] `defaultConfig.enabled === true`.
- [ ] Permissions configurables pour les commandes.
- [ ] Types officiels uniquement.
- [ ] Version SemVer.
- [ ] Changelog cohérent.
- [ ] `files` complet et exact.
- [ ] `minSystemVersion` renseigné si API récente.
- [ ] Pas de secret dans la config.

### Overlay

- [ ] `node --check overlay.js` OK.
- [ ] `OO.Mods.register` correct.
- [ ] Hooks respectent `enabled`.
- [ ] Permissions via `api.checkPermission`.
- [ ] Commandes déclarées via `getCommands` overlay.
- [ ] Pas de DOM inter-module.
- [ ] Pas d'exécution dynamique dangereuse.
- [ ] Données viewers échappées et minimisées.
- [ ] Buffers/timers bornés.
- [ ] Fallbacks pour APIs optionnelles.

### HTML / CSS overlay

- [ ] `overlay.html` fragment uniquement.
- [ ] Pas de script/handler inline.
- [ ] IDs/classes préfixés.
- [ ] CSS scopé au module.
- [ ] Pas de global CSS dangereux.
- [ ] Animations performantes.
- [ ] Lisible en 1280×720.

### Admin

- [ ] `node --check admin.js` OK.
- [ ] `OO.Admin.register` correct.
- [ ] `render` initialise la config.
- [ ] `markDirty` appelé après modifications.
- [ ] `getCommands` admin présent.
- [ ] `permissionSelect` utilisé pour permissions.
- [ ] `createAssetField` utilisé pour assets.
- [ ] Messages `sendToOverlay` préfixés `[modId]_[action]`.
- [ ] Pas de secret dans l'UI.
- [ ] UX claire et testable avant live.

### Sécurité

- [ ] Aucun token/secret/clé API.
- [ ] Pas de stockage local sensible.
- [ ] Pas d'exfiltration non documentée.
- [ ] Pas d'appel réseau opaque.
- [ ] Pas d'IA avec clé front.
- [ ] Pas de Nexus local.
- [ ] Pas d'ancien flux GitHub Store direct.
- [ ] Échappement HTML systématique.

### Tests

- [ ] `python3 -m json.tool catalog.json` OK.
- [ ] `python3 -m json.tool manifest.json` OK.
- [ ] `node --check overlay.js` OK.
- [ ] `node --check admin.js` OK.
- [ ] `git diff --check` OK.
- [ ] Existence des fichiers manifest OK.
- [ ] Harness exécuté pour module non trivial.
- [ ] Tests spécialisés selon fonctionnalités.

### Documentation / publication

- [ ] `description` et `longDescription` exactes.
- [ ] Tags utiles.
- [ ] Screenshots/previews présents ou `[]` assumé.
- [ ] Changelog à jour.
- [ ] Instructions de configuration présentes si intégration externe.
- [ ] Limitations connues documentées.
- [ ] Licence des assets claire.

---

## 18. Critères de refus immédiat

Refuser sans validation complémentaire tant que non corrigé :

- secret réel dans le code ou le manifest ;
- clé IA/API côté front ;
- exfiltration cachée de chat, tokens, config ou données viewers ;
- `eval` / exécution arbitraire non justifiée ;
- injection HTML évidente depuis données viewer ;
- module qui contourne Store central ou Nexus central ;
- dépendance à `GITHUB_TOKEN`, `OWNER_LOGIN`, `STORE_GITHUB_*`, `premium-grants` côté instance ;
- module qui modifie le core ou un autre module ;
- absence de manifest valide ;
- fichiers requis manquants ;
- syntaxe JS invalide ;
- comportement destructeur ou spam accessible aux viewers ;
- contenu illégal, haineux, malveillant, trompeur ou contraire à l'objectif OpenOverlay.

---

## 19. Commande de validation type

À adapter avec l'ID du module :

```bash
export MOD=<id>
python3 -m json.tool catalog.json >/dev/null
python3 -m json.tool "mods/$MOD/manifest.json" >/dev/null
node --check "mods/$MOD/overlay.js"
node --check "mods/$MOD/admin.js"
python3 - <<'PY'
import json, pathlib, re, sys, os
mod_id = os.environ.get('MOD', '<id>')
root = pathlib.Path('mods') / mod_id
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
errors = []
if manifest.get('id') != mod_id:
    errors.append('manifest.id != dossier')
if manifest.get('configKey') != manifest.get('id'):
    errors.append('configKey != id')
if not re.match(r'^[a-z][a-z0-9_]*$', manifest.get('id','')):
    errors.append('id non snake_case')
for required in ['manifest.json','overlay.js','overlay.html','overlay.css','admin.js','admin.css']:
    if required not in manifest.get('files', []):
        errors.append(f'{required} absent de manifest.files')
for f in manifest.get('files', []):
    if '..' in pathlib.PurePosixPath(f).parts or f.startswith('/'):
        errors.append(f'chemin interdit: {f}')
    elif not (root / f).is_file():
        errors.append(f'fichier listé manquant: {f}')
if manifest.get('defaultConfig', {}).get('enabled') is not True:
    errors.append('defaultConfig.enabled doit être true')
if errors:
    print('\n'.join(errors))
    sys.exit(1)
print('manifest structure ok')
PY
git grep -n -I -E "(api[_-]?key|secret|token|password|passwd|bearer|authorization|OPENAI|OPENROUTER|TWITCH_CLIENT_SECRET|GITHUB_TOKEN|STORE_GITHUB|premium-grants|eval\(|new Function|document.write|onclick=|onload=)" -- "mods/$MOD" || true
git diff --check
```

---

## 20. Notes de maintenance

Ce document doit être mis à jour dès qu'OpenOverlay introduit :

- une nouvelle API module ;
- un nouveau helper dashboard ;
- une nouvelle règle CSP/sécurité ;
- une nouvelle version minimale importante ;
- un nouveau type de module ;
- une évolution du Store central ou de Nexus ;
- une règle produit sur l'expérience streamer.

La référence d'autorité technique reste le comportement réel des dépôts `openoverlay`, `openoverlay-store`, `openoverlay-docs` et `openoverlay-myassets`. En cas de contradiction, corriger les documents concernés avant de valider de nouveaux modules.
