import { useEffect, useMemo, useState } from "react";
import PageTitle from "../components/PageTitle";
import Card from "../components/Card";
import { getAnalysis } from "../api/analysisApi";
import type { AnalysisResponse } from "../types/analysis";
// import "../styles/pages/HomePage.css"

function getCurrentMonthYYYYMM() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
}

function formatPct(v: number) {
    const rounded = Math.round(v * 10) / 10;
    return `${rounded}%`;
}

export default function AnalysisPage() {
    const [months, setMonths] = useState<3 | 6 | 12>(6);
    const [endMonth, setEndMonth] = useState<string>(getCurrentMonthYYYYMM());

    const [data, setData] = useState<AnalysisResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                setError(null);
                const res = await getAnalysis({ months, endMonth });
                setData(res);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Erreur chargement analyse");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [months, endMonth]);

    const totalByMonth = useMemo(() => {
        if (!data) return [];
        // Somme de toutes les séries catégorie -> total par mois
        const n = data.period.labels.length;
        const totals = Array(n).fill(0);
        for (const s of data.expensesTrend.series) {
            for (let i = 0; i < n; i++) totals[i] += s.totals[i] || 0;
        }
        return totals;
    }, [data]);

    return (
        <div>
            <PageTitle title="Analyse" subtitle="Comprendre vos dépenses sur une période" />

            <Card>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <strong>Période</strong>

                <button disabled={months === 3} onClick={() => setMonths(3)}>3 mois</button>
                <button disabled={months === 6} onClick={() => setMonths(6)}>6 mois</button>
                <button disabled={months === 12} onClick={() => setMonths(12)}>12 mois</button>

                <input
                    type="month"
                    value={endMonth}
                    onChange={(e) => setEndMonth(e.target.value)}
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
                    {/* KPIs */}
                    <Card>
                        <h2 style={{ marginBottom: 12 }}>Indicateurs</h2>
                        <div className="dashboard-grid">
                            <div>
                                <div className="stat-card-title">Pic dépenses</div>
                                <div className="stat-card-value">{data.kpis.peak.total.toFixed(2)} €</div>
                                <div className="stat-card-sub">{data.kpis.peak.month}</div>
                            </div>

                            <div>
                                <div className="stat-card-title">Min dépenses</div>
                                <div className="stat-card-value">{data.kpis.min.total.toFixed(2)} €</div>
                                <div className="stat-card-sub">{data.kpis.min.month}</div>
                            </div>

                            <div>
                                <div className="stat-card-title">Moyenne mensuelle</div>
                                <div className="stat-card-value">{data.kpis.avgMonthly.value.toFixed(2)} €</div>
                                <div className="stat-card-sub">sur {data.kpis.avgMonthly.months} mois</div>
                            </div>

                            <div>
                                <div className="stat-card-title">Catégorie la plus chère</div>
                                <div className="stat-card-value">{data.kpis.topCategory.category ?? "-"}</div>
                                <div className="stat-card-sub">
                                {data.kpis.topCategory.total.toFixed(2)} € — {formatPct(data.kpis.topCategory.sharePercent)}
                                </div>
                            </div>

                            <div>
                                <div className="stat-card-title">Part abonnements</div>
                                <div className="stat-card-value">{formatPct(data.kpis.subscriptionShare.percent)}</div>
                                <div className="stat-card-sub">{data.kpis.subscriptionShare.trend}</div>
                            </div>
                        </div>
                    </Card>

                    {/* Trend “placeholder” (on mettra le vrai chart après) */}
                    <Card>
                        <h2 style={{ marginBottom: 12 }}>Évolution des dépenses (total)</h2>
                        <p style={{ marginTop: 0, opacity: 0.8 }}>
                            (V1 mapping) — on branchera le graphique du template ensuite.
                        </p>

                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: "left" }}>Mois</th>
                                        <th style={{ textAlign: "right" }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.period.labels.map((m, idx) => (
                                        <tr key={m}>
                                            <td>{m}</td>
                                            <td style={{ textAlign: "right" }}>{(totalByMonth[idx] || 0).toFixed(2)} €</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Comparaisons */}
                    <Card>
                        <h2 style={{ marginBottom: 12 }}>Comparaisons</h2>
                        <ul className="dashboard-list">
                            <li className="dashboard-list-item">
                                <div className="dashboard-list-item-title">Vs mois dernier</div>
                                <div className="dashboard-list-item-meta">
                                    {formatPct(data.comparisons.vsLastMonth.percent)} ({data.comparisons.vsLastMonth.direction})
                                </div>
                            </li>
                            <li className="dashboard-list-item">
                                <div className="dashboard-list-item-title">Vs moyenne</div>
                                <div className="dashboard-list-item-meta">
                                    {formatPct(data.comparisons.vsAverage.percent)} ({data.comparisons.vsAverage.direction})
                                </div>
                            </li>
                        </ul>
                    </Card>

                    {/* Historique budgets */}
                    <Card>
                        <h2 style={{ marginBottom: 12 }}>Historique des règles budgétaires</h2>
                        {data.budgetHistory.length === 0 ? (
                            <p>Aucune règle active.</p>
                        ) : (
                            <ul className="dashboard-list">
                                {data.budgetHistory.map((r) => (
                                <li key={r.ruleId} className="dashboard-list-item">
                                    <div className="dashboard-list-item-title">
                                        {r.category ?? "Global"} — limite {r.monthlyLimit.toFixed(2)} €/mois
                                    </div>
                                    <div className="dashboard-list-item-meta">
                                        OK: {r.summary.okCount} — Dépassé: {r.summary.exceededCount}
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
