import { apiFetch } from "./client";

export interface AuthUser {
    id: number;
    email: string;
}

export interface AuthResponse {
    token: string;
    user: AuthUser;
}

export async function register(email: string, password: string): Promise<AuthResponse> {
    return apiFetch<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        auth: false,
    });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
    return apiFetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        auth: false,
    });
}
