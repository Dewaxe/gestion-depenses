# 💸 Eco Buddy – Application de gestion de dépenses

Eco Buddy est une **application web de gestion de finances personnelles** pour suivre les **dépenses**, **revenus** et **abonnements**.  
Le projet est développé comme un **projet portfolio full‑stack** avec une attention particulière à la **qualité du code**, la **logique métier** et l’**expérience utilisateur**.

🌍 Site public : https://eco-buddy.dempure.com

---

## 🎯 Objectif du projet

L’objectif d'Eco Buddy est de fournir une base saine pour une application de budget personnel :
* Comprendre où va son argent
* Anticiper les charges récurrentes
* Visualiser rapidement sa situation financière
* Poser des règles budgétaires efficientes

Côté développement :
* **Architecture claire** front / back
* **Logique métier explicite et documentée**
* Composants réutilisables
* Code lisible et maintenable

---

## ✨ Fonctionnalités principales

### Dépenses
* Ajout, modification et suppression de dépenses
* Association à une catégorie
* Gestion des dépenses ponctuelles ou issues d’abonnements
* Calculs automatiques du total et des dépenses du mois courant

### Revenus
* Ajout de **revenus ponctuels ou récurrents**
* Visualisation par mois
* Calcul du solde basé sur le mois affiché

### Abonnements
* Création d’abonnements (mensuel, annuel, trimestriel, etc.)
* Calcul du coût mensuel équivalent
* **Génération automatique des dépenses** liées aux abonnements
* Gestion des statuts (actif, promo, résilié)

### Accueil / Dashboard
* Vue synthétique de la situation financière
* Solde du mois
* Dépenses cumulées
* Prochains prélèvements

### Analyse
* Analyse des dépenses par catégorie
* Comparaison sur plusieurs mois

### Import
* Import de données via fichier CSV
* Prévisualisation avant validation

---

## 🧱 Stack technique

### Frontend
* **React** + **TypeScript**
* **Vite** pour le bundling et le dev server
* React Router pour la navigation
* CSS modulaire et composants réutilisables

### Backend
* **Node.js** + **Express**
* API REST
* **SQLite** avec `better-sqlite3`

### Déploiement
Le site est **auto-hébergé** sur un serveur personnel (raspberry pi) :

* Environnement Linux
* Build de l’application, en séparant backend et frontend
* Serveur web pour la mise en ligne
* Gestion manuelle du déploiement pour une parfaite compréhension de la chaîne complète

👉 Portfolio en ligne : **https://eco-buddy.dempure.com**

---

## 🗂️ Architecture du projet

Le dépôt est organisé en deux applications distinctes, front et back, avec leurs dépendances et configurations propres.

```txt
.
├── backend
│   ├── server.js              # Serveur Express + routes API
│   ├── db.js                  # Connexion SQLite et création des tables
│   ├── routes/                # Endpoints REST
│   ├── services/              # Logique métier côté serveur
│   ├── middleware/            # Auth, validation, etc.
│   ├── .env                   # Variables d’environnement backend
│   └── ...
├── frontend
│   ├── src
│   │   ├── api/               # Client API et endpoints
│   │   ├── components/        # Composants UI réutilisables
│   │   ├── pages/             # Pages principales (Accueil, Dépenses, etc.)
│   │   ├── styles/            # Styles globaux et spécifiques
│   │   ├── types/             # Typage TypeScript
│   │   └── ...
│   ├── public/                # Assets statiques
│   ├── .env.development       # Variables d’environnement front
│   └── ...
└── README.md
```

---

## 📌 État du projet

Le projet est en cours de développement actif.  
Certaines fonctionnalités sont déjà opérationnelles, d’autres sont en cours d’implémentation ou de refonte.

---

## 👤 À propos

Eco Buddy est un projet personnel réalisé dans une démarche d’amélioration continue en développement web full‑stack.  
Il sert à la fois de terrain d’expérimentation technique et de vitrine de compétences.

