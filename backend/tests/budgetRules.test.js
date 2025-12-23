const request = require("supertest");
const { app, resetDatabase, createTestUserAndGetToken } = require("./testHelpers");

let token;
beforeEach(async () => {
    resetDatabase();
    const created = await createTestUserAndGetToken("budget@test.com", "password");
    token = created.token;
});

describe("API /api/budget-rules", () => {
    test("POST /api/budget-rules crée une règle globale", async () => {
        const res = await request(app)
            .post("/api/budget-rules")
            .send({ monthlyLimit: 500, isActive: true }) // category absent => global
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.category).toBe(null);
        expect(res.body.monthlyLimit).toBe(500);
        expect(res.body.isActive).toBe(true);
    });

    test("POST /api/budget-rules crée une règle par catégorie", async () => {
        const res = await request(app)
            .post("/api/budget-rules")
            .send({ category: "Courses", monthlyLimit: 200, isActive: true })
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(201);
        expect(res.body.category).toBe("Courses");
        expect(res.body.monthlyLimit).toBe(200);
        expect(res.body.isActive).toBe(true);
    });

    test("GET /api/budget-rules renvoie les règles actives et inactives", async () => {
        await request(app)
            .post("/api/budget-rules")
            .send({ monthlyLimit: 500, isActive: true })
            .set("Authorization", `Bearer ${token}`);

        await request(app)
            .post("/api/budget-rules")
            .send({ category: "Courses", monthlyLimit: 200, isActive: false })
            .set("Authorization", `Bearer ${token}`);

        const res = await request(app)
            .get("/api/budget-rules")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);

        const globalRule = res.body.find(r => r.category === null);
        const catRule = res.body.find(r => r.category === "Courses");

        expect(globalRule).toBeDefined();
        expect(catRule).toBeDefined();
        expect(globalRule.isActive).toBe(true);
        expect(catRule.isActive).toBe(false);
    });

    test("PUT /api/budget-rules/:id met à jour une règle", async () => {
        const created = await request(app)
            .post("/api/budget-rules")
            .send({ category: "Courses", monthlyLimit: 200, isActive: true })
            .set("Authorization", `Bearer ${token}`);

        expect(created.status).toBe(201);
        const id = created.body.id;

        const updated = await request(app)
            .put(`/api/budget-rules/${id}`)
            .send({ category: "Courses", monthlyLimit: 250, isActive: false })
            .set("Authorization", `Bearer ${token}`);

        expect(updated.status).toBe(200);
        expect(updated.body.id).toBe(id);
        expect(updated.body.monthlyLimit).toBe(250);
        expect(updated.body.isActive).toBe(false);
    });

    test("DELETE /api/budget-rules/:id supprime une règle", async () => {
        const created = await request(app)
            .post("/api/budget-rules")
            .send({ monthlyLimit: 500, isActive: true })
            .set("Authorization", `Bearer ${token}`);

        const id = created.body.id;

        const del = await request(app)
            .delete(`/api/budget-rules/${id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(del.status).toBe(204);

        const list = await request(app)
            .get("/api/budget-rules")
            .set("Authorization", `Bearer ${token}`);

        expect(list.status).toBe(200);
        expect(list.body.find(r => r.id === id)).toBeUndefined();
    });

    test("POST /api/budget-rules refuse un monthlyLimit négatif", async () => {
        const res = await request(app)
            .post("/api/budget-rules")
            .send({ monthlyLimit: -10, isActive: true })
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(400);
    });

    test("Routes protégées: sans token => 401", async () => {
        const res = await request(app)
            .get("/api/budget-rules");

        expect(res.status).toBe(401);
    });
});
