const request = require("supertest");
const { app, resetDatabase, createTestUserAndGetToken } = require("./testHelpers");

let token;

beforeEach(async () => {
    resetDatabase();
    const created = await createTestUserAndGetToken("home@test.com", "password");
    token = created.token;
});

describe("API /api/home", () => {
    test("GET /api/home?view=month&month=YYYY-MM calcule totals + recentExpenses", async () => {
        // Revenus
        await request(app)
            .post("/api/revenues")
            .send({ amount: 2000, currency: "EUR", date: "2025-03-01", type: "one-off", description: "Salaire" })
            .set("Authorization", `Bearer ${token}`);

        // Dépenses
        await request(app)
            .post("/api/expenses")
            .send({ amount: 50, currency: "EUR", date: "2025-03-05", category: "Courses", description: "Carrefour" })
            .set("Authorization", `Bearer ${token}`);

        await request(app)
            .post("/api/expenses")
            .send({ amount: 20, currency: "EUR", date: "2025-03-10", category: "Transport", description: "Métro" })
            .set("Authorization", `Bearer ${token}`);

        const res = await request(app)
            .get("/api/home?view=month&month=2025-03")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.range.from).toBe("2025-03-01");
        expect(res.body.range.to.startsWith("2025-03-")).toBe(true);

        expect(res.body.totals.revenues).toBe(2000);
        expect(res.body.totals.expenses).toBe(70);
        expect(res.body.totals.balance).toBe(1930);

        expect(Array.isArray(res.body.recentExpenses)).toBe(true);
        expect(res.body.recentExpenses.length).toBeGreaterThan(0);
    });

    test("GET /api/home?view=quarter&year=YYYY&quarter=Q renvoie le bon range", async () => {
        const res = await request(app)
            .get("/api/home?view=quarter&year=2025&quarter=2")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.range.from).toBe("2025-04-01");
        expect(res.body.range.to).toBe("2025-06-30");
    });

    test("GET /api/home?view=year&year=YYYY renvoie le bon range", async () => {
        const res = await request(app)
            .get("/api/home?view=year&year=2025")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.range.from).toBe("2025-01-01");
        expect(res.body.range.to).toBe("2025-12-31");
    });

    test("GET /api/home calcule budgets (global + par catégorie) sur un mois", async () => {
        // Dépenses du mois
        await request(app)
            .post("/api/expenses")
            .send({ amount: 80, currency: "EUR", date: "2025-03-05", category: "Courses", description: "Carrefour" })
            .set("Authorization", `Bearer ${token}`);

        await request(app)
            .post("/api/expenses")
            .send({ amount: 40, currency: "EUR", date: "2025-03-10", category: "Transport", description: "Métro" })
            .set("Authorization", `Bearer ${token}`);

        // Règle globale: 200/mois
        const globalRule = await request(app)
            .post("/api/budget-rules")
            .send({ monthlyLimit: 200, isActive: true })
            .set("Authorization", `Bearer ${token}`);

        expect(globalRule.status).toBe(201);

        // Règle par catégorie Courses: 100/mois
        const catRule = await request(app)
            .post("/api/budget-rules")
            .send({ category: "Courses", monthlyLimit: 100, isActive: true })
            .set("Authorization", `Bearer ${token}`);

        expect(catRule.status).toBe(201);

        const res = await request(app)
            .get("/api/home?view=month&month=2025-03")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.budgets)).toBe(true);

        const global = res.body.budgets.find(b => b.category === null);
        const courses = res.body.budgets.find(b => b.category === "Courses");

        expect(global).toBeDefined();
        expect(courses).toBeDefined();

        // Global: spent = 80 + 40 = 120
        expect(global.periodLimit).toBe(200);
        expect(global.spent).toBe(120);
        expect(global.remaining).toBe(80);
        expect(global.status).toBe("ok");

        // Courses: spent = 80
        expect(courses.periodLimit).toBe(100);
        expect(courses.spent).toBe(80);
        expect(courses.remaining).toBe(20);
        expect(courses.status).toBe("ok");
        });

    test("GET /api/home marque exceeded si dépassement budget", async () => {
        await request(app)
            .post("/api/expenses")
            .send({ amount: 120, currency: "EUR", date: "2025-03-05", category: "Courses", description: "Carrefour" })
            .set("Authorization", `Bearer ${token}`);

        await request(app)
            .post("/api/budget-rules")
            .send({ category: "Courses", monthlyLimit: 100, isActive: true })
            .set("Authorization", `Bearer ${token}`);

        const res = await request(app)
            .get("/api/home?view=month&month=2025-03")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);

        const courses = res.body.budgets.find(b => b.category === "Courses");
        expect(courses).toBeDefined();

        expect(courses.spent).toBe(120);
        expect(courses.periodLimit).toBe(100);
        expect(courses.remaining).toBe(-20);
        expect(courses.status).toBe("exceeded");
    });
});
