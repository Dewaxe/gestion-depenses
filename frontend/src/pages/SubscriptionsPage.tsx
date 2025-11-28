import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { type Subscription } from "../types/subscription";
import { getSubscriptions, createSubscription } from "../api/subscriptionsApi";

type NewSubscriptionForm = {
    name: string;
    price: string;
    currency: string;
    frequency: string;
    nextBillingDate: string;
    description: string;
};

const INITIAL_FORM_STATE: NewSubscriptionForm = {
    name: "",
    price: "",
    currency: "EUR",
    frequency: "monthly",
    nextBillingDate: "",
    description: "",
};

function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [form, setForm] = useState<NewSubscriptionForm>(INITIAL_FORM_STATE);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchSubscriptions();
    }, []);
    
    async function fetchSubscriptions() {
        try {
            const data = await getSubscriptions();
            setSubscriptions(data);
        } catch (error) {
            console.error("Erreur fetch subscriptions:", error);
        }
    }


    function handleInputChange(
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) {
        const { name, value } = event.target;

        setForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);

        if (!form.name || !form.price || !form.frequency || !form.nextBillingDate) {
            setErrorMessage("Les champs nom, prix, fréquence et prochaine échéance sont obligatoires.");
            return;
        }

        const priceNumber = Number(form.price);
        if (Number.isNaN(priceNumber) || priceNumber <= 0) {
            setErrorMessage("Le prix doit être positif.");
            return;
        }

        try {
            const createdSubscription = await createSubscription({
                name: form.name,
                price: priceNumber,
                currency: form.currency || "EUR",
                frequency: form.frequency,
                nextBillingDate: form.nextBillingDate,
                description: form.description || "",
            });

            setSubscriptions((prev) => [createdSubscription, ...prev]);
            setForm(INITIAL_FORM_STATE);
        } catch (error) {
            console.error("Erreur POST /api/subscriptions:", error);
            setErrorMessage(
                error instanceof Error
                ? error.message
                : "Impossible d'enregistrer l'abonnement."
            );
        }
    }

    return (
        <div>
            <section>
                <h1>Abonnements</h1>

                <section style={{ marginBottom: "2rem" }}>
                    <h2>Ajouter un abonnement</h2>

                    {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: "0.5rem" }}>
                            <label>
                                Nom du service *<br />
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleInputChange}
                                    placeholder="Netflix, Spotify, ..."
                                />
                            </label>
                        </div>

                        <div style={{ marginBottom: "0.5rem" }}>
                            <label>
                                Prix *<br />
                                <input
                                    type="number"
                                    name="price"
                                    value={form.price}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                />
                            </label>
                        </div>

                        <div style={{ marginBottom: "0.5rem" }}>
                            <label>
                                Devise<br />
                                <select 
                                    name="currency"
                                    value={form.currency}
                                    onChange={handleInputChange}
                                >
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                </select>
                            </label>
                        </div>

                        <div style={{ marginBottom: "0.5rem" }}>
                            <label>
                                Fréquence *<br />
                                <select 
                                    name="frequency"
                                    value={form.frequency}
                                    onChange={handleInputChange}
                                >
                                    <option value="monthly">Mensuel</option>
                                    <option value="yearly">Annuel</option>
                                </select>
                            </label>
                        </div>

                        <div style={{ marginBottom: "0.5rem" }}>
                            <label>
                                Prochaine échéance *<br />
                                <input
                                    type="date"
                                    name="nextBillingDate"
                                    value={form.nextBillingDate}
                                    onChange={handleInputChange}
                                />
                            </label>
                        </div>

                        <div style={{ marginBottom: "0.5rem" }}>
                            <label>
                                Description<br />
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleInputChange}
                                    rows={2}
                                />
                            </label>
                        </div>

                        <button type="submit">Enregistrer l'abonnement</button>
                    </form>
                </section>
                
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
            </section>
        </div>
    );
}

export default SubscriptionsPage;
