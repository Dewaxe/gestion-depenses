import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { type Expense } from "../types/expense";
import { getExpenses, createExpense } from "../api/expensesApi";
import Card from "../components/Card";
import PageTitle from "../components/PageTitle";

type NewExpenseForm = {
    amount: string;
    currency: string;
    date: string;
    category: string;
    paymentMethod: string;
    description: string;
}

const INITIAL_FORM_STATE: NewExpenseForm = {
    amount: "",
    currency: "EUR",
    date: "",
    category: "",
    paymentMethod: "",
    description: "",
};

function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [form, setForm] = useState<NewExpenseForm>(INITIAL_FORM_STATE);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchExpenses();
    }, []);

    async function fetchExpenses() {
        try {
            const data = await getExpenses();
            setExpenses(data);
        } catch (error) {
            console.error("Erreur fetch expenses:", error);
        }
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
        setErrorMessage(null);

        if (!form.amount || !form.date || !form.category) {
            setErrorMessage("Les champs montant, date et catégorie sont obligatoires.");
            return;
        }

        const amountNumber = Number(form.amount);
        if (Number.isNaN(amountNumber) || amountNumber <= 0) {
            setErrorMessage("Le montant doit être positif.");
            return;
        }

        try {
            const createdExpense = await createExpense({
                amount: amountNumber,
                currency: form.currency || "EUR",
                date: form.date,
                category: form.category,
                paymentMethod: form.paymentMethod || "Inconnu",
                description: form.description || "",
            });

            setExpenses((prevExpenses) => [createdExpense, ...prevExpenses]);
            setForm(INITIAL_FORM_STATE);
        } catch (error) {
            console.error("Erreur POST /api/expenses:", error);
            setErrorMessage(
                error instanceof Error
                ? error.message
                : "Impossible d'enregistrer la dépense."
            );
        }
    }

    return (
        <div>
            <PageTitle
                title="Dépenses"
                subtitle="Suivez vos dépenses et ajoutez-en de nouvelles"
            />
            
            <Card>
                <h2 style={{ marginBottom: "1rem" }}>Ajouter une dépense</h2>

                {errorMessage && (
                    <p style={{ color: "red" }}>{errorMessage}</p>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>
                            Montant *<br />
                            <input
                                type="number"
                                name="amount"
                                value={form.amount}
                                onChange={handleInputChange}
                                step="0.01"
                                min="0"
                            />
                        </label>
                    </div>

                    <div className="form-group">
                        <label>
                            Devise<br />
                            <select 
                                name="currency"
                                value={form.currency}
                                onChange={handleInputChange}
                            >
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                            </select>
                        </label>
                    </div>

                    <div className="form-group">
                        <label>
                            Date *<br />
                            <input
                                type="date"
                                name="date"
                                value={form.date}
                                onChange={handleInputChange}
                            />
                        </label>
                    </div>

                    <div className="form-group">
                        <label>
                            Catégorie *<br />
                            <input
                                type="text"
                                name="category"
                                value={form.category}
                                onChange={handleInputChange}
                                placeholder="Courses, Logement, Transport, ..."
                            />
                        </label>
                    </div>

                    <div className="form-group">
                        <label>
                            Moyen de paiement<br />
                            <input
                                type="text"
                                name="paymentMethod"
                                value={form.paymentMethod}
                                onChange={handleInputChange}
                                placeholder="Carte, Espèces, Virement, ..."
                            />
                        </label>
                    </div>

                    <div className="form-group">
                        <label>
                            Description<br />
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleInputChange}
                                rows={2}
                            />
                        </label>
                    </div>

                    <button type="submit" className="btn">Enregistrer la dépense</button>
                </form>
            </Card>

            <Card>
                {expenses.length === 0 ? (
                    <p>Aucune dépense pour le moment.</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {expenses.map((expense) => (
                            <Card key={expense.id}>
                                <div className="list-item-title">
                                    {expense.category} — {expense.amount} {expense.currency}
                                </div>

                                <div className="list-item-meta">
                                    Date : {expense.date}
                                </div>

                                <div className="list-item-meta">
                                    Moyen de paiement : {expense.paymentMethod}
                                </div>

                                {expense.description && (
                                    <div className="list-item-meta">
                                        Description : {expense.description}
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    )
}

export default ExpensesPage;