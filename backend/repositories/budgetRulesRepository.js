const db = require("../db");

function getAllBudgetRules(userId) {
    const stmt = db.prepare(`
        SELECT
            id,
            category,
            monthly_limit AS monthlyLimit,
            is_active AS isActive
        FROM budget_rules
        WHERE user_id = ?
        ORDER BY category IS NOT NULL DESC, category ASC, id ASC
    `);
    return stmt.all(userId).map(r => ({
        ...r,
        isActive: Boolean(r.isActive),
    }));
}

function createBudgetRule(userId, { category, monthlyLimit, isActive }) {
    const insert = db.prepare(`
        INSERT INTO budget_rules (user_id, category, monthly_limit, is_active)
        VALUES (?, ?, ?, ?)
    `);

    const info = insert.run(
        userId,
        category ?? null,
        monthlyLimit,
        isActive === false ? 0 : 1
    );

    const select = db.prepare(`
        SELECT
            id,
            category,
            monthly_limit AS monthlyLimit,
            is_active AS isActive
        FROM budget_rules
        WHERE id = ? AND user_id = ?
    `);

    const row = select.get(info.lastInsertRowid, userId);
    return { ...row, isActive: Boolean(row.isActive) };
}

function updateBudgetRule(userId, id, { category, monthlyLimit, isActive }) {
    const update = db.prepare(`
        UPDATE budget_rules
        SET category = ?, monthly_limit = ?, is_active = ?
        WHERE id = ? AND user_id = ?
    `);

    const result = update.run(
        category ?? null,
        monthlyLimit,
        isActive === false ? 0 : 1,
        id,
        userId
    );

    if (result.changes === 0) return null;

    const select = db.prepare(`
        SELECT
            id,
            category,
            monthly_limit AS monthlyLimit,
            is_active AS isActive
        FROM budget_rules
        WHERE id = ? AND user_id = ?
    `);

    const row = select.get(id, userId);
    return { ...row, isActive: Boolean(row.isActive) };
}

function deleteBudgetRule(userId, id) {
    const del = db.prepare(`
        DELETE FROM budget_rules
        WHERE id = ? AND user_id = ?
    `);
    const result = del.run(id, userId);
    return result.changes > 0;
}

module.exports = {
    getAllBudgetRules,
    createBudgetRule,
    updateBudgetRule,
    deleteBudgetRule,
};
