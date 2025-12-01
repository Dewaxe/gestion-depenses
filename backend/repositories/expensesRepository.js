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

module.exports = {
    getAllExpenses,
    createExpense,
};
