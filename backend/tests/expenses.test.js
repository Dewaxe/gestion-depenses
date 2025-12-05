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

describe("API /api/expenses", () => {
    test("GET /api/expenses doit renvoyer un tableau (status 200)", async () => {
        const response = await request(app)
            .get("/api/expenses")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test("POST /api/expenses avec des données valides doit renvoyer 201 + la dépense créée", async () => {
        const payload = {
            amount: 42.5,
            currency: "EUR",
            date: "2025-02-01",
            category: "Test",
            paymentMethod: "Carte",
            description: "Dépense de test",
        };

        const response = await request(app)
            .post("/api/expenses")
            .send(payload)
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("id");
        expect(response.body.amount).toBe(payload.amount);
        expect(response.body.currency).toBe(payload.currency);
        expect(response.body.category).toBe(payload.category);
    });

    test("POST /api/expenses sans amount doit renvoyer 400", async () => {
        const payload = {
            // amount manquant
            currency: "EUR",
            date: "2025-02-01",
            category: "Test",
            paymentMethod: "Carte",
            description: "Dépense invalide",
        };

        const response = await request(app)
            .post("/api/expenses")
            .send(payload)
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error");
    });

    test("PUT /api/expenses/:id doit mettre à jour une dépense existante", async () => {
        const createPayload = {
            amount: 10,
            currency: "EUR",
            date: "2025-02-20",
            category: "Test PUT",
            paymentMethod: "Carte",
            description: "Avant mise à jour",
        };

        const createResponse = await request(app)
            .post("/api/expenses")
            .send(createPayload)
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${token}`);

        expect(createResponse.status).toBe(201);
        const createdId = createResponse.body.id;

        const updatePayload = {
            amount: 99.99,
            currency: "EUR",
            date: "2025-02-21",
            category: "Test PUT modifié",
            paymentMethod: "Espèces",
            description: "Après mise à jour",
        };

        const updateResponse = await request(app)
            .put(`/api/expenses/${createdId}`)
            .send(updatePayload)
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${token}`);

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.id).toBe(createdId);
        expect(updateResponse.body.amount).toBe(updatePayload.amount);
        expect(updateResponse.body.category).toBe(updatePayload.category);
        expect(updateResponse.body.paymentMethod).toBe(updatePayload.paymentMethod);
    });

    test("DELETE /api/expenses/:id doit supprimer une dépense existante", async () => {
        const createPayload = {
            amount: 5,
            currency: "EUR",
            date: "2025-02-22",
            category: "Test DELETE",
            paymentMethod: "Carte",
            description: "À supprimer",
        };

        const createResponse = await request(app)
            .post("/api/expenses")
            .send(createPayload)
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${token}`);

        expect(createResponse.status).toBe(201);
        const createdId = createResponse.body.id;

        const deleteResponse = await request(app)
            .delete(`/api/expenses/${createdId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(deleteResponse.status).toBe(204);

        const deleteAgainResponse = await request(app)
            .delete(`/api/expenses/${createdId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(deleteAgainResponse.status).toBe(404);
    });

    test("GET /api/expenses renvoie 401 sans token", async () => {
        const response = await request(app).get("/api/expenses");
        expect(response.statusCode).toBe(401);
    });
});
