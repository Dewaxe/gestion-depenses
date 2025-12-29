import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { createRevenue, deleteRevenue, getRevenues, updateRevenue } from "../api/revenuesApi";
import { type Revenue, type RevenueInput, type RevenueType } from "../types/revenue";
import { useNavigate } from "react-router-dom";

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

function parseYYYYMM(month: string) {
    const [y, m] = month.split("-").map(Number);
    return new Date(y, m - 1, 1);
}

function addMonthsYYYYMM(month: string, delta: number) {
    const d = parseYYYYMM(month);
    d.setMonth(d.getMonth() + delta);
    return toYYYYMM(d);
}

function monthLabelFR(month: string) {
    const d = parseYYYYMM(month);
    return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(d);
}

function isValidISODate(dateISO: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateISO);
}

function formatAmountFR(amount: number, currency: string) {
    const value = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: currency || "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);

    return `+ ${value}`;
}

function daySectionLabelFR(dateISO: string) {
    const [y, m, d] = dateISO.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const label = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long" }).format(date);
    return label.toUpperCase();
}

function sameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);

    const navigate = useNavigate();

    // Filtres (template)
    const [typeFilter, setTypeFilter] = useState<"all" | RevenueType>("all");

    useEffect(() => {
        fetchRevenues(month);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [month]);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            const target = e.target as HTMLElement;
            if (!target.closest(".type-filter")) setIsTypeMenuOpen(false);
        }
        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, []);


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

    const filteredRevenues = useMemo(() => {
        if (typeFilter === "all") return revenues;
        return revenues.filter((r) => r.type === typeFilter);
    }, [revenues, typeFilter]);

    const totalMonth = useMemo(() => {
        return filteredRevenues.reduce((sum, r) => sum + (typeof r.amount === "number" ? r.amount : 0), 0);
    }, [filteredRevenues]);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            const target = e.target as HTMLElement;
            if (!target.closest(".revenue-actions")) setOpenMenuId(null);
        }
        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, []);


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
                await createRevenue(payload);
                await fetchRevenues(month);
            } else if (modalMode === "edit" && editingRevenue) {
                await updateRevenue(editingRevenue.id, payload);
                await fetchRevenues(month);
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
        const confirmed = window.confirm(`Supprimer "${revenue.description || "Revenu"}" (${revenue.amount} ${revenue.currency}) ?`);
        if (!confirmed) return;

        try {
            await deleteRevenue(revenue.id);
            await fetchRevenues(month);
        } catch (err) {
            console.error("Erreur suppression revenu:", err);
            alert("Erreur lors de la suppression du revenu. Consultez la console pour plus de détails.");
        }
    }

    const grouped = useMemo(() => {
        const list = [...filteredRevenues]
            .filter((r) => isValidISODate(r.date))
            .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        type Group = { label: string; items: Revenue[] };
        const groups: Group[] = [];

        const pushToGroup = (label: string, item: Revenue) => {
            const existing = groups.find((g) => g.label === label);
            if (existing) existing.items.push(item);
            else groups.push({ label, items: [item] });
        };

        for (const r of list) {
            const [y, m, d] = r.date.split("-").map(Number);
            const dt = new Date(y, m - 1, d);

            if (sameDay(dt, today)) pushToGroup("AUJOURD'HUI", r);
            else if (sameDay(dt, yesterday)) pushToGroup("HIER", r);
            else pushToGroup(daySectionLabelFR(r.date), r);
        }

        return groups;
    }, [filteredRevenues]);

    return (
        <div className="revenues-page">
            {/* Header */}
            <div className="revenues-topbar">
                <div className="revenues-topbar-inner">
                    <div className="revenues-titleblock">
                        <div className="revenues-title-row">
                            <button
                                type="button"
                                className="revenues-nav-arrow"
                                aria-label="Aller aux dépenses"
                                onClick={() => navigate("/expenses")}
                            >
                                ‹
                            </button>
                            <h1 className="revenues-title">Revenus</h1>
                            <button
                                type="button"
                                className="revenues-nav-arrow"
                                aria-label="Aller aux abonnements"
                                onClick={() => navigate("/subscriptions")}
                            >
                                ›
                            </button>
                        </div>
                        <p className="revenues-subtitle">Liste et gestion de vos revenus</p>
                    </div>

                    <div className="revenues-topbar-actions">
                        <div className="month-pill">
                            <button
                                type="button"
                                className="month-pill-btn"
                                aria-label="Mois précédent"
                                onClick={() => setMonth((m) => addMonthsYYYYMM(m, -1))}
                            >
                                ‹
                            </button>
                            <div className="month-pill-label">{monthLabelFR(month)}</div>
                            <button
                                type="button"
                                className="month-pill-btn"
                                aria-label="Mois suivant"
                                onClick={() => setMonth((m) => addMonthsYYYYMM(m, 1))}
                            >
                                ›
                            </button>
                        </div>

                        <button type="button" className="btn revenues-add-btn" onClick={openCreateModal}>
                            + Ajouter un revenu
                        </button>
                    </div>
                </div>
            </div>

            {/* Filtres + Total */}
            <div className="revenues-content">
                <div className="revenues-toolbar">
                    <div className="revenues-filters">
                        <button type="button" className="filter-chip" disabled title="Bientôt disponible">
                            <span className="filter-chip-icon">⛓️</span>
                                Source
                            <span className="filter-chip-caret">▾</span>
                        </button>

                        {/* <div className="filter-chip filter-chip--select">
                            <span className="filter-chip-icon">⚙️</span>
                            <span className="filter-chip-value">
                                {typeFilter === "all" ? "Type" : typeFilter === "one-off" ? "Ponctuel" : "Récurrent"}
                            </span>
                            <select
                                aria-label="Filtrer par type"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as "all" | RevenueType)}
                                className="filter-chip-select"
                            >
                                <option value="all">Tout</option>
                                <option value="one-off">Ponctuel</option>
                                <option value="recurring">Récurrent</option>
                            </select>
                            <span className="filter-chip-caret">▾</span>
                        </div> */}
                        <div className="filter-chip type-filter">
                            <span className="filter-chip-icon">⚙️</span>

                            <button
                                type="button"
                                className="filter-chip-button"
                                onClick={() => setIsTypeMenuOpen((v) => !v)}
                                aria-haspopup="menu"
                                aria-expanded={isTypeMenuOpen}
                            >
                                <span className="filter-chip-value">
                                {typeFilter === "all"
                                    ? "Tout"
                                    : typeFilter === "one-off"
                                    ? "Ponctuel"
                                    : "Récurrent"}
                                </span>
                                <span className="filter-chip-caret">▾</span>
                            </button>

                            {isTypeMenuOpen && (
                                <div className="filter-menu" role="menu">
                                <button
                                    type="button"
                                    className="filter-menu-item"
                                    onClick={() => { setTypeFilter("all"); setIsTypeMenuOpen(false); }}
                                >
                                    Tout
                                </button>
                                <button
                                    type="button"
                                    className="filter-menu-item"
                                    onClick={() => { setTypeFilter("one-off"); setIsTypeMenuOpen(false); }}
                                >
                                    Ponctuel
                                </button>
                                <button
                                    type="button"
                                    className="filter-menu-item"
                                    onClick={() => { setTypeFilter("recurring"); setIsTypeMenuOpen(false); }}
                                >
                                    Récurrent
                                </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="revenues-total">
                        <div className="revenues-total-label">Total du mois</div>
                        <div className="revenues-total-value">{formatAmountFR(totalMonth, "EUR")}</div>
                    </div>
                </div>

                {/* États */}
                {loading && <p>Chargement des revenus...</p>}

                {!loading && error && <p className="error-text">{error}</p>}

                {!loading && !error && grouped.length === 0 && <p>Aucun revenu pour ce mois.</p>}

                {/* Liste */}
                {!loading && !error && grouped.length > 0 && (
                    <div className="revenues-list">
                        {grouped.map((g) => (
                            <div key={g.label} className="revenues-group">
                                <div className="revenues-group-label">{g.label}</div>

                                <div className="revenues-group-items">
                                    {g.items.map((r) => {
                                        const title = r.description?.trim() || (r.type === "recurring" ? "Revenu récurrent" : "Revenu");
                                        const metaLeft = r.type === "recurring" ? "Récurrent" : "Ponctuel";

                                        return (
                                            <div key={r.id} className="revenue-row">
                                                <div className="revenue-row-left">
                                                    <div className={`revenue-icon ${r.type === "recurring" ? "revenue-icon--blue" : "revenue-icon--green"}`}>
                                                        {r.type === "recurring" ? "💼" : "🏷️"}
                                                    </div>

                                                    <div className="revenue-text">
                                                        <div className="revenue-title">
                                                            {title}
                                                            {r.type === "recurring" && <span className="revenue-badge">FIXE</span>}
                                                        </div>
                                                        <div className="revenue-meta">
                                                            <span className="revenue-tag">{metaLeft}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="revenue-row-right">
                                                    <div className="revenue-amount">{formatAmountFR(r.amount, r.currency || "EUR")}</div>

                                                    <div className="revenue-actions">
                                                        <button
                                                            type="button"
                                                            className="kebab-button"
                                                            aria-label="Actions"
                                                            onClick={() => setOpenMenuId((cur) => (cur === r.id ? null : r.id))}
                                                        >
                                                            ⋯
                                                        </button>

                                                        {openMenuId === r.id && (
                                                            <div className="kebab-menu" role="menu">
                                                            <button type="button" className="kebab-item" onClick={() => { setOpenMenuId(null); openEditModal(r); }}>
                                                                Modifier
                                                            </button>
                                                            <button type="button" className="kebab-item kebab-item--danger" onClick={() => { setOpenMenuId(null); handleDelete(r); }}>
                                                                Supprimer
                                                            </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            

            {/* Modale */}
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
