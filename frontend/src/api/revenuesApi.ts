import { apiFetch } from "./client";
import { type Revenue, type RevenueInput } from "../types/revenue";

export async function getRevenues(month?: string): Promise<Revenue[]> {
    const query = month ? `?month=${encodeURIComponent(month)}` : "";
    return apiFetch<Revenue[]>(`/api/revenues${query}`);
}

export async function createRevenue(payload: RevenueInput): Promise<Revenue> {
    return apiFetch<Revenue>("/api/revenues", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateRevenue(id: number, payload: RevenueInput): Promise<Revenue> {
    return apiFetch<Revenue>(`/api/revenues/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function deleteRevenue(id: number): Promise<void> {
    await apiFetch(`/api/revenues/${id}`, {
        method: "DELETE",
    });
}
