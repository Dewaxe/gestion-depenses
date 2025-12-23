export type AnalysisParams = {
    months?: 3 | 6 | 12;
    endMonth?: string; // YYYY-MM
};

export type AnalysisResponse = {
    period: {
        months: number;
        from: string;
        to: string;
        labels: string[]; // ["2025-07", ...]
    };
    expensesTrend: {
        series: { category: string; totals: number[] }[];
    };
    kpis: {
        peak: { month: string; total: number };
        min: { month: string; total: number };
        avgMonthly: { value: number; months: number };
        topCategory: { category: string | null; total: number; sharePercent: number };
        subscriptionShare: { percent: number; trend: "stable" | "up" | "down" };
    };
    budgetHistory: {
        ruleId: number;
        category: string | null;
        monthlyLimit: number;
        months: { month: string; status: "ok" | "exceeded"; spent: number }[];
        summary: { okCount: number; exceededCount: number };
    }[];
    comparisons: {
        vsLastMonth: { percent: number; direction: "up" | "down" };
        vsAverage: { percent: number; direction: "up" | "down" };
    };
};
