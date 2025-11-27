import { useEffect, useState } from "react";

type Expense = {
    id: number;
    amount: number;
    currency: string;
    date: string;
    category: string;
    paymentMethod: string;
    description: string;
}

function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);

    useEffect(() => {
        async function fetchExpenses() {
            try {
                const response = await fetch("http://localhost:3000/api/expenses");
                const data = await response.json();
                setExpenses(data);
            } catch (error) {
                console.error("Erreur fetch expenses:", error);
            }
        }

        fetchExpenses();
    }, []);

    return (
        <div>
            <h1>Dépenses</h1>

            {expenses.length === 0 ? (
                <p>Aucune dépense pour le moment.</p>
            ) : (
                <ul>
                    {expenses.map((expense) => (
                        <li key={expense.id} style={{marginBottom: "1rem"}}>
                            <strong>{expense.category}</strong> - {expense.amount} {expense.currency}<br />
                            <small>Date : {expense.date}</small><br />
                            <small>Moyen de paiement : {expense.paymentMethod}</small><br />
                            {expense.description && (
                                <small>Description : {expense.description}</small>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default ExpensesPage;