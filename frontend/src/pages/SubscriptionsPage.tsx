import { useEffect, useState } from "react";

type Subscription = {
    id: number;
    name: string;
    price: number;
    currency: string;
    frequency: string;
    nextBillingDate: string;
    description: string;
};

function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

    useEffect(() => {
        async function fetchSubscriptions() {
            try {
                const response = await fetch("http://localhost:3000/api/subscriptions");
                const data = await response.json();
                setSubscriptions(data)
            } catch (error) {
                console.error("Erreur fetch subscriptions:", error);
            }
        }

        fetchSubscriptions();
    }, []);

    return (
        <div>
            <h1>Abonnements</h1>
            
            {subscriptions.length === 0 ? (
                <p>Aucun abonnement pour le moment.</p>
            ) : (
                <ul>
                    {subscriptions.map((sub) => (
                        <li key={sub.id} style={{marginBottom: "1rem"}}>
                            <strong>{sub.name}</strong> - {sub.price} {sub.currency} ({sub.frequency})<br />
                            <small>Prochaine échéance : {sub.nextBillingDate}</small><br />
                            {sub.description && (
                                <small>Description : {sub.description}</small>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default SubscriptionsPage;
