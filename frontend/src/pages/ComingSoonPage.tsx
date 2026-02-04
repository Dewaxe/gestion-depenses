import "../styles/pages/ComingSoonPage.css";

function ComingSoonPage() {
    return (
        <div className="comingsoon">
            <div className="comingsoon-card">
                <h1 className="comingsoon-title">Application bientôt disponible</h1>

                <p className="comingsoon-text">
                    Le projet est en cours de développement.
                    <br />
                    Vous pouvez suivre l’évolution sur GitHub, ou voir un aperçu des maquettes.
                </p>

                <div className="comingsoon-actions">
                    <a
                        className="comingsoon-btn comingsoon-btn-primary"
                        href="https://github.com/Dewaxe/gestion-depenses"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Suivre le projet sur GitHub
                    </a>

                    <a
                        className="comingsoon-btn comingsoon-btn-secondary"
                        href="/mockups"
                    >
                        Voir les maquettes
                    </a>
                </div>

                <div className="comingsoon-footnote">
                    Merci pour votre visite 🙂
                </div>
            </div>
        </div>
    );
}

export default ComingSoonPage;
