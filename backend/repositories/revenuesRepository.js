const db = require("../db");

function getAllRevenues(userId) {
    const stmt = db.prepare(`
        SELECT
            id,
            amount,
            currency,
            date,
            CASE
                WHEN recurring_template_id IS NOT NULL THEN 'recurring'
                ELSE type
            END AS type,
            description,
            recurring_template_id AS recurringTemplateId
        FROM revenues
        WHERE user_id = ?
            AND NOT (type = 'recurring' AND recurring_template_id IS NULL)
        ORDER BY date DESC, id DESC
    `);
    return stmt.all(userId);
}

function getRevenuesByMonth(userId, monthYYYYMM) {
    const stmt = db.prepare(`
        SELECT
            id,
            amount,
            currency,
            date,
            CASE
                WHEN recurring_template_id IS NOT NULL THEN 'recurring'
                ELSE type
            END AS type,
            description,
            recurring_template_id AS recurringTemplateId
        FROM revenues
        WHERE user_id = ?
            AND date LIKE ?
            AND NOT (type = 'recurring' AND recurring_template_id IS NULL)
        ORDER BY date DESC, id DESC
    `);
    return stmt.all(userId, `${monthYYYYMM}-%`);
}

function createRevenue(userId, { amount, currency, date, type, description }) {
    const resolvedType = type || "one-off";

    const insert = db.prepare(`
        INSERT INTO revenues (user_id, amount, currency, date, type, description)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = insert.run(
        userId,
        amount,
        currency || "EUR",
        date,
        resolvedType,
        description || ""
    );

    return {
        id: info.lastInsertRowid,
        amount,
        currency: currency || "EUR",
        date,
        type: resolvedType,
        description: description || "",
    };
}

function updateRevenue(userId, id, { amount, currency, date, type, description }) {
    const resolvedType = type || "one-off";

    const update = db.prepare(`
        UPDATE revenues
        SET amount = ?, currency = ?, date = ?, type = ?, description = ?
        WHERE id = ? AND user_id = ?
    `);

    const result = update.run(
        amount,
        currency || "EUR",
        date,
        resolvedType,
        description || "",
        id,
        userId
    );

    if (result.changes === 0) return null;

    const select = db.prepare(`
        SELECT
            id,
            amount,
            currency,
            date,
            CASE
                WHEN recurring_template_id IS NOT NULL THEN 'recurring'
                ELSE type
            END AS type,
            description,
            recurring_template_id AS recurringTemplateId
        FROM revenues
        WHERE id = ? AND user_id = ?
    `);

    return select.get(id, userId);
}

function deleteRevenue(userId, id) {
    const del = db.prepare(`
        DELETE FROM revenues
        WHERE id = ? AND user_id = ?
    `);
    const result = del.run(id, userId);
    return result.changes > 0;
}

module.exports = {
    getAllRevenues,
    getRevenuesByMonth,
    createRevenue,
    updateRevenue,
    deleteRevenue,
};
