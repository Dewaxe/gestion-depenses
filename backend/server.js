const express = require("express");
const cors = require("cors");
const db = require("./db");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "Le serveur fonctionne !" });
});

app.get("/api/expenses", (req, res) => {
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

app.post("/api/expenses", (req, res) => {
    const { amount, currency, date, category, paymentMethod, description } = req.body;

    if (amount == null || !date || !category) {
        return res.status(400).json({ error: "amount, date et category sont obligatoires" });
    }

    const insertStatment = db.prepare(`
        INSERT INTO expenses (amount, currency, date, category, payment_method, description)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = insertStatment.run(
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
})

app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});