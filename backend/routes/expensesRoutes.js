const express = require("express");
const db = require("../db");
const router = express.Router();


// GET /api/expenses
router.get("/", (req, res) => {
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
    res.json(rows);
});

// POST /api/expenses
router.post("/", (req, res) => {
    const { amount, currency, date, category, paymentMethod, description } = req.body;

    if (amount == null || !date || !category) {
        return res.status(400).json({
        error: "amount, date et category sont obligatoires",
        });
    }

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

    res.status(201).json(newExpense);
});

module.exports = router;