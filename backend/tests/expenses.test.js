const request = require("supertest");
// const app = require("../app");
const { app, resetDatabase, createTestUserAndGetToken, addDaysUTC, toISODateUTC, monthYYYYMMFromISO } = require("./testHelpers");

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

    test("GET /api/expenses?month=YYYY-MM renvoie seulement le mois demandé", async () => {
        await request(app)
            .post("/api/expenses")
            .send({ amount: 10, date: "2025-02-01", category: "A" })
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${token}`);

        await request(app)
            .post("/api/expenses")
            .send({ amount: 20, date: "2025-03-01", category: "B" })
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${token}`);

        const feb = await request(app)
            .get("/api/expenses?month=2025-02")
            .set("Authorization", `Bearer ${token}`);

        expect(feb.status).toBe(200);
        expect(feb.body.length).toBe(1);
        expect(feb.body[0].date.startsWith("2025-02")).toBe(true);
    });

    test("GET /api/expenses ne doit pas dupliquer les dépenses générées depuis un abonnement (idempotence)", async () => {
        // On crée un abonnement "dans le passé" pour forcer la génération
        const todayISO = toISODateUTC(new Date());
        const threeMonthsAgo = new Date(Date.UTC(
            new Date().getUTCFullYear(),
            new Date().getUTCMonth() - 3,
            new Date().getUTCDate()
        ));
        const startISO = toISODateUTC(threeMonthsAgo);
        const monthToQuery = monthYYYYMMFromISO(startISO);

        const createSubPayload = {
            name: "Sub Idempotence",
            amount: 10,
            currency: "EUR",
            billingPeriod: "monthly",
            nextBillingDate: startISO,
            description: "Doit générer sans doublons",
        };

        const subRes = await request(app)
            .post("/api/subscriptions")
            .send(createSubPayload)
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${token}`);

        expect(subRes.status).toBe(201);
        const subId = subRes.body.id;

        // 1er GET -> déclenche la génération (via GET /expenses) + renvoie le mois demandé
        const first = await request(app)
            .get(`/api/expenses?month=${monthToQuery}`)
            .set("Authorization", `Bearer ${token}`);

        expect(first.status).toBe(200);

        // 2e GET -> ne doit pas dupliquer
        const second = await request(app)
            .get(`/api/expenses?month=${monthToQuery}`)
            .set("Authorization", `Bearer ${token}`);

        expect(second.status).toBe(200);

        // On compare les dépenses du mois demandé issues de cet abonnement
        const firstFromSub = first.body.filter(e => e.source === "subscription" && e.subscriptionId === subId);
        const secondFromSub = second.body.filter(e => e.source === "subscription" && e.subscriptionId === subId);

        expect(secondFromSub.length).toBe(firstFromSub.length);

        // Et on garantit qu'il n'y a pas 2 dépenses le même jour pour ce même abonnement
        const dates = secondFromSub.map(e => e.date);
        expect(new Set(dates).size).toBe(dates.length);
    });

    test("GET /api/expenses?month=futur ne doit pas générer de dépenses futures", async () => {
        const todayISO = toISODateUTC(new Date());
        const tomorrowISO = addDaysUTC(todayISO, 1);

        // Abonnement avec prochaine échéance dans le futur (demain)
        const createSubPayload = {
            name: "Sub Future Guard",
            amount: 7,
            currency: "EUR",
            billingPeriod: "monthly",
            nextBillingDate: tomorrowISO,
            description: "Ne doit pas générer avant demain",
        };

        const subRes = await request(app)
            .post("/api/subscriptions")
            .send(createSubPayload)
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${token}`);

        expect(subRes.status).toBe(201);

        // Appel d'un mois très futur (ça déclenche la génération côté backend,
        // mais le générateur doit s'arrêter à aujourd'hui)
        const future = await request(app)
            .get("/api/expenses?month=2100-01")
            .set("Authorization", `Bearer ${token}`);

        expect(future.status).toBe(200);

        // On vérifie qu'aucune dépense n'a été créée (puisqu'échéance = demain)
        const all = await request(app)
            .get("/api/expenses")
            .set("Authorization", `Bearer ${token}`);

        expect(all.status).toBe(200);

        const subscriptionExpenses = all.body.filter(e => e.source === "subscription");
        expect(subscriptionExpenses.length).toBe(0);
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
