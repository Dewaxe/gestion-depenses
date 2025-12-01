export type Expense = {
    id: number;
    amount: number;
    currency: string;
    date: string;
    category: string;
    paymentMethod: string;
    description: string;
};

export type ExpenseInput = {
    amount: number;
    currency: string;
    date: string;
    category: string;
    paymentMethod: string;
    description: string;
};
