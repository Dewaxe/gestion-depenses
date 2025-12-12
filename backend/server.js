const path = require("path");
require("dotenv").config({
  path: path.resolve(process.cwd(), process.env.NODE_ENV === "development" ? ".env.development" : ".env"),
});

const app = require("./app");

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
    console.log(`Serveur backend démarré sur http://${HOST}:${PORT}`);
});

process.on("SIGTERM", () => {
    server.close(() => {
        console.log("Serveur arrêté proprement (SIGTERM)");
        process.exit(0);
    });
});

process.on("SIGINT", () => {
    server.close(() => {
        console.log("Serveur arrêté proprement (SIGINT)");
        process.exit(0);
    });
});
