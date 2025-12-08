import React, { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "../api/authApi";

interface AuthState {
    user: authApi.AuthUser | null;
    token: string | null;
    isLoading: boolean;
}

interface AuthContextValue extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_TOKEN_KEY = "authToken";
const STORAGE_USER_KEY = "authUser";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<authApi.AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
        const storedUser = localStorage.getItem(STORAGE_USER_KEY);

        if (storedToken && storedUser) {
        try {
            const parsedUser = JSON.parse(storedUser) as authApi.AuthUser;
            setToken(storedToken);
            setUser(parsedUser);
        } catch {
            localStorage.removeItem(STORAGE_TOKEN_KEY);
            localStorage.removeItem(STORAGE_USER_KEY);
        }
        }
        setIsLoading(false);
    }, []);

    function persistAuth(token: string, user: authApi.AuthUser) {
        setToken(token);
        setUser(user);
        localStorage.setItem(STORAGE_TOKEN_KEY, token);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    }

    const handleLogin = async (email: string, password: string) => {
        const res = await authApi.login(email, password);
        persistAuth(res.token, res.user);
    };

    const handleRegister = async (email: string, password: string) => {
        const res = await authApi.register(email, password);
        persistAuth(res.token, res.user);
    };

    const handleLogout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
    };

    const value: AuthContextValue = {
        user,
        token,
        isLoading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
}
