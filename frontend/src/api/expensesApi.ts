import { apiFetch } from "./client";
import { type Expense, type NewExpensePayload } from "../types/expense";

export async function getExpenses(): Promise<Expense[]> {
    return apiFetch<Expense[]>("/api/expenses");    
}

export async function createExpense(payload: NewExpensePayload): Promise<Expense> {
    return apiFetch<Expense>("/api/expenses", {
        method: "POST",
        body: JSON.stringify(payload),
    })
}