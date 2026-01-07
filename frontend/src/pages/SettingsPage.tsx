import { LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import "../styles/pages/SettingsPage.css";
import { useState } from "react";

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogoutClick = () => setShowLogoutConfirm(true);
    const confirmLogout = () => {
        logout();
        setShowLogoutConfirm(false);
    };
    const cancelLogout = () => setShowLogoutConfirm(false);

    return (
        <div className="settings-page">
            <h1>Paramètres</h1>
            <p className="settings-subtitle">Gestion du compte</p>

            <div className="settings-card">
                {user && (
                    <button className="logout-button" onClick={handleLogoutClick}>
                        <LogOut size={16} />
                        Se déconnecter
                    </button>
                )}
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
        </div>
    );
}
