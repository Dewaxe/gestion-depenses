export type RevenueType = "one-off" | "recurring";

export type Revenue = {
    id: number;
    amount: number;
    currency: string;
    date: string; // YYYY-MM-DD
    type: RevenueType;
    recurring_template_id?: number | null;
    description: string;
};

export type RevenueInput = {
    amount: number;
    currency?: string;
    date: string; // YYYY-MM-DD
    type?: RevenueType;
    description?: string;
};
