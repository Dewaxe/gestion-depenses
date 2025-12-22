const db = require("../db");

//Date helpers en UTC pour éviter les décalages (timezone).
function parseISODate(iso) {
    // "YYYY-MM-DD"
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}

function formatISODate(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function addDays(date, days) {
    const copy = new Date(date.getTime());
    copy.setUTCDate(copy.getUTCDate() + days);
    return copy;
}

function addMonths(date, months) {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth();
    const d = date.getUTCDate();

    // On reconstruit en gérant les fins de mois (ex: 31 -> 30/28)
    const target = new Date(Date.UTC(y, m + months, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(d, lastDay));
    return target;
}

function nextDateFromPeriod(date, billingPeriod) {
    switch (billingPeriod) {
        case "weekly":
            return addDays(date, 7);
        case "monthly":
            return addMonths(date, 1);
        case "quarterly":
            return addMonths(date, 3);
        case "yearly":
            return addMonths(date, 12);
        default:
            throw new Error(`billing_period invalide: ${billingPeriod}`);
    }
}

function computeMonthlyEquivalent(amount, billingPeriod) {
    const a = Number(amount);
    if (Number.isNaN(a)) return 0;

    switch (billingPeriod) {
        case "weekly":
            return (a * 52) / 12;
        case "monthly":
            return a;
        case "quarterly":
            return a / 3;
        case "yearly":
            return a / 12;
        default:
            return a;
    }
}

function amountForDueDate(sub, dueISO) {
    if (
        sub.status === "promo" &&
        sub.statusEndDate &&
        sub.promoAmount !== null &&
        dueISO <= sub.statusEndDate
    ) {
        return sub.promoAmount;
    }
    return sub.amount;
}


/*
    Génère les dépenses d'abonnements manquantes (idempotent) jusqu'à limitDateISO (incluse).
 
    - ne duplique jamais : si une dépense existe déjà pour (user_id, subscription_id, date), on n'en crée pas.
    - met à jour next_billing_date après génération.
    - V1 simple : status=cancelled => rien n'est généré.
    - V1 simple : trial/promo avec status_end_date dépassée => on passe en active.
*/
function generateSubscriptionExpensesUpTo(userId, limitDateISO) {
    const limitDate = parseISODate(limitDateISO);

    const selectSubs = db.prepare(`
        SELECT
            id,
            name,
            amount,
            promo_amount AS promoAmount,
            currency,
            billing_period AS billingPeriod,
            monthly_equivalent AS monthlyEquivalent,
            status,
            status_end_date AS statusEndDate,
            next_billing_date AS nextBillingDate,
            description
        FROM subscriptions
        WHERE user_id = ?
        ORDER BY next_billing_date ASC, id ASC
    `);

    const existsExpense = db.prepare(`
        SELECT 1
        FROM expenses
        WHERE user_id = ? AND subscription_id = ? AND date = ?
        LIMIT 1
    `);

    const insertExpense = db.prepare(`
        INSERT INTO expenses (user_id, amount, currency, date, category, source, subscription_id, payment_method, description)
        VALUES (?, ?, ?, ?, ?, 'subscription', ?, 'Inconnu', ?)
    `);

    const updateSubNextDate = db.prepare(`
        UPDATE subscriptions
        SET next_billing_date = ?, status = ?, status_end_date = ?
        WHERE id = ? AND user_id = ?
    `);

    const subs = selectSubs.all(userId);

    const todayISO = formatISODate(new Date(Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate()
    )));
    
    const today = parseISODate(todayISO);

    for (const sub of subs) {
        if (sub.status === "cancelled") continue;

        let status = sub.status;
        let statusEndDate = sub.statusEndDate;
        if ((status === "trial" || status === "promo") && statusEndDate) {
            const end = parseISODate(statusEndDate);
            if (today > end) {
                status = "active";
                statusEndDate = null;
            }
        }

        const realLimit = limitDate < today ? limitDate : today;

        let due = parseISODate(sub.nextBillingDate);
        let changed = false;

        while (due <= realLimit) {
            const dueISO = formatISODate(due);

            const exists = existsExpense.get(userId, sub.id, dueISO);
            if (!exists) {
                const category = "Abonnements";
                const amountToCharge = amountForDueDate(sub, dueISO);

                insertExpense.run(
                    userId,
                    amountToCharge,
                    sub.currency || "EUR",
                    dueISO,
                    category,
                    sub.id,
                    sub.description || sub.name
                );
            }

            due = nextDateFromPeriod(due, sub.billingPeriod);
            changed = true;
        }

        if (changed || status !== sub.status || statusEndDate !== sub.statusEndDate) {
            updateSubNextDate.run(formatISODate(due), status, statusEndDate, sub.id, userId);
        }
    }
}

module.exports = {
    generateSubscriptionExpensesUpTo,
    computeMonthlyEquivalent,
};
