# LION MARKET

Marketplace simple pour le Cameroun avec un assistant IA et un backend Node.js.

## Démarrage

```bash
npm install
cp .env.example .env
npm start
```

Puis ouvrir :

```text
http://localhost:3000
```

## Variables d’environnement

- `PORT` : port du serveur (par défaut 3000)
- `OPENAI_API_KEY` : clé OpenAI optionnelle pour le chatbot avancé

## Fonctionnalités

- affichage des produits
- ajout d’annonces côté serveur
- panier WhatsApp
- assistant IA avec fallback local si clé OpenAI absente
- base SQLite locale pour les annonces

## Déploiement

Le projet est prêt pour déploiement sur Render, Railway ou tout hébergeur Node.js.
