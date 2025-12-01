const db = require("../db");

function getAllExpenses() {
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
        ORDER BY date DESC, id DESC
    `);

    const rows = statement.all();
    return rows;
}

function createExpense({ amount, currency, date, category, paymentMethod, description }) {
    const insertStatement = db.prepare(`
        INSERT INTO expenses (amount, currency, date, category, payment_method, description)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = insertStatement.run(
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

function updateExpense(id, { amount, currency, date, category, paymentMethod, description }) {
    const updateStatement = db.prepare(`
        UPDATE expenses
        SET
            amount = ?,
            currency = ?,
            date = ?,
            category = ?,
            payment_method = ?,
            description = ?
        WHERE id = ?
    `);

    const result = updateStatement.run(
        amount,
        currency || "EUR",
        date,
        category,
        paymentMethod || "Inconnu",
        description || "",
        id
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
        WHERE id = ?
    `);

    const updatedExpense = selectStatement.get(id);
    return updatedExpense
}

function deleteExpense(id) {
    const deleteStatement = db.prepare(`
        DELETE FROM expenses
        WHERE id = ?    
    `)

    const result = deleteStatement.run(id);

    return result.changes > 0;
}

module.exports = {
    getAllExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
};
