const express = require("express");
const {
    getAllSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription, 
} = require("../repositories/subscriptionsRepository");
const { generateSubscriptionExpensesUpTo } = require("../services/subscriptionExpenseGenerator");

const router = express.Router();

function todayISO() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isValidDateISO(d) {
    return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
}

function isValidBillingPeriod(p) {
    return ["weekly", "monthly", "quarterly", "yearly"].includes(p);
}

// GET /api/subscriptions
router.get("/", (req, res, next) => {
    try {
        const userId = req.userId;
        const rows = getAllSubscriptions(userId);
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

// POST /api/subscriptions
router.post("/", (req, res, next) => {
    try {
        const userId = req.userId;
        const {
            name,
            amount,
            billingPeriod,
            nextBillingDate,
            promoAmount,
            status,
            statusEndDate,
            currency,
            description,
        } = req.body;

        if (!name || typeof name !== "string") {
            return res.status(400).json({ error: "name est requis" });
        }
        if (typeof amount !== "number") {
            return res.status(400).json({ error: "amount doit être un nombre" });
        }
        if (!isValidBillingPeriod(billingPeriod)) {
            return res.status(400).json({ error: "billingPeriod invalide (weekly|monthly|quarterly|yearly)" });
        }
        if (!isValidDateISO(nextBillingDate)) {
            return res.status(400).json({ error: "nextBillingDate doit être au format YYYY-MM-DD" });
        }
        if (promoAmount !== undefined && typeof promoAmount !== "number") {
            return res.status(400).json({ error: "promoAmount doit être un nombre si fourni" });
        }
        if (statusEndDate && !isValidDateISO(statusEndDate)) {
            return res.status(400).json({ error: "statusEndDate doit être au format YYYY-MM-DD" });
        }

        const created = createSubscription(userId, {
            name,
            amount,
            promoAmount,
            currency,
            billingPeriod,
            status,
            statusEndDate,
            nextBillingDate,
            description,
        });

        generateSubscriptionExpensesUpTo(userId, todayISO());

        res.status(201).json(created);
    } catch (e) {
        next(e);
    }

});

// PUT /api/subscriptions/:id
router.put("/:id", (req, res, next) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id doit être un nombre." });

    const {
        name,
        amount,
        promoAmount,
        currency,
        billingPeriod,
        status,
        statusEndDate,
        nextBillingDate,
        description,
    } = req.body;

    if (!name || typeof name !== "string") {
        return res.status(400).json({ error: "name est requis" });
    }
    if (typeof amount !== "number") {
        return res.status(400).json({ error: "amount doit être un nombre" });
    }
    if (!isValidBillingPeriod(billingPeriod)) {
        return res.status(400).json({ error: "billingPeriod invalide (weekly|monthly|quarterly|yearly)" });
    }
    if (!isValidDateISO(nextBillingDate)) {
        return res.status(400).json({ error: "nextBillingDate doit être au format YYYY-MM-DD" });
    }

    if (promoAmount !== undefined && typeof promoAmount !== "number") {
        return res.status(400).json({ error: "promoAmount doit être un nombre si fourni" });
    }
    if (statusEndDate && !isValidDateISO(statusEndDate)) {
        return res.status(400).json({ error: "statusEndDate doit être au format YYYY-MM-DD" });
    }
    if (status && !["active", "trial", "promo", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "status invalide (active|trial|promo|cancelled)" });
    }

    try {
        const userId = req.userId;
        const updated = updateSubscription(userId, id, {
            name,
            amount,
            promoAmount,
            currency,
            billingPeriod,
            status,
            statusEndDate,
            nextBillingDate,
            description,
        });

        if (!updated) return res.status(404).json({ error: "Abonnement introuvable." });

        return res.json(updated);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/subscriptions/:id
router.delete("/:id", (req, res, next) => {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
        return res.status(400).json({ error: "id doit être un nombre." });
    }

    try {
        const userId = req.userId;
        const deleted = deleteSubscription(userId, id);

        if (!deleted) {
            return res.status(404).json({ error: "Abonnement introuvable." });
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

module.exports = router;
