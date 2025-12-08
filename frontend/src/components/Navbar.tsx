import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function Navbar() {
    const { user, logout } = useAuth();

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
                            {/* <span className="app-user-email">{user.email}</span> */}
                            <button type="button" className="app-logout-button" onClick={logout}>
                                Se déconnecter
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Navbar;
