import { useEffect, useState } from "react";
import PageTitle from "../components/PageTitle";
import Card from "../components/Card";
import { getHome } from "../api/homeApi";
import type { HomeResponse, HomeView } from "../types/home";

function getCurrentMonthYYYYMM() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
}

function HomePage() {
    const [view, setView] = useState<HomeView>("month");
    const [month, setMonth] = useState<string>(getCurrentMonthYYYYMM());

    const [data, setData] = useState<HomeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                setError(null);
                const res = await getHome({ view: "month", month });
                setData(res);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Erreur chargement accueil");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [view, month]);

    return (
        <div>
            <PageTitle title="Tableau de bord" subtitle="Vue d'ensemble de votre situation financière" />

            {/* Toggle (V1 simple) */}
            <Card>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <strong>Période</strong>
                    <button disabled={view === "month"} onClick={() => setView("month")}>Mois</button>
                    <button disabled>Trimestre</button>
                    <button disabled>Année</button>

                    {/* Pour l’instant, on ne gère que le mois (rapide). */}
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        style={{ marginLeft: "auto" }}
                    />
                </div>
            </Card>

            {loading && <p>Chargement...</p>}
            {error && (
                <Card>
                    <p style={{ color: "red" }}>{error}</p>
                </Card>
            )}

            {!loading && !error && data && (
                <>
                    <Card>
                        <h2 style={{ marginBottom: "1rem" }}>Solde</h2>
                        <div className="dashboard-grid">
                        <div>
                            <div className="stat-card-title">Solde</div>
                            <div className="stat-card-value">{data.totals.balance.toFixed(2)} €</div>
                        </div>
                        <div>
                            <div className="stat-card-title">Revenus</div>
                            <div className="stat-card-value">{data.totals.revenues.toFixed(2)} €</div>
                        </div>
                        <div>
                            <div className="stat-card-title">Dépenses</div>
                            <div className="stat-card-value">{data.totals.expenses.toFixed(2)} €</div>
                        </div>
                        </div>
                    </Card>

                    <Card>
                        <h2 style={{ marginBottom: "1rem" }}>Règles budgétaires</h2>
                        {!data.budgets || data.budgets.length === 0 ? (
                            <p>Aucune règle active.</p>
                        ) : (
                            <ul className="dashboard-list">
                                {data.budgets.map((b) => (
                                    <li key={b.id} className="dashboard-list-item">
                                        <div className="dashboard-list-item-title">
                                            {b.category ?? "Global"} — reste {b.remaining.toFixed(2)} € / {b.periodLimit.toFixed(2)} €
                                        </div>
                                        <div className="dashboard-list-item-meta">
                                            Dépensé : {b.spent.toFixed(2)} € — {b.status === "exceeded" ? "Dépassé" : "OK"}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card>
                        <h2 style={{ marginBottom: "1rem" }}>Prochains prélèvements</h2>
                        {data.upcomingSubscriptions.length === 0 ? (
                            <p>Aucune échéance sur la période.</p>
                        ) : (
                            <ul className="dashboard-list">
                                {data.upcomingSubscriptions.map((s) => (
                                    <li key={s.id} className="dashboard-list-item">
                                        <div className="dashboard-list-item-title">
                                            {s.name} — {s.amount} {s.currency}
                                        </div>
                                        <div className="dashboard-list-item-meta">
                                            {s.nextBillingDate} ({s.billingPeriod})
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card>
                        <h2 style={{ marginBottom: "1rem" }}>Dépenses récentes</h2>
                            {data.recentExpenses.length === 0 ? (
                        <p>Aucune dépense sur la période.</p>
                        ) : (
                            <ul className="dashboard-list">
                                {data.recentExpenses.map((e) => (
                                    <li key={e.id} className="dashboard-list-item">
                                        <div className="dashboard-list-item-title">
                                            {e.category} — {e.amount} {e.currency}
                                        </div>
                                        <div className="dashboard-list-item-meta">
                                            {e.date}{e.paymentMethod ? ` — ${e.paymentMethod}` : ""}
                                        </div>
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
