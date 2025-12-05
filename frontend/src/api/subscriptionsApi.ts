import { apiFetch } from "./client";
import { type Subscription, type SubscriptionInput } from "../types/subscription";

export async function getSubscriptions(): Promise<Subscription[]> {
    return apiFetch<Subscription[]>("/api/subscriptions");
}

export async function createSubscription(payload: SubscriptionInput): Promise<Subscription> {
    return apiFetch<Subscription>("/api/subscriptions", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateSubscription(id: number, payload: SubscriptionInput): Promise<Subscription> {
    return apiFetch(`/api/subscriptions/${id}`, {
        method: "PUT",
        body:JSON.stringify(payload),
    })
}

export async function deleteSubscription(id: number): Promise<void> {
    await apiFetch(`/api/subscriptions/${id}`, {
        method: "DELETE",
    })
}
