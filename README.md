# LION MARKET

Marketplace camerounaise connectée à Supabase, avec annonces en FCFA, contact WhatsApp et assistant local gratuit.

## Architecture cible

- **Production cible :** Cloudflare Workers avec les assets statiques de `index.html`.
- **Données :** Supabase PostgreSQL ; Supabase Auth et Storage seront utilisés pour les comptes vendeurs, les commandes et les photos.
- **Contact :** WhatsApp dans un premier temps.
- **Code source :** GitHub, branche `main`.

**Important :** la production Cloudflare n'est pas encore confirmée. Un ancien déploiement a échoué avec l'erreur Cloudflare API 7003. Ne considérez pas le Worker comme opérationnel tant que `/` et `/health` n'ont pas été testés après un déploiement réussi.

Le dépôt contient encore une ancienne pile Node.js/Render (`server.js`, `database.js`, `render.yaml`). Elle est conservée provisoirement pour éviter toute interruption ; elle ne doit pas être considérée comme une deuxième production à maintenir. Elle sera retirée après validation de Cloudflare.

Le plan détaillé et les étapes de migration se trouvent dans [docs/PRODUCTION-PLAN.md](docs/PRODUCTION-PLAN.md).

## Développement local

Prérequis : Node.js 22 ou plus récent.

```bash
npm install
cp .env.example .env
# Renseigner SUPABASE_PUBLISHABLE_KEY dans .env
npm start
```

Ouvrir http://localhost:3000.

## Variables d'environnement

- `SUPABASE_URL` : URL du projet Supabase.
- `SUPABASE_PUBLISHABLE_KEY` : clé publishable Supabase, conçue pour être utilisée côté client et protégée par les politiques RLS.
- `WHATSAPP_NUMBER` : numéro de contact avec indicatif international, chiffres uniquement.
- `OPENAI_API_KEY` : facultative et payante selon l'utilisation. Sans cette clé, l'assistant local reste disponible.

Ne jamais mettre une clé Supabase secrète/service_role ni une clé OpenAI dans le dépôt GitHub.

## Base de données actuelle

La table `public.annonces` existe et utilise les colonnes `id, nom, prix, categorie, ville, image_url, telephone, description, created_at`. Les annonces existantes doivent être conservées pendant toute migration. RLS est activé ; les politiques actuelles autorisent la lecture publique et l'insertion publique validée. Les comptes vendeurs, la propriété des annonces, les commandes et la modération restent à construire.

## Vérifications locales

```bash
npm run check
```

Le point de contrôle de santé est `/health`. Il vérifie la connexion à Supabase dans le serveur Node.js actuel.
