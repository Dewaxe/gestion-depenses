const db = require("../db");

function getAllSubscriptions(userId) {
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
        WHERE user_id = ?
        ORDER BY next_billing_date ASC, id ASC
    `);

    const rows = statement.all(userId);
    return rows;
}

function createSubscription(userId, { name, price, currency, frequency, nextBillingDate, description }) {
    const insertStatement = db.prepare(`
        INSERT INTO subscriptions (user_id, name, price, currency, frequency, next_billing_date, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const info = insertStatement.run(
        userId,
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

function updateSubscription(userId, id, { name, price, currency, frequency, nextBillingDate, description }) {
    const updateStatement = db.prepare(`
        UPDATE subscriptions
        SET
            name = ?,
            price = ?,
            currency = ?,
            frequency = ?,
            next_billing_date = ?,
            description = ?
        WHERE id = ? AND user_id = ?
    `);

    const result = updateStatement.run(
        name,
        price,
        currency || "EUR",
        frequency,
        nextBillingDate,
        description || "",
        id,
        userId
    );

    if (result.changes === 0) {
        return null;
    }

    const selectStatement = db.prepare(`
        SELECT
            id,
            name,
            price,
            currency,
            frequency,
            next_billing_date AS nextBillingDate,
            description
        FROM subscriptions
        WHERE id = ? AND user_id = ?
    `);

    const updatedSubscription = selectStatement.get(id, userId);
    return updatedSubscription;
}

function deleteSubscription(userId, id) {
    const deleteStatement = db.prepare(`
        DELETE FROM subscriptions
        WHERE id = ? AND user_id = ?
    `);

    const result = deleteStatement.run(id, userId);

    return result.changes > 0;
}


module.exports = {
    getAllSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription,
};
