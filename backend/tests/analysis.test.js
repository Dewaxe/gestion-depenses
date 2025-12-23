const request = require("supertest");
const { app, resetDatabase, createTestUserAndGetToken } = require("./testHelpers");

let token;

beforeEach(async () => {
    resetDatabase();
    const created = await createTestUserAndGetToken("analysis@test.com", "password");
    token = created.token;
});

describe("API /api/analysis", () => {
    test("GET /api/analysis retourne trend par catégorie sur 3 mois", async () => {
        // Dépenses sur Jan/Feb/Mar
        await request(app).post("/api/expenses").send({ amount: 100, date: "2025-01-10", category: "Courses" }).set("Authorization", `Bearer ${token}`);
        await request(app).post("/api/expenses").send({ amount: 50, date: "2025-02-10", category: "Courses" }).set("Authorization", `Bearer ${token}`);
        await request(app).post("/api/expenses").send({ amount: 70, date: "2025-03-10", category: "Transport" }).set("Authorization", `Bearer ${token}`);

        const res = await request(app)
            .get("/api/analysis?months=3&endMonth=2025-03")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.period.labels).toEqual(["2025-01", "2025-02", "2025-03"]);
        expect(Array.isArray(res.body.expensesTrend.series)).toBe(true);

        const courses = res.body.expensesTrend.series.find(s => s.category === "Courses");
        expect(courses).toBeDefined();
        expect(courses.totals.length).toBe(3);
    });

    test("GET /api/analysis calcule peak/min/avg correctement", async () => {
        // Jan total=100, Feb total=200, Mar total=50
        await request(app).post("/api/expenses").send({ amount: 100, date: "2025-01-05", category: "X" }).set("Authorization", `Bearer ${token}`);
        await request(app).post("/api/expenses").send({ amount: 200, date: "2025-02-05", category: "X" }).set("Authorization", `Bearer ${token}`);
        await request(app).post("/api/expenses").send({ amount: 50, date: "2025-03-05", category: "X" }).set("Authorization", `Bearer ${token}`);

        const res = await request(app)
            .get("/api/analysis?months=3&endMonth=2025-03")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.kpis.peak.month).toBe("2025-02");
        expect(res.body.kpis.peak.total).toBe(200);
        expect(res.body.kpis.min.month).toBe("2025-03");
        expect(res.body.kpis.min.total).toBe(50);

        expect(res.body.kpis.avgMonthly.months).toBe(3);
        expect(res.body.kpis.avgMonthly.value).toBeCloseTo((100 + 200 + 50) / 3);
    });

    test("GET /api/analysis budgetHistory renvoie ok/exceeded selon monthlyLimit", async () => {
        // Budget Courses: 100/mois
        await request(app)
            .post("/api/budget-rules")
            .send({ category: "Courses", monthlyLimit: 100, isActive: true })
            .set("Authorization", `Bearer ${token}`);

        // Jan Courses = 80 (ok), Feb Courses = 120 (exceeded), Mar Courses = 0 (ok)
        await request(app).post("/api/expenses").send({ amount: 80, date: "2025-01-10", category: "Courses" }).set("Authorization", `Bearer ${token}`);
        await request(app).post("/api/expenses").send({ amount: 120, date: "2025-02-10", category: "Courses" }).set("Authorization", `Bearer ${token}`);

        const res = await request(app)
            .get("/api/analysis?months=3&endMonth=2025-03")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);

        const rule = res.body.budgetHistory.find(b => b.category === "Courses");
        expect(rule).toBeDefined();

        const jan = rule.months.find(m => m.month === "2025-01");
        const feb = rule.months.find(m => m.month === "2025-02");
        const mar = rule.months.find(m => m.month === "2025-03");

        expect(jan.status).toBe("ok");
        expect(feb.status).toBe("exceeded");
        expect(mar.status).toBe("ok");

        expect(rule.summary.okCount).toBe(2);
        expect(rule.summary.exceededCount).toBe(1);
    });
});
