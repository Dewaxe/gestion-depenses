const express = require("express");
const db = require("../db");

const { generateSubscriptionExpensesUpTo } = require("../services/subscriptionExpenseGenerator");
const { generateRecurringRevenuesUpTo } = require("../services/recurringRevenueGenerator");

const router = express.Router();

function isValidMonthYYYYMM(month) {
    return typeof month === "string" && /^\d{4}-\d{2}$/.test(month);
}
function isValidYear(year) {
    return typeof year === "string" && /^\d{4}$/.test(year);
}
function isValidQuarter(q) {
    const n = Number(q);
    return Number.isInteger(n) && n >= 1 && n <= 4;
}

function todayISO() {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function startOfMonthISO(monthYYYYMM) {
    return `${monthYYYYMM}-01`;
}
function endOfMonthISO(monthYYYYMM) {
    const [y, m] = monthYYYYMM.split("-").map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0));
    const yyyy = lastDay.getUTCFullYear();
    const mm = String(lastDay.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(lastDay.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function resolveRange({ view, month, year, quarter }) {
    const now = new Date();
    const defaultMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    const v = view || "month";

    if (v === "month") {
        const m = month && isValidMonthYYYYMM(month) ? month : defaultMonth;
        return {
            view: "month",
            range: { from: startOfMonthISO(m), to: endOfMonthISO(m) },
            label: m,
        };
    }

    if (v === "quarter") {
        const y = year && isValidYear(year) ? Number(year) : now.getUTCFullYear();
        const q = isValidQuarter(quarter) ? Number(quarter) : (Math.floor(now.getUTCMonth() / 3) + 1);

        const startMonth = (q - 1) * 3 + 1; // 1,4,7,10
        const from = `${y}-${String(startMonth).padStart(2, "0")}-01`;
        const toMonth = startMonth + 2;
        const to = endOfMonthISO(`${y}-${String(toMonth).padStart(2, "0")}`);

        return {
            view: "quarter",
            range: { from, to },
            label: `${y}-Q${q}`,
            meta: { year: y, quarter: q },
        };
    }

    if (v === "year") {
        const y = year && isValidYear(year) ? Number(year) : now.getUTCFullYear();
        return {
            view: "year",
            range: { from: `${y}-01-01`, to: `${y}-12-31` },
            label: String(y),
            meta: { year: y },
        };
    }

    // fallback
    return {
        view: "month",
        range: { from: startOfMonthISO(defaultMonth), to: endOfMonthISO(defaultMonth) },
        label: defaultMonth,
    };
}

/**
 * GET /api/home?view=month&month=YYYY-MM
 * GET /api/home?view=quarter&year=YYYY&quarter=1..4
 * GET /api/home?view=year&year=YYYY
 */
router.get("/", (req, res, next) => {
    try {
        const userId = req.userId;

        const { view, month, year, quarter } = req.query;
        const { range, label, meta } = resolveRange({ view, month, year, quarter });

        // 1) Data freshness : on rattrape les abonnements & revenus récurrents jusqu'à la fin de la période)
        generateSubscriptionExpensesUpTo(userId, range.to);
        if (typeof generateRecurringRevenuesUpTo === "function") {
            generateRecurringRevenuesUpTo(userId, range.to);
        }

        // 2) Totaux (incluant les lignes matérialisées)
        const sumExpensesStmt = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE user_id = ? AND date BETWEEN ? AND ?
        `);
        const sumRevenuesStmt = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM revenues
            WHERE user_id = ? AND date BETWEEN ? AND ?
                AND NOT (type = 'recurring' AND recurring_template_id IS NULL)
        `);

        const totalExpenses = sumExpensesStmt.get(userId, range.from, range.to).total;
        const totalRevenues = sumRevenuesStmt.get(userId, range.from, range.to).total;

        // 3) Upcoming subscriptions dans la période
        const upcomingSubsStmt = db.prepare(`
        SELECT
            id,
            name,
            amount,
            promo_amount AS promoAmount,
            currency,
            billing_period AS billingPeriod,
            status,
            status_end_date AS statusEndDate,
            next_billing_date AS nextBillingDate,
            description
        FROM subscriptions
        WHERE user_id = ?
            AND status != 'cancelled'
            AND next_billing_date BETWEEN ? AND ?
        ORDER BY next_billing_date ASC
        LIMIT 10
        `);
        const upcomingSubscriptions = upcomingSubsStmt.all(userId, range.from, range.to);

        // 4) Dépenses récentes dans la période
        const recentExpensesStmt = db.prepare(`
        SELECT
            id,
            amount,
            currency,
            date,
            category,
            source,
            subscription_id AS subscriptionId,
            payment_method AS paymentMethod,
            description
        FROM expenses
        WHERE user_id = ?
            AND date BETWEEN ? AND ?
        ORDER BY date DESC, id DESC
        LIMIT 8
        `);
        const recentExpenses = recentExpensesStmt.all(userId, range.from, range.to);
        
        // 5) Règles budgétaires dans la période
        const rulesStmt = db.prepare(`
            SELECT
                id,
                category,
                monthly_limit AS monthlyLimit,
                is_active AS isActive
            FROM budget_rules
            WHERE user_id = ? AND is_active = 1
            ORDER BY category IS NOT NULL DESC, category ASC, id ASC
        `);

        const factor =
            (range.from.slice(0, 7) === range.to.slice(0, 7) && (req.query.view || "month") === "month") ? 1
            : (req.query.view === "quarter") ? 3
            : (req.query.view === "year") ? 12
            : 1;

        const sumByCategoryStmt = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE user_id = ?
                AND date BETWEEN ? AND ?
                AND category = ?
        `);

        const sumAllStmt = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE user_id = ?
                AND date BETWEEN ? AND ?
        `);

        const rules = rulesStmt.all(userId).map(r => ({
            id: r.id,
            category: r.category, // null => global
            monthlyLimit: r.monthlyLimit,
            periodLimit: r.monthlyLimit * factor,
        }));

        const budgets = rules.map(rule => {
            const spent = rule.category
                ? sumByCategoryStmt.get(userId, range.from, range.to, rule.category).total
                : sumAllStmt.get(userId, range.from, range.to).total;

            const remaining = rule.periodLimit - spent;

            return {
                id: rule.id,
                category: rule.category,
                periodLimit: rule.periodLimit,
                spent,
                remaining,
                status: remaining < 0 ? "exceeded" : "ok",
            };
        });

        return res.json({
            view: view || "month",
            label,          // ex: "2025-12" ou "2025-Q4" ou "2025"
            meta: meta || null,
            range,
            totals: {
                revenues: totalRevenues,
                expenses: totalExpenses,
                balance: totalRevenues - totalExpenses,
            },
            upcomingSubscriptions,
            recentExpenses,
            budgets,
            generatedAt: todayISO(),
        });
    } catch (e) {
        next(e);
    }
});

module.exports = router;
