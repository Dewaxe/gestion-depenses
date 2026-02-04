import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import LoginPage from "./auth/LoginPage";
import RegisterPage from "./auth/RegisterPage";
import ProtectedRoute from "./auth/ProtectedRoute";
import HomePage from "./pages/HomePage";
import ExpensesPage from "./pages/ExpensesPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import AnalysisPage from "./pages/AnalysisPage";
import RevenuesPage from "./pages/RevenuesPage";
import SettingsPage from "./pages/SettingsPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import MockupsPage from "./pages/MockupsPage";

export function AppRouter() {
    const isMaintenance = import.meta.env.VITE_MAINTENANCE === "true";

    if (isMaintenance) {
        return (
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<ComingSoonPage />} />
                    <Route path="/mockups" element={<MockupsPage />} />
                    <Route path="*" element={<ComingSoonPage />} />
                </Routes>
            </BrowserRouter>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/" element={<App />}>
                    <Route index element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                    <Route path="analysis" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
                    <Route path="expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
                    <Route path="subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
                    <Route path="revenues" element={<ProtectedRoute><RevenuesPage /></ProtectedRoute>} />
                    {/* <Route path="import" element={<ProtectedRoute><ImportPage /></ProtectedRoute>} /> */}
                    <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
