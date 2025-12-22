const request = require("supertest");
// const app = require("../app");
const { app, resetDatabase, createTestUserAndGetToken } = require("./testHelpers");

let token;
let user;

beforeEach(async () => {
    resetDatabase();
    const result = await createTestUserAndGetToken();
    token = result.token;
    user = result.user;
})

describe("API /api/subscriptions", () => {
    test("GET /api/subscriptions doit renvoyer un tableau (status 200)", async () => {
        const response = await request(app)
            .get("/api/subscriptions")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test("POST /api/subscriptions avec des données valides doit renvoyer 201 + l'abonnement créé", async () => {
        const payload = {
            name: "Netflix",
            amount: 12.99,
            currency: "EUR",
            billingPeriod: "monthly",
            nextBillingDate: "2025-03-01",
            description: "Abonnement de test",
        };

        const response = await request(app)
            .post("/api/subscriptions")
            .send(payload)
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("id");
        expect(response.body.name).toBe(payload.name);
        expect(response.body.amount).toBe(payload.amount);
        expect(response.body.currency).toBe(payload.currency);
        expect(response.body.billingPeriod).toBe(payload.billingPeriod);
        expect(response.body.nextBillingDate).toBe(payload.nextBillingDate);
    });

    test("POST /api/subscriptions sans name doit renvoyer 400", async () => {
        const payload = {
            // name manquant
            amount: 9.99,
            currency: "EUR",
            billingPeriod: "monthly",
            nextBillingDate: "2025-03-01",
            description: "Abonnement invalide",
        };

        const response = await request(app)
            .post("/api/subscriptions")
            .send(payload)
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error");
    });

    test("PUT /api/subscriptions/:id doit mettre à jour un abonnement existant", async () => {
        const createPayload = {
            name: "Test PUT sub",
            amount: 9.99,
            currency: "EUR",
            billingPeriod: "monthly",
            nextBillingDate: "2025-03-10",
            description: "Avant mise à jour",
        };

        const createResponse = await request(app)
            .post("/api/subscriptions")
            .send(createPayload)
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${token}`);

        expect(createResponse.status).toBe(201);
        const createdId = createResponse.body.id;

        const updatePayload = {
            name: "Test PUT sub modifié",
            amount: 19.99,
            currency: "EUR",
            billingPeriod: "yearly",
            nextBillingDate: "2025-04-01",
            description: "Après mise à jour",
        };

        const updateResponse = await request(app)
            .put(`/api/subscriptions/${createdId}`)
            .send(updatePayload)
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${token}`);

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.id).toBe(createdId);
        expect(updateResponse.body.name).toBe(updatePayload.name);
        expect(updateResponse.body.amount).toBe(updatePayload.amount);
        expect(updateResponse.body.billingPeriod).toBe(updatePayload.billingPeriod);
        expect(updateResponse.body.nextBillingDate).toBe(updatePayload.nextBillingDate);
    });

    test("DELETE /api/subscriptions/:id doit supprimer un abonnement existant", async () => {
        const createPayload = {
            name: "Test DELETE sub",
            amount: 4.99,
            currency: "EUR",
            billingPeriod: "monthly",
            nextBillingDate: "2025-03-15",
            description: "À supprimer",
        };

        const createResponse = await request(app)
            .post("/api/subscriptions")
            .send(createPayload)
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${token}`);

        expect(createResponse.status).toBe(201);
        const createdId = createResponse.body.id;

        const deleteResponse = await request(app)
            .delete(`/api/subscriptions/${createdId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(deleteResponse.status).toBe(204);

        const deleteAgainResponse = await request(app)
            .delete(`/api/subscriptions/${createdId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(deleteAgainResponse.status).toBe(404);
    });

    test("GET /api/subscriptions renvoie 401 sans token", async () => {
        const response = await request(app).get("/api/subscriptions");
        expect(response.statusCode).toBe(401);
    });
});
