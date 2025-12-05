const db = require("../db");

function findUserByEmail(email) {
    const statement = db.prepare(`
        SELECT id, email, password_hash AS passwordHash
        FROM users
        WHERE email = ?
    `);
    return statement.get(email);
    }

    function createUser(email, passwordHash) {
    const insert = db.prepare(`
        INSERT INTO users (email, password_hash)
        VALUES (?, ?)
    `);
    const result = insert.run(email, passwordHash);

    const select = db.prepare(`
        SELECT id, email, password_hash AS passwordHash
        FROM users
        WHERE id = ?
    `);

    return select.get(result.lastInsertRowid);
    }

    module.exports = {
    findUserByEmail,
    createUser,
};
