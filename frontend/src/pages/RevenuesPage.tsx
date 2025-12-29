import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Card from "../components/Card";
import PageTitle from "../components/PageTitle";
import { createRevenue, deleteRevenue, getRevenues, updateRevenue } from "../api/revenuesApi";
import { type Revenue, type RevenueInput, type RevenueType } from "../types/revenue";

type RevenueFormState = {
    amount: string;
    currency: string;
    date: string;
    type: RevenueType;
    description: string;
};

const INITIAL_FORM_STATE: RevenueFormState = {
    amount: "",
    currency: "EUR",
    date: "",
    type: "one-off",
    description: "",
};

type ModalMode = "create" | "edit";

function toYYYYMM(date: Date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
}

function toYYYYMMDD(date: Date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function RevenuesPage() {
    const [month, setMonth] = useState<string>(() => toYYYYMM(new Date()));
    const [revenues, setRevenues] = useState<Revenue[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState<RevenueFormState>(INITIAL_FORM_STATE);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<ModalMode>("create");
    const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

    useEffect(() => {
        fetchRevenues(month);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [month]);

    async function fetchRevenues(selectedMonth: string) {
        try {
            setLoading(true);
            const data = await getRevenues(selectedMonth);
            setRevenues(data);
            setError(null);
        } catch (err) {
            console.error("Erreur chargement revenus:", err);
            setError(err instanceof Error ? err.message : "Erreur lors du chargement des revenus.");
        } finally {
            setLoading(false);
        }
    }

    const totalMonth = useMemo(() => {
        return revenues.reduce((sum, r) => sum + (typeof r.amount === "number" ? r.amount : 0), 0);
    }, [revenues]);

    function openCreateModal() {
        setModalMode("create");
        setEditingRevenue(null);
        setForm({
            amount: "",
            currency: "EUR",
            date: toYYYYMMDD(new Date()),
            type: "one-off",
            description: "",
        });
        setFormError(null);
        setIsModalOpen(true);
    }

    function openEditModal(revenue: Revenue) {
        setModalMode("edit");
        setEditingRevenue(revenue);
        setForm({
            amount: String(revenue.amount),
            currency: revenue.currency,
            date: revenue.date,
            type: revenue.type,
            description: revenue.description || "",
        });
        setFormError(null);
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setEditingRevenue(null);
        setFormError(null);
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!form.amount || !form.date) {
            setFormError("Les champs Montant et Date sont obligatoires.");
            return;
        }

        const amountNumber = Number(form.amount);
        if (Number.isNaN(amountNumber) || amountNumber <= 0) {
            setFormError("Le montant doit être positif.");
            return;
        }

        const payload: RevenueInput = {
            amount: amountNumber,
            currency: form.currency || "EUR",
            date: form.date,
            type: form.type,
            description: form.description || "",
        };

        try {
            setFormSubmitting(true);

            if (modalMode === "create") {
                const created = await createRevenue(payload);
                if (created.type === "recurring") {
                    // on recharge : l’API renverra l’occurrence (et pas le template)
                    await fetchRevenues(month);
                } else {
                    if (created.date.startsWith(`${month}-`)) {
                    setRevenues((prev) => [created, ...prev]);
                    }
                }
            } else if (modalMode === "edit" && editingRevenue) {
                const updated = await updateRevenue(editingRevenue.id, payload);
                if (!updated.date.startsWith(`${month}-`)) {
                    await fetchRevenues(month);
                } else {
                    setRevenues((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
                }
            }

            closeModal();
        } catch (err) {
            console.error("Erreur submit revenu:", err);
            setFormError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement du revenu.");
        } finally {
            setFormSubmitting(false);
        }
    }

    async function handleDelete(revenue: Revenue) {
        const confirmed = window.confirm(
            `Supprimer le revenu du ${revenue.date} (${revenue.amount} ${revenue.currency}) ?`
        );
        if (!confirmed) return;

        try {
            await deleteRevenue(revenue.id);
            setRevenues((prev) => prev.filter((r) => r.id !== revenue.id));
        } catch (err) {
            console.error("Erreur suppression revenu:", err);
            alert("Erreur lors de la suppression du revenu. Consultez la console pour plus de détails.");
        }
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <PageTitle title="Revenus" />
                </div>

                <div className="page-header-action page-header-action--group">
                    <div className="month-filter">
                        <label className="month-filter-label" htmlFor="month">
                            Mois
                        </label>
                        <input id="month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
                    </div>

                    <button type="button" className="btn" onClick={openCreateModal}>
                        + Ajouter un revenu
                    </button>
                </div>
            </div>

            {!loading && !error && (
                <Card>
                    <div className="revenues-summary">
                        <div className="revenues-summary-label">Total du mois</div>
                        <div className="revenues-summary-value">+{totalMonth.toFixed(2)} €</div>
                    </div>
                </Card>
            )}

            {loading && <p>Chargement des revenus...</p>}

            {error && (
                <Card>
                    <p className="error-text">{error}</p>
                </Card>
            )}

            {!loading && !error && (
                <Card>
                    <h2 className="revenues-list-title">Liste des revenus</h2>

                    {revenues.length === 0 ? (
                        <p>Aucun revenu pour ce mois.</p>
                    ) : (
                        <div className="revenues-list">
                            {revenues.map((revenue) => (
                                <Card key={revenue.id}>
                                    <div className="revenue-card-header">
                                        <div>
                                            <div className="list-item-title">
                                                {revenue.type === "recurring" ? "Récurrent" : "Ponctuel"} — {revenue.amount}{" "}
                                                {revenue.currency}
                                            </div>
                                            <div className="list-item-meta">Date : {revenue.date}</div>
                                            {revenue.description && <div className="list-item-meta">{revenue.description}</div>}
                                        </div>

                                        <div>
                                            <button
                                                type="button"
                                                className="icon-button"
                                                onClick={() => openEditModal(revenue)}
                                                aria-label="Modifier le revenu"
                                                title="Modifier"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                type="button"
                                                className="icon-button"
                                                onClick={() => handleDelete(revenue)}
                                                aria-label="Supprimer le revenu"
                                                title="Supprimer"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2 className="modal-title">{modalMode === "create" ? "Ajouter un revenu" : "Modifier le revenu"}</h2>

                        {formError && <p className="error-text--spaced">{formError}</p>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="amount">Montant *</label>
                                <input
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.amount}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="currency">Devise</label>
                                <input id="currency" name="currency" type="text" value={form.currency} onChange={handleInputChange} />
                            </div>

                            <div className="form-group">
                                <label htmlFor="date">Date *</label>
                                <input id="date" name="date" type="date" value={form.date} onChange={handleInputChange} />
                            </div>

                            <div className="form-group">
                                <label htmlFor="type">Type</label>
                                <select id="type" name="type" value={form.type} onChange={handleInputChange}>
                                    <option value="one-off">Ponctuel</option>
                                    <option value="recurring">Récurrent</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={form.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal} disabled={formSubmitting}>
                                    Annuler
                                </button>
                                <button type="submit" className="btn" disabled={formSubmitting}>
                                    {formSubmitting ? "Enregistrement..." : modalMode === "create" ? "Enregistrer" : "Mettre à jour"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RevenuesPage;
