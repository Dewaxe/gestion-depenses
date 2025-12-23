import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function Sidebar() {
    const { user, logout } = useAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogoutClick = () => setShowLogoutConfirm(true);
    const confirmLogout = () => {
        logout();
        setShowLogoutConfirm(false);
    };
    const cancelLogout = () => setShowLogoutConfirm(false);

    return (
        <aside className="app-sidebar">
            <div className="app-sidebar-inner">
                <div className="app-sidebar-brand">
                    Eco Buddy
                </div>

                <nav className="app-sidebar-nav">
                    <NavLink to="/" end className="app-sidebar-link">
                        Accueil
                    </NavLink>
                    <NavLink to="/analysis" className="app-sidebar-link">
                        Analyse
                    </NavLink>
                    <NavLink to="/expenses" className="app-sidebar-link">
                        Dépenses
                    </NavLink>
                    <NavLink to="/subscriptions" className="app-sidebar-link">
                        Abonnements
                    </NavLink>
                    <NavLink to="/revenues" className="app-sidebar-link">
                        Revenus
                    </NavLink>
                </nav>

                <div className="app-sidebar-user">
                    {user && (
                        <button
                            type="button"
                            className="app-logout-button"
                            onClick={handleLogoutClick}
                        >
                            Se déconnecter
                        </button>
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
        </aside>
    );
}

export default Sidebar;
