const db = require("../db");
const { computeMonthlyEquivalent } = require("../services/subscriptionExpenseGenerator");

function getAllSubscriptions(userId) {
    const statement = db.prepare(`
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

    const rows = statement.all(userId);
    return rows;
}

function createSubscription(userId, { name, amount, promoAmount, currency, billingPeriod, status, statusEndDate, nextBillingDate, description }) {
    const monthlyEquivalent = computeMonthlyEquivalent(amount, billingPeriod);
    
    const insertStatement = db.prepare(`
        INSERT INTO subscriptions (user_id, name, amount, promo_amount, currency, billing_period, monthly_equivalent, status, status_end_date, next_billing_date, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = insertStatement.run(
        userId,
        name,
        amount,
        promoAmount ?? null,
        currency || "EUR",
        billingPeriod,
        monthlyEquivalent,
        status || "active",
        statusEndDate || null,
        nextBillingDate,
        description || ""
    );

    const newSubscription = {
        id: info.lastInsertRowid,
        name,
        amount,
        promoAmount: promoAmount ?? null,
        currency: currency || "EUR",
        billingPeriod,
        monthlyEquivalent,
        status: status || "active",
        statusEndDate: statusEndDate || null,
        nextBillingDate,
        description: description || "",
    };

    return newSubscription;
}

function updateSubscription(userId, id, { name, amount, promoAmount, currency, billingPeriod, status, statusEndDate, nextBillingDate, description }) {
    const monthlyEquivalent = computeMonthlyEquivalent(amount, billingPeriod);
    
    const updateStatement = db.prepare(`
        UPDATE subscriptions
        SET
            name = ?,
            amount = ?,
            promo_amount = ?, 
            currency = ?,
            billing_period = ?,
            monthly_equivalent = ?,
            status = ?,
            status_end_date = ?,
            next_billing_date = ?,
            description = ?
        WHERE id = ? AND user_id = ?
    `);

    const result = updateStatement.run(
        name,
        amount,
        promoAmount,
        currency || "EUR",
        billingPeriod,
        monthlyEquivalent,
        status || "active",
        statusEndDate || null,
        nextBillingDate,
        description || "",
        id,
        userId
    );

    if (result.changes === 0) {
        return null;
    }

    const selectStatement = db.prepare(`
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
        WHERE id = ? AND user_id = ?
    `);

    const updatedSubscription = selectStatement.get(id, userId);
    return updatedSubscription;
}

function deleteSubscription(userId, id) {
    const deleteStatement = db.prepare(`
        DELETE FROM subscriptions
        WHERE id = ? AND user_id = ?
    `);

    const result = deleteStatement.run(id, userId);

    return result.changes > 0;
}


module.exports = {
    getAllSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription,
};
