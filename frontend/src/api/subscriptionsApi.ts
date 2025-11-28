import { apiFetch } from "./client";
import { type Subscription, type NewSubscriptionPayload } from "../types/subscription";

export async function getSubscriptions(): Promise<Subscription[]> {
    return apiFetch<Subscription[]>("/api/subscriptions");
}

export async function createSubscription(payload: NewSubscriptionPayload): Promise<Subscription> {
    return apiFetch<Subscription>("/api/subscriptions", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
