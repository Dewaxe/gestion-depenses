import { useNavigate } from "react-router-dom";
import "../styles/pages/MockupsPage.css";

const mockups = [
    { src: "/mockups/Template-Connexion.png", title: "Login" },
    { src: "/mockups/Template-Inscription.png", title: "Inscription" },
    { src: "/mockups/Template-Accueil.png", title: "Accueil" },
    { src: "/mockups/Template-Accueil-Mobile.png", title: "Accueil (Mobile)" },
    { src: "/mockups/Template-Abonnements.png", title: "Abonnements" },
    { src: "/mockups/Template-Dépenses.png", title: "Dépenses" },
    { src: "/mockups/Template-Revenus.png", title: "Revenus" },
    { src: "/mockups/Template-Analyse.png", title: "Analyse" },
    { src: "/mockups/Template-Paramètres-1sur2.png", title: "Paramètres (1/2)" },
    { src: "/mockups/Template-Paramètres-2sur2.png", title: "Paramètres (2/2)" },
    { src: "/mockups/Template-Import.png", title: "Import" },
];

function MockupsPage() {
    const navigate = useNavigate();

    return (
        <div className="mockups-page">
            <div className="mockups-inner">
                <div className="mockups-header">
                    <button
                        type="button"
                        className="mockups-back"
                        onClick={() => navigate(-1)}
                        aria-label="Retour à la page précdente"
                    >
                        ← Retour
                    </button>
                    <h1 className="mockups-title">Aperçu de l'application</h1>
                </div>

                <p className="mockups-subtitle">
                    Voici quelques maquettes pour donner une idée de l'interface et des fonctionnalitÃ©s.
                </p>

                <div className="mockups-grid">
                    {mockups.map((mockup) => (
                        <a
                            key={mockup.src}
                            href={mockup.src}
                            target="_blank"
                            rel="noreferrer"
                            className="mockup-card"
                        >
                            <img src={mockup.src} alt={mockup.title} />
                            <span>{mockup.title}</span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default MockupsPage;
