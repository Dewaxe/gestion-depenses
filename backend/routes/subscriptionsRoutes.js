const express = require("express");
const { getAllSubscriptions, createSubscription } = require("../repositories/subscriptionsRepository");

const router = express.Router();

// GET /api/subscriptions
router.get("/", (req, res) => {
    try {
        const rows = getAllSubscriptions();
        res.json(rows);
    } catch (error) {
        console.error("Erreur getAllSubscriptions:", error);
        res
            .status(500)
            .json({ error: "Erreur serveur lors de la récupération des abonnements." });
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
        console.error("Erreur createSubscription:", error);
        res
        .status(500)
        .json({ error: "Erreur serveur lors de la création de l'abonnement." });
    }
});

module.exports = router;
