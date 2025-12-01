const request = require("supertest");
const app = require("../app");

describe("API /api/expenses", () => {
    test("GET /api/expenses doit renvoyer un tableau (status 200)", async () => {
        const response = await request(app).get("/api/expenses");

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
            .set("Content-Type", "application/json");

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
            .set("Content-Type", "application/json");

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error");
    });
});
