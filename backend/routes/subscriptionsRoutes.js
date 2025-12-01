const express = require("express");
const db = require("../db");
const router = express.Router();

// GET /api/subscriptions
router.get("/", (req, res) => {
    const statement = db.prepare(`
        SELECT
        id,
        name,
        price,
        currency,
        frequency,
        next_billing_date AS nextBillingDate,
        description
        FROM subscriptions
        ORDER BY next_billing_date ASC, id ASC
    `);

    const rows = statement.all();
    res.json(rows);
});

// POST /api/subscriptions
router.post("/", (req, res) => {
    const { name, price, currency, frequency, nextBillingDate, description } = req.body;

    if (!name || price == null || !frequency || !nextBillingDate) {
        return res.status(400).json({
        error: "name, price, frequency et nextBillingDate sont obligatoires",
        });
    }

    const insertStatement = db.prepare(`
        INSERT INTO subscriptions (name, price, currency, frequency, next_billing_date, description)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = insertStatement.run(
        name,
        price,
        currency || "EUR",
        frequency,
        nextBillingDate,
        description || ""
    );

    const newSubscription = {
        id: info.lastInsertRowid,
        name,
        price,
        currency: currency || "EUR",
        frequency,
        nextBillingDate,
        description: description || "",
    };

    res.status(201).json(newSubscription);
});

module.exports = router;
