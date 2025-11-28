const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    throw new Error("VITE_API_URL n'est pas définie dans le fichier .env");
}

type ApiError = {
    error?: string;
    message?: string;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const url = API_URL + path;

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options && options.headers),
        },
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

        throw new Error(errorMessage);
    }
    
    if (response.status === 204) {
        return null as T;
    }

    const data = await response.json();
    
    return data as T;
}