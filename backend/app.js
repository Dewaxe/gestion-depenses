const express = require("express");
const cors = require("cors");
require("./db");
const expensesRoutes = require("./routes/expensesRoutes");
const subscriptionsRoutes = require("./routes/subscriptionsRoutes");
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/expenses", authMiddleware, expensesRoutes);
app.use("/api/subscriptions", authMiddleware, subscriptionsRoutes);

app.use(errorHandler);

module.exports = app;