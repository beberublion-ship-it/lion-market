# LION MARKET

Marketplace camerounais avec annonces sauvegardées dans SQLite, panier WhatsApp et assistant IA optionnel.

## Lancer en local

Prérequis : Node.js 20 ou plus récent.

```bash
npm install
cp .env.example .env
npm start
```

Ouvrir http://localhost:3000. Le site et les annonces sont servis par le même serveur.

## Configuration

- `PORT` : port HTTP (défini automatiquement par Render en production).
- `DB_PATH` : chemin du fichier SQLite. En local, `./lionmarket.db`; sur Render, `/var/data/lionmarket.db`.
- `WHATSAPP_NUMBER` : numéro de commande avec indicatif international, chiffres uniquement. La valeur configurée est `237656342696`.
- `OPENAI_API_KEY` : facultative pour le chatbot OpenAI. Sans clé, l’assistant utilise des réponses locales.

Ne publiez jamais votre clé OpenAI dans GitHub ni dans le code. Ajoutez-la uniquement dans les variables d’environnement de l’hébergeur.

## Déployer sur Render

Le fichier `render.yaml` configure un service Node, la commande `npm install`, le démarrage `npm start`, le contrôle `/health` et un disque persistant monté sur `/var/data` pour la base SQLite.

1. Dans Render, choisissez **New → Blueprint** et connectez `beberublion-ship-it/lion-market`.
2. Examinez le plan et le disque proposés, puis créez le service. Le disque persistant Render peut entraîner des frais selon le plan et les tarifs en vigueur.
3. Ajoutez `OPENAI_API_KEY` dans **Environment** si vous souhaitez activer les réponses OpenAI. Laissez vide si vous voulez le chatbot local.
4. Attendez la fin du déploiement, puis vérifiez `/health` et la page d’accueil.

Les annonces sont persistées dans SQLite sur le disque Render. Évitez plusieurs instances du service avec un même fichier SQLite.

## État et limites de cette première version

- Les annonces peuvent être publiées sans compte ni modération. Pour une ouverture publique, ajoutez authentification, modération anti-spam, limitation de débit et gestion des abus avant d’en faire une marketplace commerciale.
- Le paiement n’est pas intégré : vendeur et acheteur conviennent du paiement et de la livraison via WhatsApp.
- Les annonces de démonstration sont insérées uniquement lorsque la base est vide.
- L’API OpenAI est facultative et peut générer des coûts selon son usage.
