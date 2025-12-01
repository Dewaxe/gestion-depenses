const express = require("express");
const cors = require("cors");
require("./db");
const expensesRoutes = require("./routes/expensesRoutes");
const subscriptionsRoutes = require("./routes/subscriptionsRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/expenses", expensesRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);

app.use(errorHandler);

module.exports = app;