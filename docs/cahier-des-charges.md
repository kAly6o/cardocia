# CARDOCIA
# CAHIER DES CHARGES FONCTIONNEL ET TECHNIQUE
**Version 1.0 — Création complète depuis zéro**

---

# 1. PRÉSENTATION GÉNÉRALE

## 1.1 Nom du projet

Cardocia

## 1.2 Nature du projet

Cardocia est une application web de gestion personnelle dédiée à l'univers Pokémon TCG.

Elle permet de gérer une collection de cartes, les doubles, les cartes destinées à la vente, les achats, les ventes, les produits scellés, les lots et les boosters reconditionnés.

L'application doit centraliser toutes les informations afin de connaître précisément son patrimoine de cartes, ses dépenses, ses recettes et sa rentabilité.

Cardocia est destinée à un usage personnel et à la gestion de petites activités d'achat-revente. Elle ne doit pas être conçue comme un logiciel de caisse ou un ERP commercial.

## 1.3 Objectifs

L'application doit permettre de :

- Constituer et gérer une collection Pokémon.
- Identifier chaque carte et chaque exemplaire.
- Gérer les cartes en double.
- Séparer les cartes conservées des cartes destinées à la vente.
- Enregistrer les achats et leurs coûts.
- Suivre les ventes sur plusieurs plateformes.
- Importer les historiques CSV.
- Composer des lots.
- Fabriquer des boosters reconditionnés.
- Gérer les produits scellés.
- Suivre les mouvements de stock.
- Consulter les valeurs estimées.
- Calculer les bénéfices et les pertes.

## 1.4 Utilisateurs et environnement

- Plusieurs utilisateurs peuvent disposer d'un compte.
- Chaque utilisateur possède un espace privé.
- Le catalogue de cartes est partagé.
- L'interface est entièrement en français.
- L'application fonctionne sur ordinateur, tablette et smartphone.
- Le thème principal est sombre.

---

# 2. ENVIRONNEMENT TECHNIQUE

## 2.1 Architecture retenue

Créer une application moderne avec une architecture simple et maintenable.

### Frontend

- Next.js avec App Router.
- React.
- TypeScript strict.
- Tailwind CSS.

### Backend et base de données

- Supabase.
- PostgreSQL.
- Supabase Auth.
- Supabase Storage.
- Supabase Row Level Security.

### Bibliothèques

Utiliser uniquement les bibliothèques réellement nécessaires.

Éviter les dépendances redondantes et les couches techniques inutiles.

## 2.2 Choix techniques à respecter

- Pas de Prisma.
- Pas de serveur Express séparé.
- Pas de NextAuth/Auth.js.
- Pas de deuxième système d'authentification.
- Pas de backend indépendant si les fonctions Next.js et Supabase suffisent.
- Utiliser le client officiel Supabase.
- Utiliser les fonctions serveur pour les opérations sensibles.
- Prévoir des migrations SQL versionnées.
- Utiliser Git pour suivre les évolutions du code.

## 2.3 Initialisation

Le projet doit être créé entièrement depuis zéro dans le dossier de travail ouvert dans VS Code.

L'agent de développement doit :

1. Initialiser Next.js.
2. Installer les dépendances.
3. Configurer TypeScript et Tailwind.
4. Préparer la connexion Supabase.
5. Créer les migrations SQL.
6. Construire l'architecture applicative.
7. Créer l'interface générale.
8. Mettre en place les premières fonctionnalités.
9. Tester le fonctionnement.

Les clés et identifiants externes doivent être fournis par le propriétaire du projet. Ne jamais inventer de secrets.

---

# 3. AUTHENTIFICATION ET ESPACES UTILISATEURS

## 3.1 Inscription et connexion

Fonctionnalités :

- Inscription par adresse e-mail et mot de passe.
- Connexion.
- Déconnexion.
- Récupération du mot de passe.
- Confirmation d'adresse e-mail si nécessaire.
- Gestion du profil.
- Modification des paramètres du compte.

## 3.2 Isolation des données

Chaque utilisateur doit posséder ses propres données :

- Collection.
- Stock à vendre.
- Achats.
- Ventes.
- Lots.
- Boosters.
- Produits scellés.
- Fournisseurs.
- Imports.
- Historique.
- Statistiques.

Le catalogue Pokémon est partagé entre tous les utilisateurs.

Toutes les tables contenant des données personnelles doivent être protégées par des politiques RLS.

Les opérations sensibles doivent également vérifier les droits côté serveur.

Aucune clé Supabase privilégiée ne doit être accessible dans le navigateur.

---

# 4. STRUCTURE GÉNÉRALE DE L'APPLICATION

## 4.1 Navigation principale

Créer une barre latérale avec les rubriques suivantes :

1. Tableau de bord.
2. Catalogue.
3. Ma collection.
4. Stock à vendre.
5. Achats.
6. Ventes.
7. Import CSV.
8. Lots.
9. Boosters reconditionnés.
10. Produits scellés.
11. Fournisseurs.
12. Historique.
13. Statistiques.
14. Paramètres.

La navigation doit être persistante sur ordinateur et adaptée aux petits écrans sur mobile.

## 4.2 Structure visuelle

Chaque rubrique doit posséder :

- Un titre.
- Une description courte.
- Les actions principales.
- Une recherche lorsque nécessaire.
- Des filtres adaptés.
- Un affichage des données.
- Des états de chargement.
- Des états vides.
- Des messages d'erreur.
- Des confirmations pour les opérations sensibles.

Aucun bouton ne doit être purement décoratif.

---

# 5. TABLEAU DE BORD

## 5.1 Indicateurs

Afficher les informations suivantes :

- Nombre total d'exemplaires possédés.
- Nombre de cartes différentes.
- Nombre de cartes en collection.
- Nombre de cartes disponibles à la vente.
- Nombre de cartes réservées.
- Nombre de produits scellés.
- Valeur estimée de la collection.
- Valeur estimée du stock à vendre.
- Montant total des achats.
- Montant total des ventes.
- Bénéfice ou perte réalisé.

## 5.2 Graphiques

Prévoir :

- Évolution mensuelle des achats.
- Évolution mensuelle des ventes.
- Évolution des bénéfices.
- Répartition par extension.
- Répartition par rareté.
- Répartition par langue.
- Répartition entre collection et stock à vendre.

## 5.3 Activité récente

Afficher les derniers mouvements :

- Carte ajoutée.
- Achat enregistré.
- Réception.
- Transfert.
- Réservation.
- Vente.
- Ouverture de produit.
- Fabrication de booster.

## 5.4 Calculs

Les indicateurs doivent être calculés depuis les données réelles.

Les valeurs inconnues ne doivent pas être remplacées par des valeurs fictives.

Un compte vide doit afficher un tableau de bord vide, avec des indications pour commencer.

---

# 6. CATALOGUE POKÉMON

## 6.1 Objectif

Créer un catalogue partagé servant de référence à toutes les cartes Pokémon.

Il ne doit pas contenir les quantités personnelles des utilisateurs.

## 6.2 Organisation

Navigation hiérarchique :

**Collections → Extensions → Cartes**

## 6.3 Collections

Informations :

- Nom.
- Identifiant.
- Logo.
- Description.
- Ordre d'affichage.

Prévoir les grandes périodes du Pokémon TCG :

- Wizards.
- Diamant et Perle.
- Platine.
- HeartGold SoulSilver.
- Noir et Blanc.
- XY.
- Soleil et Lune.
- Épée et Bouclier.
- Écarlate et Violet.
- Méga-Évolution.

Cette liste doit pouvoir évoluer.

## 6.4 Extensions

Chaque extension doit comporter :

- Identifiant interne.
- Identifiant externe.
- Nom français.
- Nom original si disponible.
- Collection.
- Symbole.
- Logo.
- Date de sortie.
- Nombre de cartes.
- Informations complémentaires.

## 6.5 Cartes

Chaque carte doit comporter :

- Identifiant interne.
- Identifiant externe.
- Nom.
- Numéro.
- Extension.
- Image.
- Rareté.
- Type.
- Illustrateur.
- Description si disponible.
- Informations complémentaires.

Les informations du catalogue doivent être séparées des caractéristiques propres à un exemplaire détenu par un utilisateur.

## 6.6 Recherche

Prévoir :

- Recherche par nom.
- Recherche par numéro.
- Filtre par extension.
- Filtre par collection.
- Filtre par rareté.
- Filtre par type.

## 6.7 Synchronisation future

Préparer une intégration avec TCGdex pour importer les collections, extensions, cartes et illustrations.

La synchronisation doit être indépendante des données personnelles.

Ne jamais remplacer les informations personnelles lors d'une mise à jour du catalogue.

Ne pas inventer de cartes.

---

# 7. MA COLLECTION

## 7.1 Objectif

Cette rubrique regroupe toutes les cartes conservées personnellement.

## 7.2 Organisation

Navigation :

**Collections → Extensions → Cartes**

## 7.3 Gestion des exemplaires

Chaque exemplaire doit pouvoir être suivi individuellement.

Informations :

- Carte du catalogue.
- Langue.
- État.
- Finition.
- Coût d'acquisition.
- Date d'acquisition.
- Notes.
- Emplacement.

### États

- Neuf.
- Near Mint.
- Excellent.
- Très bon.
- Bon.
- Joué.
- Abîmé.

### Finitions

- Normale.
- Reverse.
- Holographique.
- Holo spéciale.
- Autres finitions extensibles.

## 7.4 Fonctionnalités

- Ajouter une carte.
- Ajouter plusieurs exemplaires.
- Modifier un exemplaire.
- Consulter les détails.
- Supprimer un exemplaire par une opération tracée.
- Rechercher.
- Filtrer.
- Trier.
- Transférer vers le stock à vendre.

La suppression d'un exemplaire ne doit pas effacer silencieusement son historique.

## 7.5 Quantités

Ne jamais confondre :

- Nombre de cartes différentes.
- Nombre total d'exemplaires.

Un utilisateur peut posséder plusieurs exemplaires d'une même carte, dans différentes langues, états et finitions.

---

# 8. STOCK À VENDRE

## 8.1 Objectif

Séparer les cartes destinées à la revente des cartes conservées dans la collection.

## 8.2 Informations

- Carte.
- Exemplaire.
- Langue.
- État.
- Finition.
- Coût d'acquisition.
- Prix souhaité.
- Valeur estimée.
- Statut.
- Date d'entrée en stock.

## 8.3 Statuts

- Disponible.
- Réservé.
- Vendu.
- Utilisé dans un lot.
- Utilisé dans un booster.

## 8.4 Fonctionnalités

- Ajouter directement une carte.
- Transférer depuis la collection.
- Modifier un prix.
- Réserver.
- Libérer une réservation.
- Consulter l'historique.
- Filtrer les disponibilités.
- Rechercher.

## 8.5 Règles métier

Un exemplaire ne peut être disponible que dans une seule destination à la fois.

Un exemplaire réservé ne peut pas être réservé à nouveau.

Un exemplaire vendu ne peut pas être vendu une deuxième fois.

Un transfert conserve le coût d'acquisition initial et la traçabilité.

---

# 9. ACHATS

## 9.1 Objectif

Centraliser les achats de cartes et produits Pokémon.

## 9.2 Types d'achats

- Cartes individuelles.
- Lots de cartes.
- Boosters.
- Displays.
- ETB.
- Coffrets.
- Tripacks.
- Blisters.
- Bundles.
- Pokébox.
- Autres produits.

## 9.3 Informations d'achat

- Date.
- Vendeur.
- Référence.
- Description.
- Produits.
- Quantités.
- Prix unitaire.
- Frais de livraison.
- Frais supplémentaires.
- Montant total.
- Devise.
- Statut.
- Notes.

## 9.4 Fonctionnalités

- Créer un achat.
- Ajouter plusieurs lignes.
- Modifier un achat non finalisé.
- Consulter un achat.
- Enregistrer une réception.
- Consulter l'historique.
- Calculer le coût total.
- Répartir les frais entre les articles.

## 9.5 Réception

Les achats doivent être distingués des stocks physiques.

Un achat en attente ne doit pas créer de cartes disponibles.

La réception confirmée doit permettre de créer les exemplaires ou produits réellement reçus.

---

# 10. VENTES

## 10.1 Objectif

Suivre toutes les ventes et calculer leur rentabilité.

## 10.2 Types

- Cartes individuelles.
- Lots.
- Boosters reconditionnés.
- Produits scellés.

## 10.3 Plateformes

Prévoir :

- Cardmarket.
- eBay.
- Vinted.
- Leboncoin.
- Vente directe.
- Autres plateformes personnalisables.

## 10.4 Informations

- Date.
- Plateforme.
- Référence de transaction.
- Produit vendu.
- Quantité.
- Prix unitaire.
- Frais de vente.
- Frais d'expédition.
- Montant encaissé.
- Devise.
- Coût de revient.
- Bénéfice ou perte.
- Statut.

## 10.5 Fonctionnalités

- Ajouter une vente.
- Modifier une vente non finalisée.
- Consulter les ventes.
- Associer les exemplaires vendus.
- Calculer le bénéfice.
- Consulter les frais.
- Filtrer par plateforme.
- Filtrer par date.
- Exporter les données.

Une vente validée doit mettre à jour le stock de manière cohérente et conserver son historique.

---

# 11. IMPORTATION CSV

## 11.1 Objectif

Créer un module complet permettant de récupérer les données des plateformes externes.

L'import CSV est une fonctionnalité majeure de Cardocia.

## 11.2 Sources

Prévoir des adaptateurs indépendants pour :

- Cardmarket.
- Autres plateformes.
- Fichiers CSV personnels.
- Inventaires CSV.

Les formats doivent être étudiés à partir de véritables exports.

Ne jamais supposer que les colonnes sont identiques entre les plateformes.

## 11.3 Types d'importation

- Historique des achats.
- Historique des ventes.
- Inventaire de cartes.
- Inventaire de produits.

## 11.4 Assistant d'importation

Étapes :

1. Choix du type d'import.
2. Choix de la plateforme.
3. Sélection du fichier.
4. Lecture du fichier.
5. Analyse des colonnes.
6. Détection du format.
7. Correspondance automatique des champs.
8. Modification manuelle des correspondances.
9. Prévisualisation.
10. Détection des doublons.
11. Détection des anomalies.
12. Confirmation.
13. Importation.
14. Rapport final.

## 11.5 Import des achats

Récupérer les champs disponibles :

- Numéro de commande.
- Date.
- Vendeur.
- Produit.
- Extension.
- Numéro de carte.
- Langue.
- État.
- Finition.
- Quantité.
- Prix unitaire.
- Frais.
- Total.
- Statut.

## 11.6 Import des ventes

Récupérer les champs disponibles :

- Référence de transaction.
- Date.
- Acheteur si disponible.
- Produit.
- Quantité.
- Prix.
- Frais.
- Expédition.
- Montant encaissé.
- Statut.

## 11.7 Correspondance catalogue

Associer les produits importés au catalogue Cardocia en utilisant :

- Identifiant externe.
- Nom.
- Extension.
- Numéro.
- Langue.
- Finition.

Une correspondance incertaine doit être soumise à validation.

## 11.8 Doublons

Utiliser les références externes, numéros de commande et identifiants de transaction.

L'import du même fichier plusieurs fois ne doit pas créer plusieurs fois les mêmes opérations.

## 11.9 Rapprochement des stocks

Une transaction importée ne doit pas modifier automatiquement le stock sans validation appropriée.

Les achats importés ne deviennent pas du stock physique avant confirmation de réception.

Les ventes importées doivent pouvoir être rapprochées des exemplaires concernés.

Une vente sans exemplaire correspondant doit être signalée comme non rapprochée.

## 11.10 Historique des imports

Conserver :

- Date.
- Plateforme.
- Fichier.
- Nombre de lignes.
- Nombre importé.
- Nombre de doublons.
- Nombre d'erreurs.
- Détails des anomalies.

Conserver également la provenance des données importées.

---

# 12. GESTION DES LOTS

## 12.1 Objectif

Composer des lots à partir des cartes du stock à vendre.

## 12.2 Informations

- Nom.
- Description.
- Cartes.
- Quantités.
- Langue.
- État.
- Coût total.
- Prix souhaité.
- Bénéfice estimé.
- Date de création.
- Statut.

## 12.3 Fonctionnalités

- Créer un lot.
- Ajouter des cartes.
- Retirer des cartes.
- Modifier les quantités.
- Consulter le détail.
- Réserver les exemplaires.
- Annuler un lot.
- Marquer un lot comme vendu.

## 12.4 Statuts

- Brouillon.
- Disponible.
- Réservé.
- Vendu.
- Annulé.

Les cartes intégrées dans un lot ne doivent plus être disponibles individuellement.

L'annulation doit libérer les exemplaires.

---

# 13. BOOSTERS RECONDITIONNÉS

## 13.1 Objectif

Permettre de créer des boosters personnalisés à partir des cartes du stock.

## 13.2 Recettes

Chaque recette comporte :

- Nom.
- Description.
- Langue.
- Nombre de cartes.
- Quotas par rareté.
- Catégories.
- Prix de vente souhaité.

## 13.3 Catégories configurables

- Communes.
- Peu communes.
- Rares.
- Brillantes.
- Reverse.
- Spéciales.
- Autres catégories.

## 13.4 Fabrication

Pour chaque booster :

- Recette utilisée.
- Cartes réellement consommées.
- Quantités.
- Coût de fabrication.
- Date.
- Prix souhaité.
- Statut.

## 13.5 Règles

- Les cartes utilisées sont retirées des disponibilités.
- Les exemplaires sont tracés.
- La composition réelle est conservée.
- Le coût est calculé à partir des exemplaires utilisés.
- Aucune carte fictive n'est créée pour compléter une recette.

---

# 14. PRODUITS SCELLÉS

## 14.1 Types

- Boosters.
- Displays.
- ETB.
- Coffrets.
- Tripacks.
- Blisters.
- Bundles.
- Pokébox.

## 14.2 Informations

- Nom.
- Extension.
- Langue.
- Quantité.
- Prix d'achat.
- Valeur estimée.
- État.
- Date d'achat.
- Notes.

## 14.3 Ouverture

Permettre d'enregistrer l'ouverture d'un produit :

- Produit d'origine.
- Date d'ouverture.
- Quantité ouverte.
- Cartes réellement obtenues.
- Destination des cartes.
- Coût d'acquisition réparti si nécessaire.

L'ouverture doit être historisée.

Le contenu théorique d'un produit ne doit jamais être considéré comme un inventaire réel.

Seules les cartes confirmées par l'utilisateur peuvent être ajoutées à la collection ou au stock.

---

# 15. FOURNISSEURS ET VENDEURS

Créer une rubrique dédiée.

Informations :

- Nom.
- Type.
- Coordonnées.
- Site internet.
- Notes.
- Historique des achats.

Permettre d'ajouter, modifier, consulter et rechercher les fournisseurs.

Un fournisseur peut être associé à plusieurs achats.

---

# 16. HISTORIQUE ET MOUVEMENTS

## 16.1 Objectif

Conserver une traçabilité complète des opérations.

## 16.2 Types de mouvements

- Ajout de carte.
- Achat.
- Réception.
- Transfert.
- Réservation.
- Libération.
- Vente.
- Création de lot.
- Fabrication de booster.
- Ouverture de produit.
- Correction.
- Annulation.

## 16.3 Informations

Chaque mouvement doit contenir :

- Identifiant.
- Date.
- Utilisateur.
- Type.
- Produit ou carte.
- Quantité.
- Motif.
- Référence de l'opération.
- Ancien statut.
- Nouveau statut si applicable.

## 16.4 Règles

Les mouvements historiques ne sont pas supprimés.

Une erreur doit être corrigée par une opération inverse ou une correction tracée.

Les quantités doivent rester cohérentes entre les modules.

---

# 17. PRIX ET VALORISATION

## 17.1 Trois valeurs distinctes

Cardocia doit toujours différencier :

1. Coût d'acquisition.
2. Valeur estimée.
3. Prix de vente réellement obtenu.

## 17.2 Statistiques

- Montant total des achats.
- Montant total des ventes.
- Frais.
- Coût de revient.
- Bénéfices.
- Pertes.
- Valeur de la collection.
- Valeur du stock à vendre.

## 17.3 Sources de prix

Préparer une intégration future d'une source de prix du marché.

Prévoir :
- Prix par langue.
- Prix par finition.
- Prix par état si disponible.
- Date de mise à jour.
- Historique des prix.

Aucun prix ne doit être inventé.

Ne pas souscrire à un service payant sans validation.

---

# 18. RECHERCHE, FILTRES ET EXPORTS

## 18.1 Recherche

Prévoir une recherche dans :

- Catalogue.
- Collection.
- Stock.
- Achats.
- Ventes.
- Lots.
- Produits scellés.
- Fournisseurs.

## 18.2 Filtres

Selon les rubriques :

- Nom.
- Extension.
- Collection.
- Numéro.
- Langue.
- Rareté.
- État.
- Finition.
- Date.
- Statut.
- Plateforme.
- Prix.

## 18.3 Exports

Prévoir des exports CSV des données personnelles :

- Collection.
- Stock.
- Achats.
- Ventes.
- Lots.
- Historique.

Les exports ne doivent pas divulguer les données d'autres utilisateurs.

---

# 19. DESIGN ET EXPÉRIENCE UTILISATEUR

## 19.1 Identité visuelle

Créer une interface sombre moderne inspirée du Pokémon TCG.

Palette :
- Anthracite.
- Gris profonds.
- Bordures discrètes.
- Rouge Feu.
- Bleu Eau.
- Vert Plante.
- Jaune Électrik.
- Violet Psy.

Les couleurs des types Pokémon doivent être utilisées pour les badges et les informations pertinentes.

## 19.2 Composants

Créer des composants réutilisables :

- Sidebar.
- Header.
- Navigation mobile.
- Cartes statistiques.
- Cartes Pokémon.
- Badges de rareté.
- Tableaux.
- Filtres.
- Modales.
- Formulaires.
- Menus d'actions.
- Pagination.
- Notifications.

## 19.3 Ergonomie

L'application doit :

- Être rapide.
- Être responsive.
- Éviter les formulaires inutilement longs.
- Faciliter les ajouts en série.
- Permettre les actions courantes rapidement.
- Afficher clairement les états.
- Confirmer les opérations destructives.
- Gérer correctement les chargements et erreurs.

---

# 20. MODÈLE DE DONNÉES

Les entités suivantes constituent le périmètre fonctionnel minimal.

## Catalogue partagé

- CatalogCollection.
- CatalogSet.
- CatalogCard.

## Utilisateurs

- UserProfile.

## Collection et stock

- CollectionItem.
- StockItem.
- StockMovement.

## Achats et ventes

- Purchase.
- PurchaseLine.
- Sale.
- SaleLine.

## Lots

- Lot.
- LotLine.

## Boosters

- BoosterRecipe.
- BoosterProduct.
- BoosterLine.

## Produits scellés

- SealedProduct.
- ProductOpening.
- ProductOpeningLine.

## Fournisseurs

- Supplier.

## Importation

- ImportBatch.
- ImportedTransaction.
- ImportMapping.

## Prix

- CardPrice.
- CardPriceHistory.

Les structures définitives doivent être définies avec leurs relations, contraintes, index et règles d'intégrité.

Les opérations modifiant plusieurs tables doivent être atomiques lorsque nécessaire.

Les quantités, réservations et ventes doivent être protégées contre les conflits concurrents.

Les montants financiers doivent utiliser un type décimal adapté, jamais des calculs monétaires approximatifs en virgule flottante.

---

# 21. RÈGLES MÉTIER FONDAMENTALES

Les règles suivantes sont obligatoires :

1. Une collection est différente d'un stock à vendre.
2. Un exemplaire physique doit être identifiable.
3. Un achat n'est pas une réception.
4. Une vente doit être associée aux éléments vendus lorsque cela est possible.
5. Un exemplaire ne peut pas être vendu deux fois.
6. Un exemplaire ne peut pas être réservé deux fois.
7. Un lot réserve les cartes qui le composent.
8. Un booster fabriqué consomme réellement les cartes utilisées.
9. Un produit ouvert n'est plus un produit scellé disponible.
10. Un contenu théorique n'est pas un stock réel.
11. Un import ne doit pas créer de doublons.
12. Une valeur estimée n'est pas un bénéfice réalisé.
13. Une correction doit être historisée.
14. Les données personnelles sont isolées.
15. Le catalogue est partagé.
16. Aucune donnée fictive ne doit être utilisée.

---

# 22. SÉCURITÉ ET FIABILITÉ

Prévoir :

- RLS sur les données privées.
- Validation des données côté serveur.
- Vérification des permissions.
- Protection des routes.
- Protection des opérations sensibles.
- Gestion des erreurs.
- Contraintes d'intégrité.
- Contrôle des imports.
- Protection contre les doubles opérations.
- Sauvegarde et migrations versionnées.

Ne jamais faire confiance aux données reçues directement du navigateur pour déterminer un propriétaire, un coût ou un droit d'accès.

Les prix et calculs doivent être validés côté serveur.

---

# 23. PHASAGE DE RÉALISATION

## Phase 1 — Fondations

- Initialisation du projet.
- Configuration Next.js.
- Configuration Supabase.
- Authentification.
- Isolation des utilisateurs.
- Modèle de données initial.
- Navigation.
- Design global.

## Phase 2 — Catalogue

- Collections.
- Extensions.
- Cartes.
- Recherche.
- Fiches détaillées.
- Préparation TCGdex.

## Phase 3 — Collection et stock

- Ma collection.
- Exemplaires individuels.
- Stock à vendre.
- Transferts.
- Réservations.
- Mouvements.

## Phase 4 — Import CSV

- Assistant.
- Analyse des fichiers.
- Premier format Cardmarket.
- Détection des doublons.
- Rapprochement.
- Import d'inventaire.
- Historique.

## Phase 5 — Achats et ventes

- Achats.
- Réceptions.
- Ventes.
- Frais.
- Rentabilité.

## Phase 6 — Lots et boosters

- Composition.
- Réservation.
- Recettes.
- Fabrication.
- Traçabilité.

## Phase 7 — Produits et fournisseurs

- Produits scellés.
- Ouvertures.
- Fournisseurs.

## Phase 8 — Statistiques et finalisation

- Valorisation.
- Rentabilité.
- Graphiques.
- Exports.
- Tests complets.
- Corrections.
- Optimisation.

---

# 24. CRITÈRES DE VALIDATION

Une fonctionnalité ne peut être déclarée terminée que si :

- Le code est réellement présent.
- La page est accessible.
- Les actions fonctionnent.
- Les données sont enregistrées.
- Les permissions sont correctes.
- Les erreurs sont traitées.
- Les tests pertinents passent.
- Le comportement métier est cohérent.

Une page contenant uniquement des boutons sans logique n'est pas considérée comme terminée.

Une maquette n'est pas une fonctionnalité.

Une donnée simulée n'est pas une donnée réelle.

Les modules non encore développés doivent être signalés comme « En construction ».

---

# 25. LIVRABLE FINAL

Le résultat attendu est une application Cardocia réellement opérationnelle.

Livrables :

- Projet Next.js complet.
- Base de données Supabase structurée.
- Migrations SQL.
- Authentification.
- Sécurité et RLS.
- Interface responsive.
- Catalogue.
- Gestion de collection.
- Stock à vendre.
- Achats.
- Ventes.
- Import CSV.
- Lots.
- Boosters reconditionnés.
- Produits scellés.
- Fournisseurs.
- Historique.
- Statistiques.
- Documentation d'installation.
- Documentation des variables d'environnement.
- Instructions de déploiement.

L'objectif est de disposer d'une application simple à utiliser, fiable, évolutive et capable de centraliser toute la gestion de ses cartes Pokémon.

**Cardocia doit être un véritable outil utilisable au quotidien, et non une simple démonstration visuelle.**