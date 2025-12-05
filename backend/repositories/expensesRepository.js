const db = require("../db");

function getAllExpenses(userId) {
    const statement = db.prepare(`
        SELECT
            id,
            amount,
            currency,
            date,
            category,
            payment_method AS paymentMethod,
            description
        FROM expenses
        WHERE user_id = ?
        ORDER BY date DESC, id DESC
    `);

    const rows = statement.all(userId);
    return rows;
}

function createExpense(userId, { amount, currency, date, category, paymentMethod, description }) {
    const insertStatement = db.prepare(`
        INSERT INTO expenses (user_id, amount, currency, date, category, payment_method, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const info = insertStatement.run(
        userId,
        amount,
        currency || "EUR",
        date,
        category,
        paymentMethod || "Inconnu",
        description || ""
    );

    const newExpense = {
        id: info.lastInsertRowid,
        amount,
        currency: currency || "EUR",
        date,
        category,
        paymentMethod: paymentMethod || "Inconnu",
        description: description || "",
    };

    return newExpense;
}

function updateExpense(userId, id, { amount, currency, date, category, paymentMethod, description }) {
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
    createExpense,
    updateExpense,
    deleteExpense,
};
