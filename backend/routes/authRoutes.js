const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { findUserByEmail, createUser } = require("../repositories/usersRepository");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = "7d";

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password || password.length < 6) {
            return res.status(400).json({
                error: "email et un mot de passe (>= 6 caractères) sont requis",
            });
        }

        const existing = findUserByEmail(email);
        if (existing) {
            return res.status(409).json({ error: "Un utilisateur avec cet email existe déjà." });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = createUser(email, passwordHash);

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });

        res.status(201).json({
            token,
            user: { id: user.id, email: user.email },
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "email et mot de passe sont requis" });
        }

        const user = findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: "Identifiants invalides" });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: "Identifiants invalides" });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });

        res.json({
            token,
            user: { id: user.id, email: user.email },
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
