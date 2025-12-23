import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";

function App() {
    return (
        <div className="app-root">
            <Navbar />
            <main className="app-main">
                <Outlet />
            </main>
        </div>
    );
}

export default App;
