# 💰 Networth

Application web pour suivre sa **valeur nette** (net worth), se comparer à ses amis
dans un **classement**, et recevoir des conseils pour l'améliorer.

Construite avec **Next.js 16** (App Router), **Supabase** (auth + base de données
PostgreSQL) et **Tailwind CSS**.

## Fonctionnalités

- 🔐 Inscription / connexion par courriel
- 📈 Suivi de la valeur nette (actifs − dettes) avec historique
- 👥 Groupes d'amis avec code d'invitation
- 🏆 Classement : les membres d'un groupe voient et comparent leurs valeurs nettes
- 💡 Conseils personnalisés selon tes données

## Lancer en local

1. Installe les dépendances :
   ```bash
   npm install
   ```
2. Copie `.env.example` en `.env.local` et remplis les valeurs depuis
   le dashboard Supabase (**Project Settings → API**) :
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. Démarre le serveur de dev :
   ```bash
   npm run dev
   ```
   Puis ouvre http://localhost:3000

## Base de données

Le schéma est géré par des migrations Supabase dans `supabase/migrations/`.
Pour appliquer les migrations à ton projet Supabase :

```bash
npx supabase link --project-ref <ton-project-ref>
npx supabase db push
```

### Tables principales

| Table | Rôle |
|-------|------|
| `profiles` | Profil de chaque utilisateur |
| `groups` | Groupes d'amis (avec code d'invitation) |
| `group_members` | Appartenance aux groupes |
| `net_worth_entries` | Historique des valeurs nettes |
| `latest_net_worth` (vue) | Dernière valeur nette de chacun (classement) |

La sécurité au niveau des lignes (RLS) garantit que chacun ne modifie que ses
propres données, et ne voit les valeurs nettes que des membres de ses groupes.
