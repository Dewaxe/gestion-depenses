import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { type Expense, type ExpenseInput } from "../types/expense";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "../api/expensesApi";
import Card from "../components/Card";
import PageTitle from "../components/PageTitle";

type ExpenseFormState = {
    amount: string;
    currency: string;
    date: string;
    category: string;
    paymentMethod: string;
    description: string;
}

const INITIAL_FORM_STATE: ExpenseFormState = {
    amount: "",
    currency: "EUR",
    date: "",
    category: "",
    paymentMethod: "",
    description: "",
};

type ModalMode = "create" | "edit";

function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [form, setForm] = useState<ExpenseFormState>(INITIAL_FORM_STATE);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<ModalMode>("create");
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

    useEffect(() => {
        fetchExpenses();
    }, []);

    async function fetchExpenses() {
        try {
            setLoading(true);
            const data = await getExpenses();
            setExpenses(data);
            setError(null);
        } catch (err) {
            console.error("Erreur chargement dépenses:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Erreur lors du chargement des dépenses."
            );
        } finally {
            setLoading(false);
        }
    }

    function openCreateModal() {
        setModalMode("create");
        setEditingExpense(null);
        setForm({
            amount: "",
            currency: "EUR",
            date: "",
            category: "",
            paymentMethod: "",
            description: "",
        })
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
            paymentMethod: expense.paymentMethod,
            description: expense.description,
        })
        setFormError(null);
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setEditingExpense(null);
        setFormError(null);
    }

    function handleInputChange(
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) {
        const { name, value } = event.target;

        setForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!form.amount || !form.date || !form.category) {
            setFormError("Les champs Montant, Date et Catégorie sont obligatoires.");
            return;
        }

        const amountNumber = Number(form.amount);
        if (Number.isNaN(amountNumber) || amountNumber <= 0) {
            setError("Le montant doit être positif.");
            return;
        }

        const payload: ExpenseInput = {
            amount: amountNumber,
            currency: form.currency || "EUR",
            date: form.date,
            category: form.category,
            paymentMethod: form.paymentMethod || "Inconnu",
            description: form.description || "",
        };

        try {
            setFormSubmitting(true);
            if (modalMode === "create") {
                const created = await createExpense(payload);
                setExpenses((prev) => [created, ...prev]);
            } else if (modalMode === "edit" && editingExpense) {
                const updated = await updateExpense(editingExpense.id, payload);
                setExpenses((prev) =>
                prev.map((exp) => (exp.id === updated.id ? updated : exp))
                );
            }

            closeModal();
        } catch (err) {
            console.error("Erreur submit dépense:", err);
            setFormError(
                err instanceof Error
                ? err.message
                : "Erreur lors de l'enregistrement de la dépense."
            );
        } finally {
            setFormSubmitting(false);
        }
    }

    async function handleDelete(expense: Expense) {
        const confirmed = window.confirm(
            `Supprimer la dépense "${expense.category}" du ${expense.date} ?`
        );
        if (!confirmed) return;

        try {
            await deleteExpense(expense.id);
            setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
        } catch (err) {
            console.error("Erreur suppression dépense:", err);
            alert(
                "Erreur lors de la suppression de la dépense. Consultez la console pour plus de détails."
            );
        }
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <PageTitle title="Dépenses" />
                </div>
                <div className="page-header-action">
                    <button type="button" className="btn" onClick={openCreateModal}>
                        + Ajouter une dépense
                    </button>
                </div>
            </div>
            
            {loading && <p>Chargement des dépenses...</p>}

            {error && (
                <Card>
                    <p className="error-text">{error}</p>
                </Card>
            )}
            
            {!loading && !error && (
                <Card>
                    <h2 className="expenses-list-title">Liste des dépenses</h2>

                    {expenses.length === 0 ? (
                        <p>Aucune dépense pour le moment.</p>
                    ) : (
                        <div className="expenses-list">
                            {expenses.map((expense) => (
                                <Card key={expense.id}>
                                    <div className="expense-card-header">
                                        <div>
                                            <div className="list-item-title">
                                                {expense.category} — {expense.amount}{" "}
                                                {expense.currency}
                                            </div>
                                            <div className="list-item-meta">
                                                Date : {expense.date} — Moyen de paiement :{" "}
                                                {expense.paymentMethod}
                                            </div>
                                            {expense.description && (
                                                <div className="list-item-meta">
                                                   {expense.description}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <button
                                                type="button"
                                                className="icon-button"
                                                onClick={() => openEditModal(expense)}
                                                aria-label="Modifier la dépense"
                                                title="Modifier"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                type="button"
                                                className="icon-button"
                                                onClick={() => handleDelete(expense)}
                                                aria-label="Supprimer la dépense"
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
                    <div className="modal-content">
                        <h2 className="modal-title">
                            {modalMode === "create" ? "Ajouter une dépense" : "Modifier la dépense"}
                        </h2>

                        {formError && (
                            <p className="error-text--spaced">{formError}</p>
                        )}

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
                                <input
                                    id="currency"
                                    name="currency"
                                    type="text"
                                    value={form.currency}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="date">Date *</label>
                                <input
                                    id="date"
                                    name="date"
                                    type="date"
                                    value={form.date}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="category">Catégorie *</label>
                                <input
                                    id="category"
                                    name="category"
                                    type="text"
                                    value={form.category}
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
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={closeModal}
                                    disabled={formSubmitting}
                                >
                                    Annuler
                                </button>
                                <button type="submit" className="btn" disabled={formSubmitting}>
                                    {formSubmitting
                                    ? "Enregistrement..."
                                    : modalMode === "create"
                                    ? "Enregistrer"
                                    : "Mettre à jour"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ExpensesPage;