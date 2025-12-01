const express = require("express");
const {
    getAllSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription, 
} = require("../repositories/subscriptionsRepository");

const router = express.Router();

// GET /api/subscriptions
router.get("/", (req, res) => {
    try {
        const rows = getAllSubscriptions();
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

// POST /api/subscriptions
router.post("/", (req, res) => {
    const { name, price, currency, frequency, nextBillingDate, description } = req.body;

    if (!name || price == null || !frequency || !nextBillingDate) {
        return res.status(400).json({
            error: "name, price, frequency et nextBillingDate sont obligatoires",
        });
    }

    try {
        const newSubscription = createSubscription({
            name,
            price,
            currency,
            frequency,
            nextBillingDate,
            description,
        });

        res.status(201).json(newSubscription);
    } catch (error) {
        next(error);
    }
});

// PUT /api/subscriptions/:id
router.put("/:id", (req, res, next) => {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
        return res.status(400).json({ error: "id doit être un nombre." });
    }

    const { name, price, currency, frequency, nextBillingDate, description } = req.body;

    if (!name || price == null || !frequency || !nextBillingDate) {
        return res.status(400).json({
        error: "name, price, frequency et nextBillingDate sont obligatoires",
        });
    }

    try {
        const updated = updateSubscription(id, {
            name,
            price,
            currency,
            frequency,
            nextBillingDate,
            description,
        });

        if (!updated) {
            return res.status(404).json({ error: "Abonnement introuvable." });
        }

        res.json(updated);
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
        const deleted = deleteSubscription(id);

        if (!deleted) {
            return res.status(404).json({ error: "Abonnement introuvable." });
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

module.exports = router;
