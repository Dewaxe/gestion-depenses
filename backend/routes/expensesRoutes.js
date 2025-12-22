const express = require("express");
const {
    getAllExpenses,
    getExpensesByMonth,
    createExpense,
    updateExpense,
    deleteExpense,
} = require("../repositories/expensesRepository");
const { generateSubscriptionExpensesUpTo } = require("../services/subscriptionExpenseGenerator");

const router = express.Router();

function isValidMonthYYYYMM(month) {
    return typeof month === "string" && /^\d{4}-\d{2}$/.test(month);
}
function endOfMonthISO(monthYYYYMM) {
    const [y, m] = monthYYYYMM.split("-").map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0));
    const yyyy = lastDay.getUTCFullYear();
    const mm = String(lastDay.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(lastDay.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}
function todayISO() {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// GET /api/expenses
router.get("/", (req, res, next) => {
    try {
        const userId = req.userId;
        const { month } = req.query;
        const limit = month ? endOfMonthISO(month) : todayISO();
        generateSubscriptionExpensesUpTo(userId, limit);

        // GET /api/expenses?month=YYYY-MM
        if (month) {
            if (!isValidMonthYYYYMM(month)) {
                return res.status(400).json({ error: "month doit être au format YYYY-MM (ex: 2025-12)" });
            }
            return res.json(getExpensesByMonth(userId, month));
        }

        const rows = getAllExpenses(userId);
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

// POST /api/expenses
router.post("/", (req, res, next) => {
    const { amount, currency, date, category, paymentMethod, description } = req.body;

    if (amount == null || !date || !category) {
        return res.status(400).json({
            error: "amount, date et category sont obligatoires",
        });
    }

    try {
        const userId = req.userId;
        const newExpense = createExpense(userId, {
            amount,
            currency,
            date,
            category,
            paymentMethod,
            description,
        });

        res.status(201).json(newExpense);
    } catch (error) {
        next(error);
    }
});

// PUT /api/expenses/:id
router.put("/:id", (req, res, next) => {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
        return res.status(400).json({ error: "id doit être un nombre."});
    }

    const  { amount, currency, date, category, paymentMethod, description } = req.body;

    if (amount == null || !date || !category) {
        return res.status(400).json({
            error: "amount, date et category sont obligatoires",
        });
    }

    try {
        const userId = req.userId;
        const updated = updateExpense(userId, id, {
            amount,
            currency,
            date,
            category,
            paymentMethod,
            description,
        });

        if (!updated) {
            return res.status(404).json({ error: "Dépense introuvable." });
        }

        res.json(updated);
    } catch (error) {
        next(error);
    }
})

// DELETE /api/expenses/:id
router.delete("/:id", (req, res, next) => {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
        return res.status(400).json({ error: "id doit être un nombre." });
    }

    try {
        const userId = req.userId;
        const deleted = deleteExpense(userId, id);

        if (!deleted) {
            return res.status(404).json({ error: "Dépense introuvable." });
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

module.exports = router;