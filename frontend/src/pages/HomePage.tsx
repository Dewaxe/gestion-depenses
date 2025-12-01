import React, {useEffect, useState} from "react";
import PageTitle from "../components/PageTitle";
import Card from "../components/Card";
import { type Expense } from "../types/expense";
import { type Subscription } from "../types/subscription";
import { getExpenses } from "../api/expensesApi";
import { getSubscriptions } from "../api/subscriptionsApi";

function HomePage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [expensesData, subscriptionsData] = await Promise.all([
          getExpenses(),
          getSubscriptions(),
        ])
        setExpenses(expensesData);
        setSubscriptions(subscriptionsData);
        setError(null);
      } catch (err) {
        console.error("Erreur chargement dashboard:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement du tableau de bord."
        )
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const totalExpensesThisMonth = expenses
    .filter((expense) => {
      const date = new Date(expense.date);
      return (
        date.getFullYear() === currentYear && date.getMonth() === currentMonth
      );
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  const monthlySubscriptionsTotal = subscriptions
    .filter((sub) => sub.frequency === "monthly")
    .reduce((sum, sub) => sum + sub.price, 0);

  const yearlySubscriptionsTotal = subscriptions
    .filter((sub) => sub.frequency === "yearly")
    .reduce((sum, sub) => sum + sub.price, 0);
  
  const upcomingSubscriptions = [...subscriptions]
    .sort ((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate))
    .slice(0, 3);
  
  const latestExpenses = expenses.slice(0, 5);

  return (
    <div>
      <PageTitle
        title="Tableau de bord"
        subtitle="Vued'ensemble de vos dépenses et abonnements"
      />

      {loading && <p>Chargement du tableau de bord...</p>}
      {error && (
        <Card>
          <p style={{ color: "red" }}>{error}</p>
        </Card>
      )}

      {!loading && !error && (
        <>
          <Card>
            <h2 style={{ marginBottom: "1rem" }}>Vue d'ensemble</h2>

            <div className="dashboard-grid">
              <div>
                <div className="stat-card-title">Dépenses ce mois-ci</div>
                <div className="stat-card-value">
                  {totalExpensesThisMonth.toFixed(2)} €
                </div>
              </div>

              <div>
                <div className="stat-card-title">Abonnements mensuels</div>
                <div className="stat-card-value">
                  {monthlySubscriptionsTotal.toFixed(2)} €
                </div>
              </div>

              <div>
                <div className="stat-card-title">Abonnements annuels</div>
                <div className="stat-card-value">
                  {yearlySubscriptionsTotal.toFixed(2)} €
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 style={{ marginBottom: "1rem" }}>Prochaines échéances</h2>

            {upcomingSubscriptions.length === 0 ? (
              <p>Aucune échéance d'abonnement enregistrée.</p>
            ) : (
              <ul className="dashbord-list">
                {upcomingSubscriptions.map((sub) => (
                  <li key={sub.id} className="dashboard-list-item">
                    <div className="dashboard-list-item-title">
                      {sub.name} - {sub.price} {sub.currency}
                    </div>
                    <div className="dashboard-list-item-meta">
                      Prochaine facturation : {sub.nextBillingDate} (
                        {sub.frequency === "monthly" ? "mensuel" : "annuel"}
                      )
                    </div>
                    {sub.description && (
                      <div className="dashboard-list-item-meta">
                        {sub.description}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 style={{ marginBottom: "1rem" }}>Dernières dépenses</h2>

            {latestExpenses.length === 0 ? (
              <p>Aucune dépense enregistrée.</p>
            ) : (
              <ul className="dasboard-list">
                {latestExpenses.map((expense) => (
                  <li key={expense.id} className="dashboard-list-item">
                    <div className="dashboard-list-item-title">
                      {expense.category} - {expense.amount} {expense.currency}
                    </div>
                    <div className="dashboard-list-item-meta">
                      Date : {expense.date} - Moyen de paiement :{""} {expense.paymentMethod}
                    </div>
                    {expense.description && (
                      <div className="dashboard-list-item-meta">
                        {expense.description}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export default HomePage;
