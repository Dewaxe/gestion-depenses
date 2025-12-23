import { apiFetch } from "./client";
import type { AnalysisParams, AnalysisResponse } from "../types/analysis";

export async function getAnalysis(params: AnalysisParams = {}): Promise<AnalysisResponse> {
    const search = new URLSearchParams();

    if (params.months) search.set("months", String(params.months));
    if (params.endMonth) search.set("endMonth", params.endMonth);

    const qs = search.toString();
    return apiFetch<AnalysisResponse>(`/api/analysis${qs ? `?${qs}` : ""}`);
}
