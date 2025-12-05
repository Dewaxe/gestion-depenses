const request = require("supertest");
const { app, resetDatabase } = require("./testHelpers");

beforeEach(() => {
    resetDatabase();
});

describe("Auth routes", () => {
    test("POST /api/auth/register crée un utilisateur et renvoie un token", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                email: "user1@example.com",
                password: "azerty1",
        });

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("token");
        expect(response.body).toHaveProperty("user");
        expect(response.body.user).toMatchObject({
            email: "user1@example.com",
        });
    });

    test("POST /api/auth/register renvoie 409 si l'email existe déjà", async () => {
        await request(app)
            .post("/api/auth/register")
            .send({
                email: "user2@example.com",
                password: "azerty1",
            });

        const response = await request(app)
            .post("/api/auth/register")
            .send({
                email: "user2@example.com",
                password: "azerty1",
            });

        expect(response.statusCode).toBe(409);
        expect(response.body).toHaveProperty("error");
    });

    test("POST /api/auth/login renvoie un token pour des identifiants valides", async () => {
        const email = "loginuser@example.com";
        const password = "azerty1";

        await request(app)
            .post("/api/auth/register")
            .send({ email, password });

        const response = await request(app)
            .post("/api/auth/login")
            .send({ email, password });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("token");
        expect(response.body.user).toMatchObject({ email });
    });

    test("POST /api/auth/login renvoie 401 pour un mauvais mot de passe", async () => {
        const email = "wrongpass@example.com";
        const password = "azerty1";

        await request(app)
            .post("/api/auth/register")
            .send({ email, password });

        const response = await request(app)
            .post("/api/auth/login")
            .send({ email, password: "mauvais" });

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    test("POST /api/auth/login renvoie 401 pour un email inconnu", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({ email: "nobody@example.com", password: "azerty1" });

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });
});
