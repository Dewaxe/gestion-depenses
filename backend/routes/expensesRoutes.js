const express = require("express");
const { getAllExpenses, createExpense } = require("../repositories/expensesRepository");

const router = express.Router();

// GET /api/expenses
router.get("/", (req, res) => {
    try {
        const rows = getAllExpenses();
        res.json(rows);
    } catch (error) {
        console.error("Erreur getAllExpenses:", error);
        res
            .status(500)
            .json({ error: "Erreur serveur lors de la récupération des dépenses." });
    }
});

// POST /api/expenses
router.post("/", (req, res) => {
    const { amount, currency, date, category, paymentMethod, description } = req.body;

    if (amount == null || !date || !category) {
        return res.status(400).json({
            error: "amount, date et category sont obligatoires",
        });
    }

    try {
        const newExpense = createExpense({
            amount,
            currency,
            date,
            category,
            paymentMethod,
            description,
        });

        res.status(201).json(newExpense);
    } catch (error) {
        console.error("Erreur createExpense:", error);
        res.status(500).json({ error: "Erreur serveur lors de la création de la dépense." });
    }
});

module.exports = router;