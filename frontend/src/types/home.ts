export type HomeView = "month" | "quarter" | "year";

export type HomeBudget = {
    id: number;
    category: string | null;
    periodLimit: number;
    spent: number;
    remaining: number;
    status: "ok" | "exceeded";
};

export type HomeSubscription = {
    id: number;
    name: string;
    amount: number;
    currency: string;
    billingPeriod: string;
    nextBillingDate: string;
    status: string;
  description?: string;
};

export type HomeExpense = {
    id: number;
    amount: number;
    currency: string;
    date: string;
    category: string;
    description?: string;
    paymentMethod?: string;
    source?: "manual" | "subscription";
};

export type HomeResponse = {
    view: HomeView;
    label: string;
    meta: { year?: number; quarter?: number } | null;
    range: { from: string; to: string };
    totals: { revenues: number; expenses: number; balance: number };
    upcomingSubscriptions: HomeSubscription[];
    recentExpenses: HomeExpense[];
    budgets: HomeBudget[] | null;
    generatedAt: string;
};
