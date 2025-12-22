const request = require("supertest");
const { app, resetDatabase, createTestUserAndGetToken, addDaysUTC, toISODateUTC, monthYYYYMMFromISO } = require("./testHelpers");

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

    test("GET /api/revenues ne doit pas dupliquer les occurrences générées depuis un revenu récurrent (idempotence)", async () => {
        const todayISO = toISODateUTC(new Date());

        const threeMonthsAgo = new Date(Date.UTC(
            new Date().getUTCFullYear(),
            new Date().getUTCMonth() - 3,
            1
        ));
        const startISO = toISODateUTC(threeMonthsAgo);
        const monthToQuery = monthYYYYMMFromISO(startISO);

        // 1) Créer un template récurrent
        const createRes = await request(app)
            .post("/api/revenues")
            .send({
            amount: 1000,
            currency: "EUR",
            date: startISO,
            type: "recurring",
            description: "Salaire récurrent",
            })
            .set("Authorization", `Bearer ${token}`);

        expect(createRes.status).toBe(201);
        const templateId = createRes.body.id;

        // 2) Premier GET (déclenche la génération)
        const first = await request(app)
            .get(`/api/revenues?month=${monthToQuery}`)
            .set("Authorization", `Bearer ${token}`);

        expect(first.status).toBe(200);

        // 3) Second GET (ne doit pas dupliquer)
        const second = await request(app)
            .get(`/api/revenues?month=${monthToQuery}`)
            .set("Authorization", `Bearer ${token}`);

        expect(second.status).toBe(200);

        // 4) Vérifier que le nombre d'occurrences liées au template ne change pas
        const firstOcc = first.body.filter(r => r.type === "one-off" && r.recurringTemplateId === templateId);
        const secondOcc = second.body.filter(r => r.type === "one-off" && r.recurringTemplateId === templateId);

        expect(secondOcc.length).toBe(firstOcc.length);

        // 5) Vérifier qu'il n'y a pas 2 occurrences le même jour pour le même template
        const dates = secondOcc.map(r => r.date);
        expect(new Set(dates).size).toBe(dates.length);

        // Aucune occurrence future au-delà d'aujourd'hui dans le mois demandé
        for (const r of secondOcc) {
            expect(r.date <= todayISO).toBe(true);
        }
    });

    test("GET /api/revenues?month=futur ne doit pas générer d'occurrences futures pour un revenu récurrent", async () => {
        const todayISO = toISODateUTC(new Date());
        const tomorrowISO = addDaysUTC(todayISO, 1);

        // Template récurrent qui commence demain : aucune occurrence ne doit être créée aujourd'hui
        const createRes = await request(app)
            .post("/api/revenues")
            .send({
                amount: 500,
                currency: "EUR",
                date: tomorrowISO,
                type: "recurring",
                description: "Revenu récurrent futur",
            })
            .set("Authorization", `Bearer ${token}`);

        expect(createRes.status).toBe(201);

        // On demande un mois très futur -> déclenche la génération côté backend
        // mais le générateur doit s'arrêter à aujourd'hui, donc 0 occurrence créée
        const futureMonth = await request(app)
            .get("/api/revenues?month=2100-01")
            .set("Authorization", `Bearer ${token}`);

        expect(futureMonth.status).toBe(200);

        // Récupérer tout et vérifier qu'aucune occurrence liée à un template n'existe
        const all = await request(app)
            .get("/api/revenues")
            .set("Authorization", `Bearer ${token}`);

        expect(all.status).toBe(200);

        const generatedOccurrences = all.body.filter(r => r.type === "one-off" && r.recurringTemplateId !== null);
        expect(generatedOccurrences.length).toBe(0);
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
