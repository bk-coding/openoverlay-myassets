# OpenOverlay — Référence du projet

Dépôt de référence pour tout développeur qui souhaite comprendre, contribuer ou créer des modules pour **OpenOverlay** — overlay Twitch modulaire, 100 % navigateur, hébergé sur Netlify.

---

## Lire dans l'ordre

| Fichier | Contenu |
|---|---|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Comment le système fonctionne : auth, stockage, modules, API, sécurité |
| **[DEVELOPPER-UN-MOD.md](DEVELOPPER-UN-MOD.md)** | Guide complet pour créer un module : structure, API, CSS, conventions |
| **[DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)** | Identité visuelle : palette, typographie, composants UI, règles graphiques |
| **[VALIDATION-STORE.md](VALIDATION-STORE.md)** | Checklist de revue avant soumission au Store |

---

## Les dépôts du projet

| Dépôt | Branche | Rôle |
|---|---|---|
| `openoverlay` | `dev` | Application principale (overlay, dashboard, API, mods intégrés) |
| `openoverlay-store` | `main` | Modules communautaires — catalogue + fichiers des mods |
| `openoverlay-docs` | `main` | Documentation développeur publique (docs.openoverlay.fr) |
| `openoverlay-site` | `main` | Site vitrine + téléchargements (openoverlay.fr) |
| `openoverlay-myassets` | `main` | **Ce dépôt** — référence technique + assets de marque partagés |

---

## Ce dépôt

```
openoverlay-myassets/
├── README.md               <- ce fichier
├── ARCHITECTURE.md         <- fonctionnement technique détaillé
├── DEVELOPPER-UN-MOD.md    <- guide de développement de modules
├── DESIGN-SYSTEM.md        <- charte graphique et design system
├── VALIDATION-STORE.md     <- processus de revue et soumission Store
└── brand/                  <- assets de marque partagés entre tous les repos
    ├── oo-shared.css       <- CSS source de vérité (synchronisé automatiquement)
    ├── sync-shared.js      <- script de synchronisation (post-commit hook)
    ├── brand-assets.html   <- visualiseur des assets de marque
    └── [favicons + PWA]    <- icônes multi-formats
```

### CSS partagé — synchronisation automatique

`brand/oo-shared.css` est la source de vérité du CSS commun à tous les sites.
Après chaque `git commit` qui le modifie, le hook `.git/hooks/post-commit` appelle
`node brand/sync-shared.js` et copie le fichier vers `openoverlay-site`, `openoverlay-docs`
et `openoverlay-store`. Il faut ensuite committer et pusher dans chacun de ces dépôts.

---

## Liens utiles

- Site : [openoverlay.fr](https://openoverlay.fr)
- Docs : [docs.openoverlay.fr](https://docs.openoverlay.fr)
- Store : [store.openoverlay.fr](https://store.openoverlay.fr)
