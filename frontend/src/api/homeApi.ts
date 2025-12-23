import { apiFetch } from "./client";
import type { HomeResponse, HomeView } from "../types/home";

type HomeParams =
    | { view: "month"; month: string }
    | { view: "quarter"; year: number; quarter: 1 | 2 | 3 | 4 }
    | { view: "year"; year: number }
    | { view?: HomeView; month?: string; year?: number; quarter?: number };

export async function getHome(params: HomeParams = {}): Promise<HomeResponse> {
    const search = new URLSearchParams();

    if (params.view) search.set("view", params.view);

    if (params.view === "month" && "month" in params && params.month) {
        search.set("month", params.month);
    }

    if (params.view === "quarter" && "year" in params && "quarter" in params) {
        search.set("year", String(params.year));
        search.set("quarter", String(params.quarter));
    }

    if (params.view === "year" && "year" in params) {
        search.set("year", String(params.year));
    }

    const qs = search.toString();
    return apiFetch<HomeResponse>(`/api/home${qs ? `?${qs}` : ""}`);
}
