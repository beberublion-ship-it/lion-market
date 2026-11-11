# LION MARKET — plan de stabilisation et d'automatisation

## Décision d'architecture

- **Production cible : Cloudflare Workers + assets statiques** via `worker.js` et `wrangler.jsonc`.
- **Données persistantes : Supabase** (Postgres, Auth et Storage).
- **Canal de contact initial : WhatsApp**, sans paiement intégré tant qu'un prestataire local et ses conditions ne sont pas choisis.
- **GitHub : source unique du code** ; chaque fusion sur `main` déclenche le déploiement de production.
- **Render : solution de secours seulement**, à ne pas utiliser en parallèle comme production principale.

L'objectif est de ne conserver qu'une seule chaîne de déploiement et une seule URL officielle.

## État vérifié le 11 novembre 2026

- Le dépôt contient `index.html` (page complète), `Index.html` (petite redirection), `worker.js`, `wrangler.jsonc`, mais aussi `server.js`, `database.js` et `render.yaml`. Cette double pile Cloudflare/Render entretient la confusion.
- Le Worker expose `/health`, `/api/config`, `/api/products` et `/api/chat`.
- La table Supabase `public.annonces` existe, contient déjà une annonce et a RLS activé. Les politiques actuelles autorisent la lecture publique et l'insertion publique validée, mais il n'y a pas encore de comptes vendeurs ni de contrôle de propriété pour modifier/supprimer ses annonces.
- Les contrôles Supabase de sécurité et de performance ne renvoyaient aucun avertissement au moment de l'inspection.
- Le dernier déploiement GitHub Pages connu a réussi, mais cela ne prouve pas que le Worker Cloudflare est en production.
- Un déploiement Cloudflare antérieur a échoué avec l'erreur API 7003 (« Could not route to …/accounts/…/workers/services/lion-market »). Le compte Cloudflare ciblé ou l'association du jeton doit être vérifié dans Cloudflare ; aucun secret ne doit être ajouté au dépôt.
- Le dépôt n'a pas de workflow GitHub Actions versionné visible dans l'arbre de fichiers inspecté ; le déploiement Cloudflare observé semble être géré par l'intégration Cloudflare.

## Travaux à réaliser, dans cet ordre

### Phase 1 — une seule production fiable
1. Confirmer le compte Cloudflare qui possède le Worker `lion-market`.
2. Corriger l'association GitHub/Cloudflare et le compte ciblé pour supprimer l'erreur 7003.
3. Choisir une seule URL officielle, vérifier `/`, `/health` et `/api/products` après chaque déploiement.
4. Conserver le déploiement automatique depuis `main` et éviter les déploiements manuels concurrents.
5. Retirer la configuration Render uniquement après validation de Cloudflare, pour ne pas supprimer prématurément le seul hébergement utilisable.

### Phase 2 — vraie marketplace avec comptes
1. Activer Supabase Auth (inscription, connexion, récupération de mot de passe).
2. Ajouter un profil vendeur lié à `auth.users`.
3. Ajouter une propriété vendeur aux annonces ; conserver les annonces historiques et prévoir leur rattachement administratif plutôt que les supprimer.
4. Autoriser la modification et la suppression uniquement au propriétaire connecté ; garder la lecture publique des annonces publiées.
5. Ajouter un statut de modération (en attente, publiée, refusée) et une interface d'administration protégée par un rôle attribué côté serveur/base, jamais par un champ modifiable par l'utilisateur.
6. Ajouter des formulaires de compte, un tableau de bord vendeur et une page de détail d'annonce.

### Phase 3 — commandes et médias
1. Ajouter les commandes et leurs lignes, avec états (nouvelle, confirmée, expédiée, terminée, annulée).
2. Ajouter les règles RLS : acheteur et vendeur ne voient que les commandes auxquelles ils participent ; l'administration a des droits contrôlés.
3. Utiliser Supabase Storage pour les photos, avec limites de type et de taille.
4. Garder WhatsApp comme contact/coordination initiale ; n'ajouter un paiement mobile qu'après choix explicite d'un prestataire compatible Cameroun, tests et validation des frais.

### Phase 4 — qualité et exploitation
1. Ajouter des tests automatiques pour les routes, les validations et les permissions.
2. Ajouter une vérification de santé et des contrôles après déploiement.
3. Documenter les variables requises et ne jamais versionner de clé secrète/service_role.
4. Prévoir sauvegardes, alertes de disponibilité et procédure de retour arrière.
5. Vérifier les règles RLS et les conseils Supabase après chaque changement de schéma.

## Règles de sécurité non négociables

- La clé Supabase publishable peut être utilisée côté navigateur, mais elle ne remplace jamais les politiques RLS.
- Ne jamais exposer une clé Supabase `service_role`, une clé secrète Supabase ou `OPENAI_API_KEY` dans les fichiers publics.
- Les droits administrateur doivent être attribués côté serveur/base de données, pas via les métadonnées modifiables par le client.
- Aucune donnée ou annonce existante ne doit être supprimée pendant la migration.
- Aucun paiement ne doit être simulé : tant qu'un fournisseur n'est pas intégré, les transactions sont convenues directement entre acheteur et vendeur.

## Définition de « prêt pour la production »

Le projet n'est considéré prêt que lorsque le Worker sert la page d'accueil, `/health` confirme Supabase, les annonces peuvent être lues et publiées selon les droits attendus, l'authentification et les commandes ont été testées, et le déploiement automatique a réussi sur le bon compte Cloudflare.
