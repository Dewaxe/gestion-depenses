const Database = require("better-sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "database.sqlite");
const db = new Database(dbPath);

db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'EUR',
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'Inconnu',
        description TEXT DEFAULT ''
    );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'EUR',
        frequency TEXT NOT NULL,
        next_billing_date TEXT NOT NULL,
        description TEXT DEFAULT ''
    );
`);

module.exports = db;