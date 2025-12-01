const db = require("../db");

function getAllSubscriptions() {
    const statement = db.prepare(`
        SELECT
        id,
        name,
        price,
        currency,
        frequency,
        next_billing_date AS nextBillingDate,
        description
        FROM subscriptions
        ORDER BY next_billing_date ASC, id ASC
    `);

    const rows = statement.all();
    return rows;
}

function createSubscription({ name, price, currency, frequency, nextBillingDate, description }) {
    const insertStatement = db.prepare(`
        INSERT INTO subscriptions (name, price, currency, frequency, next_billing_date, description)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = insertStatement.run(
        name,
        price,
        currency || "EUR",
        frequency,
        nextBillingDate,
        description || ""
    );

    const newSubscription = {
        id: info.lastInsertRowid,
        name,
        price,
        currency: currency || "EUR",
        frequency,
        nextBillingDate,
        description: description || "",
    };

    return newSubscription;
}

module.exports = {
    getAllSubscriptions,
    createSubscription,
};
