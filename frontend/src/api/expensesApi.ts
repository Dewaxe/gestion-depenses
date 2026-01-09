import { apiFetch } from "./client";
import { type Expense, type ExpenseInput } from "../types/expense";

export async function getExpenses(month?: string): Promise<Expense[]> {
    const query = month ? `?month=${encodeURIComponent(month)}` : "";
    return apiFetch<Expense[]>(`/api/expenses${query}`);
}

export async function createExpense(payload: ExpenseInput): Promise<Expense> {
    return apiFetch<Expense>("/api/expenses", {
        method: "POST",
        body: JSON.stringify(payload),
    })
}

export async function updateExpense(id: number, payload: ExpenseInput): Promise<Expense> {
    return apiFetch(`/api/expenses/${id}`, {
        method: "PUT",
        body:JSON.stringify(payload),
    })
}

export async function deleteExpense (id: number): Promise<void> {
    await apiFetch(`/api/expenses/${id}`, {
        method: "DELETE",
    })
}