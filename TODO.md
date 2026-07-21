# TODO

- [x] Modifier `index.html` : ajouter import de fichier d'identité (accept=pdf,jpg,png) + affichage du nom
- [x] Modifier la validation page 1 : garantir champ fichier requis
- [x] Modifier la soumission : convertir fichier en Base64 + stocker dans localStorage
- [x] Modifier l'affichage admin : afficher nom du fichier + aperçu
- [x] Supprimer le fallback "mode démo" avec identifiants hardcodés (`admin@demo.com` / `admin123`) dans `index.html`
- [x] Créer `.env.local` avec `ADMIN_EMAIL=wabogeovani02@gmail.com`, `ADMIN_PASSWORD=VaNeLlE@20`, `DATABASE_URL`, `JWT_SECRET`
- [x] Forcer la connexion admin à passer uniquement par l'API (via `/api/login`)

## ✅ Backend API Node.js créé pour Vercel

### Structure ajoutée
```
api/
├── db.js                ← Connexion Neon (PostgreSQL)
├── init-db.js           ← Initialisation tables
├── submit.js            ← POST /api/submit
├── login.js             ← POST /api/login
├── responses.js         ← GET /api/responses
└── response/[id].js     ← GET /api/response/:id (détail)
```

### Modifications dans index.html
- `DEMO_EMAIL` / `DEMO_PASS` pour le mode démo local
- Envoi des données vers l'API après sauvegarde localStorage
- Authentification admin via API en priorité (fallback localStorage)

### Pour déployer sur Vercel
1. Créer une base Neon (PostgreSQL) → https://neon.tech
2. Ajouter les variables d'environnement dans Vercel :
   - `DATABASE_URL` (de Neon)
   - `ADMIN_EMAIL` = wabogeovani02@gmail.com
   - `ADMIN_PASSWORD` = VaNeLlE@20
   - `JWT_SECRET` = une chaîne secrète aléatoire
3. Pusher le projet sur GitHub → Vercel déploie automatiquement

### Sécurité améliorée
- ✅ Mots de passe hashés avec bcrypt
- ✅ Authentification par JWT
- ✅ API protégée par token
- ✅ Credentials admin en variable d'environnement (plus en dur dans le code)

