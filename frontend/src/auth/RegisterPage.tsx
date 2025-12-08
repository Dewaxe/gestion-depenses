import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./AuthContext";

const RegisterPage: React.FC = () => {
    const { register, isLoading, user } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
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

        if (password !== passwordConfirm) {
            setError("Les mots de passe ne correspondent pas.");
        return;
        }

        setSubmitting(true);
        try {
            await register(email, password);
            navigate("/");
        } catch (err: any) {
            setError(err.message || "Erreur lors de l'inscription");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-container">
            <h1>Créer un compte</h1>
            <form onSubmit={handleSubmit} className="auth-form">
                <label>
                    Email
                    <input
                        type="email"
                        value={email}
                        autoComplete="email"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </label>

                <label>
                    Mot de passe
                    <input
                        type="password"
                        value={password}
                        autoComplete="new-password"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </label>

                <label>
                    Confirmer le mot de passe
                    <input
                        type="password"
                        value={passwordConfirm}
                        autoComplete="new-password"
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        required
                    />
                </label>

                {error && <p className="auth-error">{error}</p>}

                <button type="submit" disabled={submitting}>
                    {submitting ? "Création..." : "Créer le compte"}
                </button>
            </form>

            <p className="auth-switch">
                Déjà un compte ? <Link to="/login">Se connecter</Link>
            </p>
        </div>
    );
};

export default RegisterPage;
