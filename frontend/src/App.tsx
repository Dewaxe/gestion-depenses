import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";

function App() {
    return (
        <div className="app-root">
            <Sidebar />
            <main className="app-main">
                <Outlet />
            </main>
        </div>
    );
}

export default App;
