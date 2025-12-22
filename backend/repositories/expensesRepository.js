const db = require("../db");

function getAllExpenses(userId) {
    const statement = db.prepare(`
        SELECT
            id,
            amount,
            currency,
            date,
            category,
            source,
            subscription_id AS subscriptionId,
            payment_method AS paymentMethod,
            description
        FROM expenses
        WHERE user_id = ?
        ORDER BY date DESC, id DESC
    `);

    const rows = statement.all(userId);
    return rows;
}

function getExpensesByMonth(userId, monthYYYYMM) {
    // monthYYYYMM = "2025-12"
    const statement = db.prepare(`
        SELECT
            id,
            amount,
            currency,
            date,
            category,
            source,
            subscription_id AS subscriptionId,
            payment_method AS paymentMethod,
            description
        FROM expenses
        WHERE user_id = ? AND date LIKE ?
        ORDER BY date DESC, id DESC
    `);

    return statement.all(userId, `${monthYYYYMM}-%`);
}

function createExpense(userId, { amount, currency, date, category, paymentMethod, description, source, subscriptionId }) {
    const resolvedSource = source ?? (subscriptionId ? "subscription" : "manual");
    const resolvedSubscriptionId = resolvedSource === "subscription" ? (subscriptionId ?? null) : null;
    
    const insertStatement = db.prepare(`
        INSERT INTO expenses (user_id, amount, currency, date, category, source, subscription_id, payment_method, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = insertStatement.run(
        userId,
        amount,
        currency || "EUR",
        date,
        category,
        resolvedSource,
        resolvedSubscriptionId,
        paymentMethod || "Inconnu",
        description || ""
    );

    const newExpense = {
        id: info.lastInsertRowid,
        amount,
        currency: currency || "EUR",
        date,
        category,
        source: resolvedSource,
        subscriptionId: resolvedSubscriptionId,
        paymentMethod: paymentMethod || "Inconnu",
        description: description || "",
    };

    return newExpense;
}

function updateExpense(userId, id, { amount, currency, date, category, paymentMethod, description }) {
    //on n'autorise pas de changer source & subscriptionId via PUT
    const updateStatement = db.prepare(`
        UPDATE expenses
        SET
            amount = ?,
            currency = ?,
            date = ?,
            category = ?,
            payment_method = ?,
            description = ?
        WHERE id = ? AND user_id = ?
    `);

    const result = updateStatement.run(
        amount,
        currency || "EUR",
        date,
        category,
        paymentMethod || "Inconnu",
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
            amount,
            currency,
            date,
            category,
            source,
            subscription_id AS subscriptionId,
            payment_method AS paymentMethod,
            description
        FROM expenses
        WHERE id = ? AND user_id = ?
    `);

    const updatedExpense = selectStatement.get(id, userId);
    return updatedExpense
}

function deleteExpense(userId, id) {
    const deleteStatement = db.prepare(`
        DELETE FROM expenses
        WHERE id = ? AND user_id = ?  
    `)

    const result = deleteStatement.run(id, userId);

    return result.changes > 0;
}

module.exports = {
    getAllExpenses,
    getExpensesByMonth,
    createExpense,
    updateExpense,
    deleteExpense,
};
