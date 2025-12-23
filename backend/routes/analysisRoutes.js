const express = require("express");
const db = require("../db");

const { generateSubscriptionExpensesUpTo } = require("../services/subscriptionExpenseGenerator");
const { generateRecurringRevenuesUpTo } = require("../services/recurringRevenueGenerator");

const router = express.Router();

function isValidMonthYYYYMM(m) {
    return typeof m === "string" && /^\d{4}-\d{2}$/.test(m);
}

function toISODateUTC(date) {
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function endOfMonthISO(monthYYYYMM) {
    const [y, m] = monthYYYYMM.split("-").map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0));
    return toISODateUTC(lastDay);
}

function startOfMonthISO(monthYYYYMM) {
    return `${monthYYYYMM}-01`;
}

function addMonthsUTC(monthYYYYMM, delta) {
    const [y, m] = monthYYYYMM.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, 1));
    dt.setUTCMonth(dt.getUTCMonth() + delta);
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
}

function currentMonthYYYYMM() {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function clampMonths(n) {
    const v = Number(n);
    if ([3, 6, 12].includes(v)) return v;
    return 6;
}

function pctChange(current, previous) {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
}

router.get("/", (req, res, next) => {
    try {
        const userId = req.userId;

        const months = clampMonths(req.query.months);
        const endMonth = isValidMonthYYYYMM(req.query.endMonth) ? req.query.endMonth : currentMonthYYYYMM();

        // Liste des mois sur la période (labels)
        const labels = [];
        for (let i = months - 1; i >= 0; i--) labels.push(addMonthsUTC(endMonth, -i));

        const from = startOfMonthISO(labels[0]);
        const to = endOfMonthISO(labels[labels.length - 1]);

        // 1) Data freshness (comme Home): générateurs
        generateSubscriptionExpensesUpTo(userId, to);
        generateRecurringRevenuesUpTo(userId, to);

        // 2) Trend dépenses par (mois, catégorie)
        const trendRows = db.prepare(`
            SELECT
                substr(date, 1, 7) AS month,
                category,
                COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE user_id = ?
                AND date BETWEEN ? AND ?
            GROUP BY substr(date, 1, 7), category
            ORDER BY month ASC, total DESC
        `).all(userId, from, to);

        // Construire series: {category -> totals[months]}
        const categoryMap = new Map();
        for (const row of trendRows) {
        if (!labels.includes(row.month)) continue;
        if (!categoryMap.has(row.category)) {
            categoryMap.set(row.category, Array(labels.length).fill(0));
        }
        const idx = labels.indexOf(row.month);
        categoryMap.get(row.category)[idx] = row.total;
        }

        // Option V1: n’afficher que les 6 catégories les plus lourdes sur la période + "Autres"
        const totalsByCat = [];
        for (const [cat, arr] of categoryMap.entries()) {
            const sum = arr.reduce((a, b) => a + b, 0);
            totalsByCat.push({ cat, sum });
        }
        totalsByCat.sort((a, b) => b.sum - a.sum);

        const topCats = totalsByCat.slice(0, 6).map(x => x.cat);
        const series = [];
        const others = Array(labels.length).fill(0);

        for (const [cat, arr] of categoryMap.entries()) {
            if (topCats.includes(cat)) {
                series.push({ category: cat, totals: arr });
            } else {
                for (let i = 0; i < arr.length; i++) others[i] += arr[i];
            }
        }
        if (totalsByCat.length > 6) series.push({ category: "Autres", totals: others });

        // 3) KPIs mensuels (totaux par mois)
        const monthTotalsRows = db.prepare(`
            SELECT
                substr(date, 1, 7) AS month,
                COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE user_id = ?
                AND date BETWEEN ? AND ?
            GROUP BY substr(date, 1, 7)
            ORDER BY month ASC
        `).all(userId, from, to);

        const monthTotals = new Map(labels.map(m => [m, 0]));
        for (const r of monthTotalsRows) monthTotals.set(r.month, r.total);

        const monthTotalsArr = labels.map(m => ({ month: m, total: monthTotals.get(m) || 0 }));
        const peak = monthTotalsArr.reduce((best, x) => (x.total > best.total ? x : best), monthTotalsArr[0]);
        const min = monthTotalsArr.reduce((best, x) => (x.total < best.total ? x : best), monthTotalsArr[0]);
        const sumAllMonths = monthTotalsArr.reduce((a, x) => a + x.total, 0);
        const avgMonthly = months === 0 ? 0 : sumAllMonths / months;

        // 4) Catégorie la plus chère sur la période
        const topCatRow = db.prepare(`
            SELECT category, COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE user_id = ?
                AND date BETWEEN ? AND ?
            GROUP BY category
            ORDER BY total DESC
            LIMIT 1
        `).get(userId, from, to);

        const topCategoryTotal = topCatRow ? topCatRow.total : 0;
        const topCategoryName = topCatRow ? topCatRow.category : null;
        const topCategoryShare = sumAllMonths === 0 ? 0 : (topCategoryTotal / sumAllMonths) * 100;

        // 5) Part abonnements + tendance (vs période précédente)
        const subSum = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE user_id = ?
                AND date BETWEEN ? AND ?
                AND source = 'subscription'
        `).get(userId, from, to).total;

        const subscriptionPercent = sumAllMonths === 0 ? 0 : (subSum / sumAllMonths) * 100;

        // période précédente (mêmes X mois juste avant)
        const prevEndMonth = addMonthsUTC(labels[0], -1);
        const prevLabels = [];
        for (let i = months - 1; i >= 0; i--) prevLabels.push(addMonthsUTC(prevEndMonth, -i));
        const prevFrom = startOfMonthISO(prevLabels[0]);
        const prevTo = endOfMonthISO(prevLabels[prevLabels.length - 1]);

        const prevSumAll = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE user_id = ?
                AND date BETWEEN ? AND ?
        `).get(userId, prevFrom, prevTo).total;

        const prevSubSum = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE user_id = ?
                AND date BETWEEN ? AND ?
                AND source = 'subscription'
        `).get(userId, prevFrom, prevTo).total;

        const prevSubPct = prevSumAll === 0 ? 0 : (prevSubSum / prevSumAll) * 100;
        const deltaSub = subscriptionPercent - prevSubPct;

        const subscriptionTrend =
        Math.abs(deltaSub) < 1 ? "stable" : (deltaSub > 0 ? "up" : "down");

        // 6) Comparaisons (mois courant vs mois dernier, et vs moyenne période)
        const lastMonth = labels[labels.length - 1];
        const prevMonth = addMonthsUTC(lastMonth, -1);

        const lastMonthTotal = monthTotals.get(lastMonth) || 0;
        const prevMonthTotalRow = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE user_id = ?
                AND substr(date, 1, 7) = ?
        `).get(userId, prevMonth);
        const prevMonthTotal = prevMonthTotalRow.total;

        const vsLastMonthPct = pctChange(lastMonthTotal, prevMonthTotal);
        const vsLastMonthDir = vsLastMonthPct >= 0 ? "up" : "down";

        const vsAveragePct = avgMonthly === 0 ? 0 : ((lastMonthTotal - avgMonthly) / avgMonthly) * 100;
        const vsAverageDir = vsAveragePct >= 0 ? "up" : "down";

        // 7) Historique budget (sur la période, mois par mois)
        const rules = db.prepare(`
            SELECT id, category, monthly_limit AS monthlyLimit
            FROM budget_rules
            WHERE user_id = ? AND is_active = 1
            ORDER BY category IS NOT NULL DESC, category ASC, id ASC
        `).all(userId);

        const sumMonthCatStmt = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE user_id = ?
                AND substr(date, 1, 7) = ?
                AND category = ?
        `);

        const sumMonthAllStmt = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE user_id = ?
                AND substr(date, 1, 7) = ?
        `);

        const budgetHistory = rules.map(rule => {
            const monthsArr = labels.map(m => {
                const spent = rule.category
                    ? sumMonthCatStmt.get(userId, m, rule.category).total
                    : sumMonthAllStmt.get(userId, m).total;

                const status = spent > rule.monthlyLimit ? "exceeded" : "ok";
                return { month: m, status, spent };
            });

            const okCount = monthsArr.filter(x => x.status === "ok").length;
            const exceededCount = monthsArr.length - okCount;

            return {
                ruleId: rule.id,
                category: rule.category,
                monthlyLimit: rule.monthlyLimit,
                months: monthsArr,
                summary: { okCount, exceededCount },
            };
        });

        return res.json({
            period: { months, from, to, labels },
            expensesTrend: { series },
            kpis: {
                peak,
                min,
                avgMonthly: { value: avgMonthly, months },
                topCategory: {
                category: topCategoryName,
                total: topCategoryTotal,
                sharePercent: topCategoryShare,
                },
                subscriptionShare: {
                percent: subscriptionPercent,
                trend: subscriptionTrend,
                },
            },
            budgetHistory,
            comparisons: {
                vsLastMonth: { percent: vsLastMonthPct, direction: vsLastMonthDir },
                vsAverage: { percent: vsAveragePct, direction: vsAverageDir },
            },
        });
    } catch (e) {
        next(e);
    }
});

module.exports = router;
