const express = require("express");
const cors = require("cors");
require("./db");
const expensesRoutes = require("./routes/expensesRoutes");
const subscriptionsRoutes = require("./routes/subscriptionsRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/expenses", expensesRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Serveur backend démarré sur http://localhost:${PORT}`);
});