# 💸 Gestion de dépenses & abonnements

Application full-stack pour suivre ses **dépenses** et ses **abonnements**, avec un **dashboard** simple et lisible.

- Frontend : React + TypeScript (Vite)
- Backend : Node.js + Express
- Base de données : SQLite
- Déploiement : Front sur Vercel, Back sur Render

> Projet perso réalisé pour approfondir le développement full-stack JavaScript et servir de projet portfolio.

---

## 🖥️ Démo

- **Frontend (Vercel)** : https://gestion-depenses-drab.vercel.app/  
- **Backend API (Render)** : https://gestion-depenses-backend.onrender.com/api/expenses
https://gestion-depenses-backend.onrender.com/api/subscriptions

---

## ✨ Fonctionnalités

### Dépenses

- Ajouter une dépense (montant, date, catégorie, moyen de paiement, description).
- Afficher la liste des dépenses.
- Calculer automatiquement :
  - le total de toutes les dépenses,
  - le total des dépenses du **mois courant**.

### Abonnements

- Ajouter un abonnement (nom du service, prix, devise, fréquence, prochaine échéance, description).
- Afficher la liste des abonnements.
- Calculer :
  - le total des abonnements **mensuels**,
  - le total des abonnements **annuels**.

### Dashboard (page d’accueil)

- Vue d’ensemble :
  - total des dépenses,
  - dépenses du mois en cours,
  - total des abonnements mensuels,
  - total des abonnements annuels.
- Liste des **prochaines échéances d’abonnements**.
- Liste des **dernières dépenses** enregistrées.

---

## 🧱 Stack technique

### Frontend

- [React] + [TypeScript]
- [Vite] pour le bundling et le dev server
- React Router pour la navigation
- Appels à l’API via `fetch` encapsulé dans un petit client (`api/client.ts`)

### Backend

- [Node.js] + [Express]
- [better-sqlite3] pour interagir avec SQLite
- API REST simple :
  - `/api/expenses` (GET, POST)
  - `/api/subscriptions` (GET, POST)

### Base de données

- SQLite, fichier local `database.sqlite`
- Tables :
  - `expenses`
  - `subscriptions`

---

## 🗂️ Structure du projet

```txt
.
├── backend
│   ├── db.js              # Connexion à SQLite et création des tables
│   ├── server.js          # Serveur Express + routes API
│   ├── package.json
│   └── ...
├── frontend
│   ├── src
│   │   ├── api
│   │   │   ├── client.ts              # Client API générique (apiFetch)
│   │   │   ├── expensesApi.ts         # Fonctions pour l'API /expenses
│   │   │   └── subscriptionsApi.ts    # Fonctions pour l'API /subscriptions
│   │   ├── components
│   │   │   ├── Card.tsx               # Composant visuel de "carte"
│   │   │   └── PageTitle.tsx          # Titre de page réutilisable
│   │   ├── pages
│   │   │   ├── HomePage.tsx           # Dashboard
│   │   │   ├── ExpensesPage.tsx       # Gestion des dépenses
│   │   │   └── SubscriptionsPage.tsx  # Gestion des abonnements
│   │   ├── types
│   │   │   ├── expense.ts
│   │   │   └── subscription.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── ...
├── README.md
└── ...
