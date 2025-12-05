const request = require("supertest");
const app = require("../app");
const db = require("../db");

function resetDatabase() {
    db.exec("DELETE FROM expenses;");
    db.exec("DELETE FROM subscriptions;");
    db.exec("DELETE FROM users;");
}

async function createTestUserAndGetToken(email = "test@example.com", password = "password") {
    const response = await request(app)
        .post("/api/auth/register")
        .send({ email, password });

    if (response.statusCode !== 201) {
        throw new Error(
            `Échec de la création de l'utilisateur de test: ${response.statusCode} ${JSON.stringify(
                response.body
            )}`
        );
    }

    const { token, user } = response.body;
    return { token, user };
}

module.exports = {
    app,
    resetDatabase,
    createTestUserAndGetToken,
};
