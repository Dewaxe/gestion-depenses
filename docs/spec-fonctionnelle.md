# Application de gestion de dépenses et d'abonnements

## Objectif

Permettre à un utilisateur de suivre :
- Ses **dépenses** du quotidien (achats, factures, etc.).
- Ses **abonnements** (Netflix, Spotify, forfait mobile, etc.).

L'application doit être :
- Simple à utiliser.
- Accessible depuis un navigateur (PC et mobile).
- Installable comme une application (PWA) pour un accès rapide.

---

## Types de données

### Dépense

Une *dépense* représente un achat ou un paiement ponctuel.

Champs envisagés :
- `id` : identifiant unique de la dépense.
- `amount` : montant de la dépense.
- `currency` : devise (par exemple "EUR").
- `date` : date de la dépense.
- `category` : catégorie (ex : "Courses", "Logement", "Transport", "Loisirs").
- `paymentMethod` : moyen de paiement (ex : "Carte", "Espèces", "Virement").
- `description` : texte libre pour décrire la dépense (facultatif).

### Abonnement

Un *abonnement* représente un paiement récurrent.

Champs envisagés :
- `id` : identifiant unique de l'abonnement.
- `name` : nom du service (ex : "Netflix", "Spotify").
- `amount` : montant par période.
- `currency` : devise (ex : "EUR").
- `frequency` : fréquence (ex : "mensuel", "annuel").
- `nextBillingDate` : date de la prochaine échéance.
- `category` : catégorie (ex : "Streaming", "Téléphone", "Logiciels").
- `paymentMethod` : moyen de paiement.
- `notes` : remarques (facultatif).
- `isActive` : abonnement actif ou résilié.

---

## MVP (Produit Minimum Viable)

Fonctionnalités de base à livrer en premier :

### Côté dépenses

- [ ] Ajouter une dépense.
- [ ] Lister toutes les dépenses.
- [ ] Filtrer les dépenses par :
  - période (par exemple : mois en cours),
  - catégorie.
- [ ] Modifier une dépense.
- [ ] Supprimer une dépense.
- [ ] Voir le **total des dépenses** sur une période (par exemple par mois).

### Côté abonnements

- [ ] Ajouter un abonnement.
- [ ] Lister tous les abonnements.
- [ ] Voir le coût total des abonnements par mois.
- [ ] Modifier un abonnement.
- [ ] Supprimer un abonnement.
- [ ] Indiquer clairement les **prochaines échéances** (par exemple les abonnements qui se renouvellent dans les 30 prochains jours).

---

## Écrans principaux (brouillon)

1. **Accueil / Dashboard**
   - Résumé rapide :
     - total des dépenses du mois en cours,
     - total des abonnements mensuels,
     - liste des prochaines échéances d'abonnements.

2. **Écran Dépenses**
   - Liste des dépenses.
   - Formulaire pour ajouter/modifier une dépense.
   - Filtres (période, catégorie).

3. **Écran Abonnements**
   - Liste des abonnements.
   - Formulaire pour ajouter/modifier un abonnement.
   - Indication des prochaines échéances.

4. **Écran Statistiques (optionnel pour plus tard)**
   - Graphiques simples (par catégorie, par mois, etc.).

---

## User stories (brouillon)

- En tant qu'utilisateur, je veux ajouter rapidement une dépense pour ne pas oublier mes achats.
- En tant qu'utilisateur, je veux voir la liste de mes dépenses du mois pour comprendre où part mon argent.
- En tant qu'utilisateur, je veux suivre tous mes abonnements pour éviter de payer pour des services que j'ai oubliés.
- En tant qu'utilisateur, je veux voir les abonnements qui se renouvellent bientôt pour pouvoir résilier à temps si besoin.
- En tant qu'utilisateur, je veux voir le coût total de mes abonnements par mois pour évaluer mon budget fixe.
