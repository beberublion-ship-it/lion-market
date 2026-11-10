# LION MARKET

Marketplace camerounaise connectée à Supabase, avec annonces en FCFA, contact WhatsApp et assistant local gratuit.

## Architecture

- GitHub : dépôt source.
- Render : serveur Node.js avec déploiement automatique depuis la branche `main`.
- Supabase : base PostgreSQL persistante pour les annonces.
- WhatsApp : contact direct entre acheteurs et vendeurs.

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
- `SUPABASE_PUBLISHABLE_KEY` : clé publishable Supabase. Elle est conçue pour être utilisée par l'application et reste protégée par les politiques RLS.
- `WHATSAPP_NUMBER` : numéro de contact avec indicatif international, chiffres uniquement.
- `OPENAI_API_KEY` : facultative et payante selon l'utilisation. Sans cette clé, l'assistant local fonctionne sans frais d'API.

Ne jamais mettre une clé Supabase secrète/service_role ni une clé OpenAI dans le dépôt GitHub.

## Déploiement Render gratuit

Le fichier `render.yaml` définit un service web sur le plan Free, sans disque persistant. Les annonces sont stockées dans Supabase et ne dépendent donc pas du système de fichiers éphémère de Render.

1. Dans Render, ouvrir **New → Blueprint**.
2. Connecter le dépôt `beberublion-ship-it/lion-market`.
3. Vérifier que le service `lion-market` est sur le plan **Free**, puis appliquer le Blueprint.
4. Render déploie automatiquement les futurs commits de la branche `main`.

Les services Render Free peuvent s'endormir après 15 minutes d'inactivité et le premier chargement suivant peut prendre environ une minute. Render Free n'est pas destiné à une application commerciale critique.

## Base de données

La table existante `public.annonces` est utilisée avec les colonnes `id, nom, prix, categorie, ville, image_url, telephone, description, created_at`. Les annonces déjà présentes sont conservées. La lecture et la création passent par les politiques RLS de Supabase.

## Vérifications

```bash
npm run check
```

Le point de contrôle de santé est `/health`. Il vérifie la connexion à Supabase.
