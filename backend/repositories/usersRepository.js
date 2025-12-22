const db = require("../db");

function findUserByEmail(email) {
    const statement = db.prepare(`
        SELECT id, name, email, password_hash AS passwordHash
        FROM users
        WHERE email = ?
    `);
    return statement.get(email);
    }

    function createUser(name, email, passwordHash) {
    const insert = db.prepare(`
        INSERT INTO users (name, email, password_hash)
        VALUES (?, ?, ?)
    `);
    const result = insert.run(name, email, passwordHash);

    const select = db.prepare(`
        SELECT id, name, email, password_hash AS passwordHash
        FROM users
        WHERE id = ?
    `);

    return select.get(result.lastInsertRowid);
    }

    module.exports = {
    findUserByEmail,
    createUser,
};
