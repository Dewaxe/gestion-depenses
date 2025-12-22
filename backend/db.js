const Database = require("better-sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "database.sqlite");
const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

function initSchema({ reset = false } = {}) {
    if (reset) {
         db.exec(`
            DROP TABLE IF EXISTS budget_rules;
            DROP TABLE IF EXISTS revenues;
            DROP TABLE IF EXISTS expenses;
            DROP TABLE IF EXISTS subscriptions;
            DROP TABLE IF EXISTS users;
        `);
    }

    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL DEFAULT '',
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            preferences TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            promo_amount REAL DEFAULT NULL,
            currency TEXT NOT NULL DEFAULT 'EUR',
            billing_period TEXT NOT NULL CHECK (billing_period IN ('weekly','monthly','quarterly','yearly')),
            monthly_equivalent REAL NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('active','trial','promo','cancelled')),
            status_end_date TEXT DEFAULT NULL,
            next_billing_date TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'EUR',
            date TEXT NOT NULL,
            category TEXT NOT NULL,
            source TEXT NOT NULL CHECK (source IN ('manual','subscription')),
            subscription_id INTEGER DEFAULT NULL,
            payment_method TEXT NOT NULL DEFAULT 'Inconnu',
            description TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS revenues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'EUR',
            date TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('one-off','recurring')),
            recurring_template_id INTEGER DEFAULT NULL,
            description TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS budget_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category TEXT DEFAULT NULL,
            monthly_limit REAL NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
        CREATE INDEX IF NOT EXISTS idx_revenues_user_date ON revenues(user_id, date);
        CREATE INDEX IF NOT EXISTS idx_subscriptions_user_next ON subscriptions(user_id, next_billing_date);
        CREATE INDEX IF NOT EXISTS idx_revenues_user_template_date ON revenues(user_id, recurring_template_id, date);
        CREATE INDEX IF NOT EXISTS idx_budget_rules_user_cat ON budget_rules(user_id, category);
    `);

}

// RESET_DB=1 => reset la db (dev)
initSchema({ reset: process.env.RESET_DB === "1" || process.env.NODE_ENV === "test"});

module.exports = db;