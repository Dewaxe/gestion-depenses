export type Expense = {
    id: number;
    amount: number;
    currency: string;
    date: string;
    category: string;
    paymentMethod: string;
    description: string;
};

export type NewExpensePayload = {
    amount: number;
    currency: string;
    date: string;
    category: string;
    paymentMethod: string;
    description: string;
};
