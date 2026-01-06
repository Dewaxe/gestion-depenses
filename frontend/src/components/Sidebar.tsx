import { useState, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    Home,
    Repeat2,
    CreditCard,
    TrendingUp,
    BarChart2,
    Settings,
    ChevronDown,
    UserCircle2,
} from "lucide-react";
import "./Sidebar.css";

function Sidebar() {
    const location = useLocation();

    const isOnFluxRoute = useMemo(() => {
        return (
            location.pathname.startsWith("/expenses") ||
            location.pathname.startsWith("/revenues") ||
            location.pathname.startsWith("/subscriptions")
        );
    }, [location.pathname]);

    const [isFluxOpen, setIsFluxOpen] = useState<boolean>(isOnFluxRoute);

    return (
        <aside className="sidebar">
            {/* Header */}
            <div className="sidebar__header">
                <div className="sidebar__avatar" aria-hidden="true">
                    <UserCircle2 size={34} />
                </div>

                <div className="sidebar__identity">
                    <div className="sidebar__name">Eco Buddy</div>
                    {/* <div className="sidebar__plan">UserName</div> */}
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar__nav">
                <NavLink to="/" end className={({ isActive }) => (isActive ? "sidebar__item is-active" : "sidebar__item")}>
                    <Home size={18} />
                    <span>Accueil</span>
                </NavLink>

                {/* Flux */}
                <NavLink
                    to="/expenses"
                    className={({ isActive }) =>
                        ["sidebar__item", "sidebar__flux", isOnFluxRoute ? "is-active" : "", isActive ? "is-active" : ""].join(" ")
                    }
                    onClick={() => {
                        if (!isOnFluxRoute) setIsFluxOpen(true);
                    }}
                >
                    <Repeat2 size={18} />
                    <span>Flux</span>

                    <button
                        type="button"
                        className="sidebar__chevronBtn"
                        aria-label={isFluxOpen ? "Réduire Flux" : "Déplier Flux"}
                        onClick={(e) => {
                        e.preventDefault(); // empêche la navigation du NavLink
                        e.stopPropagation();

                        setIsFluxOpen((v) => !v);
                        }}
                    >
                        <ChevronDown
                            size={18}
                            className={isFluxOpen ? "sidebar__chevron is-open" : "sidebar__chevron"}
                        />
                    </button>
                </NavLink>

                <div className={isFluxOpen ? "sidebar__subnav is-open" : "sidebar__subnav"}>
                    <NavLink
                        to="/expenses"
                        className={({ isActive }) => (isActive ? "sidebar__subitem is-active" : "sidebar__subitem")}
                    >
                        <CreditCard size={16} />
                        <span>Dépenses</span>
                    </NavLink>

                    <NavLink
                        to="/revenues"
                        className={({ isActive }) => (isActive ? "sidebar__subitem is-active" : "sidebar__subitem")}
                    >
                        <TrendingUp size={16} />
                        <span>Revenus</span>
                    </NavLink>

                    <NavLink
                        to="/subscriptions"
                        className={({ isActive }) => (isActive ? "sidebar__subitem is-active" : "sidebar__subitem")}
                    >
                        <Repeat2 size={16} />
                        <span>Abonnements</span>
                    </NavLink>
                </div>

                <NavLink
                    to="/analysis"
                    className={({ isActive }) => (isActive ? "sidebar__item is-active" : "sidebar__item")}
                >
                    <BarChart2 size={18} />
                    <span>Analyse</span>
                </NavLink>
            </nav>

            {/* Footer */}
            <div className="sidebar__footer">
                <NavLink
                    to="/settings"
                    className={({ isActive }) => (isActive ? "sidebar__item is-active" : "sidebar__item")}
                >
                    <Settings size={18} />
                    <span>Paramètres</span>
                </NavLink>
            </div>
        </aside>
    );
}

export default Sidebar;
