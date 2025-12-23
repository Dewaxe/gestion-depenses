const express = require("express");
const {
    getAllBudgetRules,
    createBudgetRule,
    updateBudgetRule,
    deleteBudgetRule,
} = require("../repositories/budgetRulesRepository");

const router = express.Router();

function isValidNumber(n) {
    return typeof n === "number" && !Number.isNaN(n);
}

router.get("/", (req, res, next) => {
    try {
        const userId = req.userId;
        return res.json(getAllBudgetRules(userId));
    } catch (e) {
        next(e);
    }
});

router.post("/", (req, res, next) => {
    try {
        const userId = req.userId;
        const { category, monthlyLimit, isActive } = req.body;

        if (!isValidNumber(monthlyLimit) || monthlyLimit < 0) {
            return res.status(400).json({ error: "monthlyLimit doit être un nombre >= 0" });
        }

        const created = createBudgetRule(userId, { category, monthlyLimit, isActive });
        return res.status(201).json(created);
    } catch (e) {
        next(e);
    }
});

router.put("/:id", (req, res, next) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id doit être un nombre." });

    try {
        const userId = req.userId;
        const { category, monthlyLimit, isActive } = req.body;

        if (!isValidNumber(monthlyLimit) || monthlyLimit < 0) {
            return res.status(400).json({ error: "monthlyLimit doit être un nombre >= 0" });
        }

        const updated = updateBudgetRule(userId, id, { category, monthlyLimit, isActive });
        if (!updated) return res.status(404).json({ error: "Règle budgétaire introuvable." });

        return res.json(updated);
    } catch (e) {
        next(e);
    }
});

router.delete("/:id", (req, res, next) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id doit être un nombre." });

    try {
        const userId = req.userId;
        const deleted = deleteBudgetRule(userId, id);
        if (!deleted) return res.status(404).json({ error: "Règle budgétaire introuvable." });

        return res.status(204).send();
    } catch (e) {
        next(e);
    }
});

module.exports = router;
