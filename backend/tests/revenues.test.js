const request = require("supertest");
const { app, resetDatabase, createTestUserAndGetToken } = require("./testHelpers");

beforeEach(async () => {
    resetDatabase();
    const result = await createTestUserAndGetToken();
    token = result.token;
    user = result.user;
})

describe("API /api/revenues", () => {
    test("POST /api/revenues crée un revenu", async () => {
        const res = await request(app)
            .post("/api/revenues")
            .send({ amount: 1000, currency: "EUR", date: "2025-03-01", type: "one-off", description: "Salaire" })
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(201);
        expect(res.body.amount).toBe(1000);
        expect(res.body.date).toBe("2025-03-01");
    });

    test("GET /api/revenues?month=YYYY-MM filtre par mois", async () => {
        await request(app)
            .post("/api/revenues")
            .send({ amount: 1000, date: "2025-03-01", type: "one-off" })
            .set("Authorization", `Bearer ${token}`);

        await request(app)
            .post("/api/revenues")
            .send({ amount: 2000, date: "2025-04-01", type: "one-off" })
            .set("Authorization", `Bearer ${token}`);

        const march = await request(app)
            .get("/api/revenues?month=2025-03")
            .set("Authorization", `Bearer ${token}`);

        expect(march.status).toBe(200);
        expect(march.body.length).toBe(1);
        expect(march.body[0].date.startsWith("2025-03")).toBe(true);
    });

    test("PUT /api/revenues/:id met à jour un revenu", async () => {
        const created = await request(app)
            .post("/api/revenues")
            .send({ amount: 1000, date: "2025-03-01", type: "one-off", description: "Avant" })
            .set("Authorization", `Bearer ${token}`);

        expect(created.status).toBe(201);

        const id = created.body.id;

        const updated = await request(app)
            .put(`/api/revenues/${id}`)
            .send({ amount: 1200, date: "2025-03-01", type: "one-off", description: "Après" })
            .set("Authorization", `Bearer ${token}`);

        expect(updated.status).toBe(200);
        expect(updated.body.amount).toBe(1200);
        expect(updated.body.description).toBe("Après");
    });

    test("DELETE /api/revenues/:id supprime un revenu", async () => {
        const created = await request(app)
            .post("/api/revenues")
            .send({ amount: 1000, date: "2025-03-01", type: "one-off" })
            .set("Authorization", `Bearer ${token}`);

        const id = created.body.id;

        const del = await request(app)
            .delete(`/api/revenues/${id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(del.status).toBe(204);
    });
});
