const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "Le serveur fonctionne !" });
});
app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});