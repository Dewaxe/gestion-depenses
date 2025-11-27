const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const expenses = [
    {
        id: 1,
        amount: 25.5,
        currency: "EUR",
        date: "2025-01-15",
        category: "Courses",
        paymentMethod: "Carte",
        description: "Courses raclette",
    }
]

let nextExpenseId = 2;

app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "Le serveur fonctionne !" });
});

app.get("/api/expenses", (req, res) => {
    res.json(expenses);
});

app.post("/api/expenses", (req, res) => {
    const { amount, currency, date, category, paymentMethod, description } = req.body;

    if (amount == null || !date || !category) {
        return res.status(400).json({ error: "amount, date et category sont obligatoires" });
    }

    const newExpense = {
        id: nextExpenseId++,
        amount,
        currency: currency || "EUR",
        date,
        category,
        paymentMethod: paymentMethod || "Inconnu",
        description: description || "",
    };

    expenses.push(newExpense);

    res.status(201).json(newExpense);

})

app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});