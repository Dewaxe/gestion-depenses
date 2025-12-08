import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./AuthContext";

const LoginPage: React.FC = () => {
    const { login, isLoading, user } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    React.useEffect(() => {
        if (!isLoading && user) {
            navigate("/");
        }
    }, [isLoading, user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await login(email, password);
            navigate("/");
        } catch (err: any) {
            setError(err.message || "Erreur lors de la connexion");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="auth-title">Connexion</h1>
                <p className="auth-subtitle">
                    Accède à ton tableau de bord et à tes dépenses.
                </p>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label className="auth-label">Email</label>
                        <input
                            className="auth-input"
                            type="email"
                            value={email}
                            autoComplete="email"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label className="auth-label">Mot de passe</label>
                        <input
                            className="auth-input"
                            type="password"
                            value={password}
                            autoComplete="current-password"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="auth-error">{error}</p>}

                    <button className="auth-button" type="submit" disabled={submitting}>
                        {submitting ? "Connexion..." : "Se connecter"}
                    </button>
                </form>

                <p className="auth-switch">
                    Pas encore de compte ? <Link to="/register">Créer un compte</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
