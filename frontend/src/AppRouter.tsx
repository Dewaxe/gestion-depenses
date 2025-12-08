import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import LoginPage from "./auth/LoginPage";
import RegisterPage from "./auth/RegisterPage";
import ProtectedRoute from "./auth/ProtectedRoute";
import HomePage from "./pages/HomePage";
import ExpensesPage from "./pages/ExpensesPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/" element={<App />}>
                    <Route index element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                    <Route path="expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
                    <Route path="subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
