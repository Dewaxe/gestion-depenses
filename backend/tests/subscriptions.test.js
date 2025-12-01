// backend/tests/subscriptions.test.js

const request = require("supertest");
const app = require("../app");

describe("API /api/subscriptions", () => {
    test("GET /api/subscriptions doit renvoyer un tableau (status 200)", async () => {
        const response = await request(app).get("/api/subscriptions");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test("POST /api/subscriptions avec des données valides doit renvoyer 201 + l'abonnement créé", async () => {
        const payload = {
            name: "Netflix",
            price: 12.99,
            currency: "EUR",
            frequency: "monthly",
            nextBillingDate: "2025-03-01",
            description: "Abonnement de test",
        };

        const response = await request(app)
            .post("/api/subscriptions")
            .send(payload)
            .set("Content-Type", "application/json");

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("id");
        expect(response.body.name).toBe(payload.name);
        expect(response.body.price).toBe(payload.price);
        expect(response.body.currency).toBe(payload.currency);
        expect(response.body.frequency).toBe(payload.frequency);
        expect(response.body.nextBillingDate).toBe(payload.nextBillingDate);
    });

    test("POST /api/subscriptions sans name doit renvoyer 400", async () => {
        const payload = {
            // name manquant
            price: 9.99,
            currency: "EUR",
            frequency: "monthly",
            nextBillingDate: "2025-03-01",
            description: "Abonnement invalide",
        };

        const response = await request(app)
            .post("/api/subscriptions")
            .send(payload)
            .set("Content-Type", "application/json");

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error");
    });
});
