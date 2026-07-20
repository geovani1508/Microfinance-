# 🔗 Guide: Vérifier la connexion Neon

## Étapes rapides

### 1️⃣ Obtenir votre DATABASE_URL

1. Allez sur https://console.neon.tech
2. Ouvrez votre projet Neon
3. Cliquez sur **"Connection details"** (en haut à droite)
4. Sélectionnez le **"Connection string"**
5. Copiez l'URI entière (ressemble à: `postgresql://...`)

### 2️⃣ Tester LOCALEMENT

```bash
# 1. Créer le fichier .env.local
cp .env.local.example .env.local

# 2. Éditer .env.local et remplacer par votre vrai DATABASE_URL
# Ouvrez .env.local et collez votre URI

# 3. Installer les dépendances (si pas déjà fait)
npm install

# 4. Lancer le test de connexion
node test-db-connection.js
```

**Résultats attendus:**
- ✅ "Connexion réussie" = tout fonctionne
- ❌ "DATABASE_URL n'est pas définie" = vérifiez .env.local
- ❌ "Connection refused" ou timeout = URI incorrecte ou Neon down

### 3️⃣ Configurer en PRODUCTION (Vercel)

1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet **microfinance-officielle**
3. Allez dans **Settings** → **Environment Variables**
4. Cliquez **Add** et remplissez:
   - **Name**: `DATABASE_URL`
   - **Value**: Collez l'URI Neon (ex: `postgresql://...`)
   - **Environments**: Sélectionnez **Production** (et Dev si vous voulez)
5. Cliquez **Save**
6. Allez dans **Deployments** et cliquez **Redeploy** sur le dernier déploiement

### 4️⃣ Vérifier que ça marche en prod

Après le redéploiement:
1. Ouvrez votre app: https://your-app.vercel.app
2. Remplissez le formulaire de prêt
3. Cliquez "Soumettre"
4. Allez dans **Panel Administrateur** et connectez-vous
5. Vérifiez que vos données apparaissent dans la liste

---

## 🐛 Dépannage

| Problème | Solution |
|----------|----------|
| `DATABASE_URL n'est pas définie` | Créez `.env.local` avec votre URI |
| `Connection refused / timeout` | Vérifiez que l'URI est correcte et Neon est actif |
| `Les données ne s'enregistrent pas` | Vérifiez que le DATABASE_URL est défini dans Vercel |
| `Erreur "tables not found"` | Les tables se créent automatiquement au premier appel |

---

## 📝 Variables d'environnement requises

| Variable | Valeur | Obligatoire |
|----------|--------|-----------|
| `DATABASE_URL` | `postgresql://...` | ✅ Oui |
| `ADMIN_EMAIL` | votre email admin | ⚠️ Non (utilise valeur par défaut) |
| `ADMIN_PASSWORD` | mot de passe sécurisé | ⚠️ Non (utilise valeur par défaut) |
| `JWT_SECRET` | clé aléatoire 32+ chars | ⚠️ Non (utilise valeur par défaut, DANGEREUX!) |

> ⚠️ **IMPORTANT**: Ne commettez JAMAIS `.env.local` dans Git. C'est dans `.gitignore` par défaut.

---

## ✅ Checklist de déploiement

- [ ] DATABASE_URL obtenu de Neon
- [ ] `.env.local` créé localement avec DATABASE_URL
- [ ] Test local: `node test-db-connection.js` ✅
- [ ] DATABASE_URL ajouté dans Vercel Settings → Env Vars
- [ ] App redéployée sur Vercel
- [ ] Formulaire testé et données affichées en admin
- [ ] Identifiants admin changés (IMPORTANT!)
- [ ] JWT_SECRET défini en prod

---

**Besoin d'aide?** Consultez:
- Neon Docs: https://neon.tech/docs
- Vercel Env Vars: https://vercel.com/docs/environment-variables
