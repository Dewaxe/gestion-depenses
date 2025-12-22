const request = require("supertest");
const app = require("../app");
const db = require("../db");

function resetDatabase() {
    db.exec("DELETE FROM budget_rules;");
    db.exec("DELETE FROM revenues;");
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

function toISODateUTC(date) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysUTC(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return toISODateUTC(dt);
}

function monthYYYYMMFromISO(iso) {
  return iso.slice(0, 7);
}


module.exports = {
    app,
    resetDatabase,
    createTestUserAndGetToken,
    toISODateUTC,
    addDaysUTC,
    monthYYYYMMFromISO
};
