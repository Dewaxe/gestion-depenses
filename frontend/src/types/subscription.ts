export type Subscription = {
    id: number;
    name: string;
    price: number;
    currency: string;
    frequency: string;
    nextBillingDate: string;
    description: string;
};

export type SubscriptionInput = {
    name: string;
    price: number;
    currency: string;
    frequency: string;
    nextBillingDate: string;
    description: string;
};
