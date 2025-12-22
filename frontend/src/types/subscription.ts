export type Subscription = {
    id: number;
    name: string;
    amount: number;
    currency: string;
    billing_period: string;
    nextBillingDate: string;
    description: string;
};

export type SubscriptionInput = {
    name: string;
    amount: number;
    currency: string;
    billing_period: string;
    nextBillingDate: string;
    description: string;
};
