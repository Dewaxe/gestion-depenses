import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createExpense, deleteExpense, getExpenses, updateExpense } from "../api/expensesApi";
import { type Expense, type ExpenseInput } from "../types/expense";
import "../styles/pages/ExpensesPage.css";

type ExpenseFormState = {
    amount: string;
    currency: string;
    date: string;
    category: string;
    paymentMethod: string;
    description: string;
};

const INITIAL_FORM_STATE: ExpenseFormState = {
    amount: "",
    currency: "EUR",
    date: "",
    category: "",
    paymentMethod: "",
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

function sameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function daySectionLabelFR(dateISO: string) {
    const [y, m, d] = dateISO.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const label = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long" }).format(date);
    return label.toUpperCase();
}

function formatAmountFR(amount: number, currency: string) {
    const value = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: currency || "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);

    return `- ${value}`;
}

function iconForExpense(category: string, paymentMethod: string) {
    const c = (category || "").toLowerCase();
    const p = (paymentMethod || "").toLowerCase();

    if (c.includes("loyer") || c.includes("logement")) return "🏠";
    if (c.includes("course") || c.includes("supermarch")) return "🛒";
    if (c.includes("resto") || c.includes("restaurant") || c.includes("bar")) return "🍽️";
    if (c.includes("transport") || c.includes("essence") || c.includes("uber") || c.includes("sncf")) return "🚆";
    if (c.includes("sant") || c.includes("pharm")) return "🩺";
    if (c.includes("sport")) return "🏋️";
    if (c.includes("netflix") || c.includes("spotify") || c.includes("abonn")) return "🔁";

    if (p.includes("cb") || p.includes("carte")) return "💳";
    if (p.includes("cash") || p.includes("esp")) return "💶";
    if (p.includes("virement")) return "🏦";

    return "🧾";
}

function ExpensesPage() {
    const [month, setMonth] = useState<string>(() => toYYYYMM(new Date()));
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState<ExpenseFormState>(INITIAL_FORM_STATE);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<ModalMode>("create");
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    const [isModalClosing, setIsModalClosing] = useState(false);

    // Filtres (utiles ?)
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchExpenses(month);
    }, [month]);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            const target = e.target as HTMLElement;
            if (!target.closest(".entry-actions")) setOpenMenuId(null);
            if (!target.closest(".category-filter")) setIsCategoryMenuOpen(false);
        }

        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, []);

    async function fetchExpenses(selectedMonth: string) {
        try {
            setLoading(true);
            const data = await getExpenses(selectedMonth);
            setExpenses(data);
            setError(null);
        } catch (err) {
            console.error("Erreur chargement dépenses:", err);
            setError(err instanceof Error ? err.message : "Erreur lors du chargement des dépenses.");
        } finally {
            setLoading(false);
        }
    }

    const categories = useMemo(() => {
        const set = new Set<string>();
        for (const e of expenses) {
            const c = (e.category || "").trim();
            if (c) set.add(c);
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
    }, [expenses]);

    const filteredExpenses = useMemo(() => {
        if (categoryFilter === "all") return expenses;
        return expenses.filter((e) => e.category === categoryFilter);
    }, [expenses, categoryFilter]);

    const totalMonth = useMemo(() => {
        return filteredExpenses.reduce((sum, e) => sum + (typeof e.amount === "number" ? e.amount : 0), 0);
    }, [filteredExpenses]);

    const grouped = useMemo(() => {
        const list = [...filteredExpenses]
            .filter((e) => isValidISODate(e.date))
            .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        type Group = { label: string; items: Expense[] };
        const groups: Group[] = [];

        const pushToGroup = (label: string, item: Expense) => {
            const existing = groups.find((g) => g.label === label);
            if (existing) existing.items.push(item);
            else groups.push({ label, items: [item] });
        };

        for (const e of list) {
            const [y, m, d] = e.date.split("-").map(Number);
            const dt = new Date(y, m - 1, d);

            if (sameDay(dt, today)) pushToGroup("AUJOURD'HUI", e);
            else if (sameDay(dt, yesterday)) pushToGroup("HIER", e);
            else pushToGroup(daySectionLabelFR(e.date), e);
        }

        return groups;
    }, [filteredExpenses]);

    function openCreateModal() {
        setModalMode("create");
        setEditingExpense(null);
        setForm({
            amount: "",
            currency: "EUR",
            date: toYYYYMMDD(new Date()),
            category: "",
            paymentMethod: "",
            description: "",
        });
        setFormError(null);
        setIsModalOpen(true);
    }

    function openEditModal(expense: Expense) {
        setModalMode("edit");
        setEditingExpense(expense);
        setForm({
            amount: String(expense.amount),
            currency: expense.currency,
            date: expense.date,
            category: expense.category,
            paymentMethod: expense.paymentMethod || "Inconnu",
            description: expense.description || "",
        });
        setFormError(null);
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalClosing(true);
        window.setTimeout(() => {
            setIsModalOpen(false);
            setEditingExpense(null);
            setFormError(null);
            setIsModalClosing(false);
        }, 160);
    }


    function handleInputChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!form.amount || !form.date || !form.category) {
            setFormError("Veuillez remplir tous les champs obligatoires.");
            return;
        }

        const amountNumber = Number(form.amount);
        if (Number.isNaN(amountNumber) || amountNumber <= 0) {
            setFormError("Le montant doit être positif.");
            return;
        }

        const payload: ExpenseInput = {
            amount: amountNumber,
            currency: form.currency || "EUR",
            date: form.date,
            category: form.category,
            paymentMethod: form.paymentMethod || "",
            description: form.description || "",
        };

        try {
            setFormSubmitting(true);

            if (modalMode === "create") {
                await createExpense(payload);
                await fetchExpenses(month);
            } else if (modalMode === "edit" && editingExpense) {
                await updateExpense(editingExpense.id, payload);
                await fetchExpenses(month);
            }

            closeModal();
        } catch (err) {
            console.error("Erreur submit dépense:", err);
            setFormError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement de la dépense.");
        } finally {
            setFormSubmitting(false);
        }
    }

    async function handleDelete(expense: Expense) {
        const confirmed = window.confirm(`Supprimer "${expense.description || expense.category}" (${expense.amount} ${expense.currency}) ?`);
        if (!confirmed) return;

        try {
            await deleteExpense(expense.id);
            await fetchExpenses(month);
        } catch (err) {
            console.error("Erreur suppression dépense:", err);
            alert("Erreur lors de la suppression de la dépense. Consultez la console pour plus de détails.");
        }
    }

    return (
        <div className="expenses-page">
            {/* Header */}
            <div className="page-topbar">
                <div className="page-topbar-inner">
                    <div className="page-header">
                        <div className="page-header-row">
                            <button
                                type="button"
                                className="nav-arrow"
                                aria-label="Aller aux abonnements"
                                onClick={() => navigate("/subscriptions")}
                            >
                                ‹
                            </button>
                            <h1 className="page-title">Dépenses</h1>
                            <button
                                type="button"
                                className="nav-arrow"
                                aria-label="Aller aux revenus"
                                onClick={() => navigate("/revenues")}
                            >
                                ›
                            </button>
                        </div>
                        <p className="page-subtitle">Liste et gestion de vos dépenses</p>
                    </div>

                    <div className="page-topbar-actions">
                        <div className="month-switch">
                            <button
                                type="button"
                                className="month-switch-btn"
                                aria-label="Mois précédent"
                                onClick={() => setMonth((m) => addMonthsYYYYMM(m, -1))}
                            >
                                ‹
                            </button>
                            <div className="month-switch-label">{monthLabelFR(month)}</div>
                            <button
                                type="button"
                                className="month-switch-btn"
                                aria-label="Mois suivant"
                                onClick={() => setMonth((m) => addMonthsYYYYMM(m, 1))}
                            >
                                ›
                            </button>
                        </div>

                        <button type="button" className="btn page-add-btn" onClick={openCreateModal}>
                            + Ajouter une dépense
                        </button>
                    </div>
                </div>
            </div>

            {/* Filtres + Total */}
            <div className="page-content">
                <div className="page-toolbar">
                    <div className="filters">
                        <button type="button" className="filter-chip" disabled title="Bientôt disponible">
                            <span className="filter-chip-icon">⛓️</span>
                            Source
                            <span className="filter-chip-caret">▾</span>
                        </button>

                        <div className="filter-chip category-filter">
                            <span className="filter-chip-icon">🏷️</span>

                            <button
                                type="button"
                                className="filter-chip-button"
                                onClick={() => setIsCategoryMenuOpen((v) => !v)}
                                aria-haspopup="menu"
                                aria-expanded={isCategoryMenuOpen}
                            >
                                <span className="filter-chip-value">{categoryFilter === "all" ? "Toutes" : categoryFilter}</span>
                                <span className="filter-chip-caret">▾</span>
                            </button>

                            {isCategoryMenuOpen && (
                                <div className="filter-menu" role="menu">
                                    <button
                                        type="button"
                                        className="filter-menu-item"
                                        onClick={() => {
                                            setCategoryFilter("all");
                                            setIsCategoryMenuOpen(false);
                                        }}
                                    >
                                        Toutes
                                    </button>

                                    {categories.length === 0 ? (
                                        <div className="filter-menu-item filter-menu-item--disabled">Aucune catégorie</div>
                                    ) : (
                                        categories.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                className="filter-menu-item"
                                                onClick={() => {
                                                    setCategoryFilter(c);
                                                    setIsCategoryMenuOpen(false);
                                                }}
                                            >
                                                {c}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="page-kpi">
                        <div className="page-kpi-label">Total du mois</div>
                        <div className="page-kpi-value">{formatAmountFR(totalMonth, "EUR")}</div>
                    </div>
                </div>

                {/* États */}
                {loading && <p>Chargement des dépenses...</p>}

                {!loading && error && <p className="error-text">{error}</p>}

                {!loading && !error && grouped.length === 0 && <p>Aucune dépense pour ce mois.</p>}

                {/* Liste */}
                {!loading && !error && grouped.length > 0 && (
                    <div className="grouped-list">
                        {grouped.map((g) => (
                            <div key={g.label} className="expenses-group">
                                <div className="group-label">{g.label}</div>

                                <div className="group-items">
                                    {g.items.map((e) => {
                                        const title = e.description?.trim() || e.category || "Dépense";
                                        const icon = iconForExpense(e.category, e.paymentMethod);

                                        return (
                                            <div key={e.id} className="entry-row">
                                                <div className="entry-row-left">
                                                    <div className="entry-icon entry-icon--red">{icon}</div>

                                                    <div className="entry-text">
                                                        <div className="entry-title">{title}</div>
                                                        <div className="entry-meta">
                                                            {e.category && <span className="meta-chip">{e.category}</span>}
                                                            {e.paymentMethod && <span className="meta-chip">{e.paymentMethod}</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="entry-row-right">
                                                    <div className="entry-amount">{formatAmountFR(e.amount, e.currency || "EUR")}</div>

                                                    <div className="entry-actions">
                                                        <button
                                                            type="button"
                                                            className="kebab-button"
                                                            aria-label="Actions"
                                                            onClick={() => setOpenMenuId((cur) => (cur === e.id ? null : e.id))}
                                                        >
                                                            ⋯
                                                        </button>

                                                        {openMenuId === e.id && (
                                                            <div className="kebab-menu" role="menu">
                                                                <button
                                                                    type="button"
                                                                    className="kebab-item"
                                                                    onClick={() => {
                                                                        setOpenMenuId(null);
                                                                        openEditModal(e);
                                                                    }}
                                                                >
                                                                    Modifier
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="kebab-item kebab-item--danger"
                                                                    onClick={() => {
                                                                        setOpenMenuId(null);
                                                                        handleDelete(e);
                                                                    }}
                                                                >
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
                <div className={`modal-overlay ${isModalClosing ? "is-closing" : ""}`}>
                    <div className={`modal ${isModalClosing ? "is-closing" : ""}`}>
                        <h2 className="modal-title">{modalMode === "create" ? "Ajouter une dépense" : "Modifier la dépense"}</h2>

                        {formError && <p className="error-text--spaced">{formError}</p>}

                        

                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group form-group--span-2">
                                    <label htmlFor="description">Titre</label>
                                    <input
                                        id="description"
                                        name="description"
                                        type="text"
                                        value={form.description}
                                        onChange={handleInputChange}
                                    />
                                </div>

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
                                    <label htmlFor="paymentMethod">Moyen de paiement</label>
                                    <input
                                        id="paymentMethod"
                                        name="paymentMethod"
                                        type="text"
                                        value={form.paymentMethod}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                {/* gestion de devise pas encore en place */}
                                {/* <div className="form-group">
                                    <label htmlFor="currency">Devise</label>
                                    <input id="currency" name="currency" type="text" value={form.currency} onChange={handleInputChange} />
                                </div> */}

                                <div className="form-group">
                                    <label htmlFor="date">Date *</label>
                                    <input id="date" name="date" type="date" value={form.date} onChange={handleInputChange} />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="category">Catégorie *</label>
                                    <input id="category" name="category" type="text" value={form.category} onChange={handleInputChange} />
                                </div>
                            </div>
                            
                            
                            <div className="modal-actions">
                                <div className="modal-required-hint">* Champs obligatoires</div>
                                <div className="modal-actions-right">
                                    <button type="button" className="btn-secondary" onClick={closeModal} disabled={formSubmitting}>
                                        Annuler
                                    </button>
                                    <button type="submit" className="btn" disabled={formSubmitting}>
                                        {formSubmitting ? "Enregistrement..." : modalMode === "create" ? "Enregistrer" : "Mettre à jour"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ExpensesPage;
