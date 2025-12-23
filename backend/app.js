const express = require("express");
const cors = require("cors");
require("./db");
const healthRoutes = require("./routes/healthRoutes");
const expensesRoutes = require("./routes/expensesRoutes");
const subscriptionsRoutes = require("./routes/subscriptionsRoutes");
const revenuesRoutes = require("./routes/revenuesRoutes");
const homeRoutes = require("./routes/homeRoutes");
const budgetRulesRoutes = require("./routes/budgetRulesRoutes");
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/health", healthRoutes);
// app.get("/api/health", (req, res) => {
//   res.json({
//     status: "ok",
//     timestamp: new Date().toISOString(),
//   });
// });
app.use("/api/expenses", authMiddleware, expensesRoutes);
app.use("/api/subscriptions", authMiddleware, subscriptionsRoutes);
app.use("/api/revenues", authMiddleware, revenuesRoutes);
app.use("/api/home", authMiddleware, homeRoutes);
app.use("/api/budget-rules", authMiddleware, budgetRulesRoutes);

app.use(errorHandler);

module.exports = app;