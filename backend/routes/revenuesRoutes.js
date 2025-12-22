const express = require("express");
const {
    getAllRevenues,
    getRevenuesByMonth,
    createRevenue,
    updateRevenue,
    deleteRevenue,
} = require("../repositories/revenuesRepository");

const router = express.Router();

function isValidMonthYYYYMM(month) {
    return typeof month === "string" && /^\d{4}-\d{2}$/.test(month);
}
function isValidDateISO(d) {
    return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
}
function isValidType(t) {
    return t === "one-off" || t === "recurring";
}

// GET /api/revenues?month=YYYY-MM
router.get("/", (req, res, next) => {
    try {
        const userId = req.userId;
        const { month } = req.query;

        if (month) {
            if (!isValidMonthYYYYMM(month)) {
                return res.status(400).json({ error: "month doit être au format YYYY-MM" });
            }
            return res.json(getRevenuesByMonth(userId, month));
        }

        return res.json(getAllRevenues(userId));
    } catch (e) {
        next(e);
    }
});

// POST /api/revenues
router.post("/", (req, res, next) => {
    try {
        const userId = req.userId;
        const { amount, currency, date, type, description } = req.body;

        if (typeof amount !== "number") return res.status(400).json({ error: "amount doit être un nombre" });
        if (!isValidDateISO(date)) return res.status(400).json({ error: "date doit être au format YYYY-MM-DD" });
        if (type && !isValidType(type)) return res.status(400).json({ error: "type invalide (one-off|recurring)" });

        const created = createRevenue(userId, { amount, currency, date, type, description });
        return res.status(201).json(created);
    } catch (e) {
        next(e);
    }
});

// PUT /api/revenues/:id
router.put("/:id", (req, res, next) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id doit être un nombre." });

    try {
        const userId = req.userId;
        const { amount, currency, date, type, description } = req.body;

        if (typeof amount !== "number") return res.status(400).json({ error: "amount doit être un nombre" });
        if (!isValidDateISO(date)) return res.status(400).json({ error: "date doit être au format YYYY-MM-DD" });
        if (type && !isValidType(type)) return res.status(400).json({ error: "type invalide (one-off|recurring)" });

        const updated = updateRevenue(userId, id, { amount, currency, date, type, description });
        if (!updated) return res.status(404).json({ error: "Revenu introuvable." });

        return res.json(updated);
    } catch (e) {
        next(e);
    }
});

// DELETE /api/revenues/:id
router.delete("/:id", (req, res, next) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id doit être un nombre." });

    try {
        const userId = req.userId;
        const deleted = deleteRevenue(userId, id);
        if (!deleted) return res.status(404).json({ error: "Revenu introuvable." });

        return res.status(204).send();
    } catch (e) {
        next(e);
    }
});

module.exports = router;
