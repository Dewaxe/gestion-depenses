import { Outlet, Link } from "react-router-dom";

function App() {
  return (
    <div>
      <header
        style={{
          backgroundColor: "white",
          borderBottom: "1px solid #ddd",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "1rem 1rem",
          }}
        >
          <nav
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "2rem",
              fontSize: "1.1rem",
            }}
          >
            <Link to="/">Accueil</Link>
            <Link to="/expenses">Dépenses</Link>
            <Link to="/subscriptions">Abonnements</Link>
          </nav>
        </div>
      </header>

      <main
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "2rem 1rem 4rem 1rem",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default App;
