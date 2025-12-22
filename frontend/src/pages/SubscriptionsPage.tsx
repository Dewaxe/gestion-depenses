import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { type Subscription, type SubscriptionInput } from "../types/subscription";
import { getSubscriptions, createSubscription, updateSubscription, deleteSubscription } from "../api/subscriptionsApi";
import Card from "../components/Card";
import PageTitle from "../components/PageTitle";

type SubscriptionFormState = {
    name: string;
    amount: string;
    currency: string;
    billing_period: string;
    nextBillingDate: string;
    description: string;
};

const INITIAL_FORM_STATE: SubscriptionFormState = {
    name: "",
    amount: "",
    currency: "EUR",
    billing_period: "monthly",
    nextBillingDate: "",
    description: "",
};

type ModalMode = "create" | "edit";

function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [form, setForm] = useState<SubscriptionFormState>(INITIAL_FORM_STATE);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<ModalMode>("create");
    const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
    

    useEffect(() => {
        fetchSubscriptions();
    }, []);
    
    async function fetchSubscriptions() {
        try {
            setLoading(true);
            const data = await getSubscriptions();
            setSubscriptions(data);
            setError(null);
        } catch (err) {
            console.error("Erreur chargement abonnements:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Erreur lors du chargement des abonnements."
            );
        } finally {
            setLoading(false);
        }
    }

    function openCreateModal() {
        setModalMode("create");
        setEditingSubscription(null);
        setForm({
            name: "",
            amount: "",
            currency: "EUR",
            billing_period: "",
            nextBillingDate: "",
            description: "",
        })
        setFormError(null);
        setIsModalOpen(true);
    }

    function openEditModal(subscription: Subscription) {
        setModalMode("edit");
        setEditingSubscription(subscription);
        setForm({
            name: subscription.name,
            amount: String(subscription.amount),
            currency: subscription.currency,
            billing_period: subscription.billing_period,
            nextBillingDate: subscription.nextBillingDate,
            description: subscription.description || "",
        })
        setFormError(null);
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setEditingSubscription(null);
        setFormError(null);
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

        if (!form.name || !form.amount || !form.billing_period || !form.nextBillingDate) {
            setFormError("Les champs nom, prix, fréquence et prochaine échéance sont obligatoires.");
            return;
        }

        const amountNumber = Number(form.amount);
        if (Number.isNaN(amountNumber) || amountNumber <= 0) {
            setFormError("Le prix doit être positif.");
            return;
        }

        const payload: SubscriptionInput = {
            name: form.name,
            amount: amountNumber,
            currency: form.currency || "EUR",
            billing_period: form.billing_period,
            nextBillingDate: form.nextBillingDate,
            description: form.description || "",
        };

        try {
            setFormSubmitting(true);
            if (modalMode === "create") {
                const created = await createSubscription(payload);
                setSubscriptions((prev) => [created, ...prev]);
            } else if (modalMode === "edit" && editingSubscription) {
                const updated = await updateSubscription(editingSubscription.id, payload);
                setSubscriptions((prev) =>
                prev.map((exp) => (exp.id === updated.id ? updated : exp))
                );
            }

            closeModal();
        } catch (err) {
            console.error("Erreur submit abonnement:", err);
            setFormError(
                err instanceof Error
                ? err.message
                : "Erreur lors de l'enregistrement de l'abonnement."
            );
        } finally {
            setFormSubmitting(false);
        }
    }

    async function handleDelete(subscription: Subscription) {
        const confirmed = window.confirm(
            `Supprimer l'abonnement "${subscription.name}" ?`
        );
        if (!confirmed) return;

        try {
            await deleteSubscription(subscription.id);
            setSubscriptions((prev) => prev.filter((s) => s.id !== subscription.id));
        } catch (err) {
            console.error("Erreur suppression abonnement:", err);
            alert(
            "Erreur lors de la suppression de l'abonnement. Consultez la console pour plus de détails."
            );
        }
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-title">
                    <PageTitle title="Abonnements" />
                </div>
                <div className="page-header-action">
                    <button type="button" className="btn" onClick={openCreateModal}>
                        + Ajouter un abonnement
                    </button>
                </div>
            </div>

            {loading && <p>Chargement des abonnements...</p>}

            {error && (
                <Card>
                    <p className="error-text">{error}</p>
                </Card>
            )}

            {!loading && !error && (
                <Card>
                    <h2 className="subscriptions-list-title">Liste des abonnements</h2>

                    {subscriptions.length === 0 ? (
                        <p>Aucun abonnement pour le moment.</p>
                    ) : (
                        <div className="subscriptions-list">
                            {subscriptions.map((subscription) => (
                                <Card key={subscription.id}>
                                    <div className="subscription-card-header">
                                        <div>
                                            <div className="list-item-title">
                                                {subscription.name} — {subscription.amount}{" "}
                                                {subscription.currency}
                                            </div>
                                            <div className="list-item-meta">
                                                Fréquence : {subscription.billing_period} — Prochaine échéance :{" "}
                                                {subscription.nextBillingDate}
                                            </div>
                                                {subscription.description && (
                                            <div className="list-item-meta">
                                                {subscription.description}
                                            </div>
                                            )}
                                        </div>
                                        <div>
                                            <button
                                                type="button"
                                                className="icon-button"
                                                onClick={() => openEditModal(subscription)}
                                                aria-label="Modifier l'abonnement"
                                                title="Modifier"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                type="button"
                                                className="icon-button"
                                                onClick={() => handleDelete(subscription)}
                                                aria-label="Supprimer l'abonnement"
                                                title="Supprimer"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2 className="modal-title">
                            {modalMode === "create"
                            ? "Ajouter un abonnement"
                            : "Modifier l'abonnement"}
                        </h2>

                        {formError && (
                            <p className="error-text--spaced">{formError}</p>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="name">Nom *</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={form.name}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="amount">Prix *</label>
                                <input
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.amount}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="currency">Devise</label>
                                <input
                                    id="currency"
                                    name="currency"
                                    type="text"
                                    value={form.currency}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="billing_period">Fréquence *</label>
                                <input
                                    id="billing_period"
                                    name="billing_period"
                                    type="text"
                                    value={form.billing_period}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="nextBillingDate">Prochaine échéance *</label>
                                <input
                                    id="nextBillingDate"
                                    name="nextBillingDate"
                                    type="date"
                                    value={form.nextBillingDate}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={form.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={closeModal}
                                    disabled={formSubmitting}
                                >
                                    Annuler
                                </button>
                                <button type="submit" className="btn" disabled={formSubmitting}>
                                    {formSubmitting
                                    ? "Enregistrement..."
                                    : modalMode === "create"
                                    ? "Enregistrer"
                                    : "Mettre à jour"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                )}
        </div>
    );
}

export default SubscriptionsPage;
