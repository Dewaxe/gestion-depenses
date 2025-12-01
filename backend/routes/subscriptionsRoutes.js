const express = require("express");
const { getAllSubscriptions, createSubscription } = require("../repositories/subscriptionsRepository");

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

module.exports = router;
