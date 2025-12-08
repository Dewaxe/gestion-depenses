import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function Navbar() {
    const { user, logout } = useAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogoutClick = () => setShowLogoutConfirm(true);
    const confirmLogout = () => {
        logout();
        setShowLogoutConfirm(false);
    };
    const cancelLogout = () => setShowLogoutConfirm(false);

    return (
        <header className="app-header">
            <div className="app-header-inner">
                <div className="app-header-spacer" />

                <nav className="app-nav">
                    <NavLink to="/" end className="app-nav-link">
                        Accueil
                    </NavLink>
                    <NavLink to="/expenses" className="app-nav-link">
                        Dépenses
                    </NavLink>
                    <NavLink to="/subscriptions" className="app-nav-link">
                        Abonnements
                    </NavLink>
                </nav>

                <div className="app-user">
                    {user && (
                        <>
                            <button type="button" className="app-logout-button" onClick={handleLogoutClick}>
                                Se déconnecter
                            </button>
                        </>
                    )}
                </div>
            </div>
            {showLogoutConfirm && (
            <div className="modal-overlay">
                <div className="modal">
                <p>Voulez-vous vraiment vous déconnecter ?</p>
                <div className="modal-actions">
                    <button onClick={cancelLogout}>Annuler</button>
                    <button onClick={confirmLogout}>Se déconnecter</button>
                </div>
                </div>
            </div>
            )}

        </header>
        
    );
}

export default Navbar;
