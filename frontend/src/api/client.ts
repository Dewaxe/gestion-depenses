const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    throw new Error("VITE_API_URL n'est pas définie dans le fichier .env");
}

type ApiError = {
    error?: string;
    message?: string;
}

type ApiFetchOptions = RequestInit & {
    auth?: boolean;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
    const url = API_URL + path;

    const { auth = true, headers, ...restOptions } = options;

    const finalHeaders: HeadersInit = {
        "Content-Type": "application/json",
        ...(headers || {}),
    };

    if (auth) {
        const token = localStorage.getItem("authToken");
        if (token) {
            (finalHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
        }
    }

    const response = await fetch(url, {
        ...restOptions,
        headers: finalHeaders,
    });

    if (!response.ok) {
        let errorMessage = `Erreur API (status ${response.status})`
        
        try {
            const errorData: ApiError = await response.json();
            if (errorData.error || errorData.message) {
                errorMessage = errorData.error || errorData.message || errorMessage;
            }
        } catch {
        }

        const error = new Error(errorMessage) as Error & { status?: number };
        error.status = response.status;
        throw error;
    }
    
    if (response.status === 204) {
        return null as T;
    }

    const data = await response.json();
    
    return data as T;
}