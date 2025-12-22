const db = require("../db");

function parseISODate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}

function formatISODate(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addMonths(date, months) {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth();
    const d = date.getUTCDate();

    const target = new Date(Date.UTC(y, m + months, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(d, lastDay));
    return target;
}

function todayISO() {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Génère (idempotent) les occurrences mensuelles des revenus récurrents jusqu'à limitDateISO.
 * - Le template est une ligne revenues.type='recurring' avec recurring_template_id NULL
 * - Les occurrences sont revenues.type='one-off' avec recurring_template_id = template.id
 * - Pas de génération future (limite réelle = min(limit, today))
 */
function generateRecurringRevenuesUpTo(userId, limitDateISO) {
    const limit = parseISODate(limitDateISO);
    const today = parseISODate(todayISO());
    const realLimit = limit < today ? limit : today;

    const selectTemplates = db.prepare(`
        SELECT
            id,
            amount,
            currency,
            date,
            description
        FROM revenues
        WHERE user_id = ? AND type = 'recurring' AND recurring_template_id IS NULL
        ORDER BY date ASC, id ASC
    `);

    const existsOccurrence = db.prepare(`
        SELECT 1
        FROM revenues
        WHERE user_id = ?
        AND type = 'one-off'
        AND recurring_template_id = ?
        AND date = ?
        LIMIT 1
    `);

    const insertOccurrence = db.prepare(`
        INSERT INTO revenues (user_id, amount, currency, date, type, recurring_template_id, description)
        VALUES (?, ?, ?, ?, 'one-off', ?, ?)
    `);

    const templates = selectTemplates.all(userId);

    for (const t of templates) {
        // date du template = première occurrence
        let due = parseISODate(t.date);

        // on génère de t.date jusqu'à realLimit, chaque mois
        while (due <= realLimit) {
        const dueISO = formatISODate(due);

        const exists = existsOccurrence.get(userId, t.id, dueISO);
        if (!exists) {
            insertOccurrence.run(
                userId,
                t.amount,
                t.currency || "EUR",
                dueISO,
                t.id,
                t.description || ""
            );
        }

        due = addMonths(due, 1);
        }
    }
}

module.exports = {
    generateRecurringRevenuesUpTo,
    todayISO,
};
