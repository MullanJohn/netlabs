// Shared HTTP core for all NetLabs API access (catalog + quiz).
// Owns the base URL and maps responses to typed ApiError kinds.

export const API_BASE_URL =
    import.meta.env.PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export type ApiErrorKind = "notFound" | "client" | "server" | "network";

export class ApiError extends Error {
    constructor(
        readonly kind: ApiErrorKind,
        readonly status?: number,
    ) {
        super(`API request failed (${kind}${status ? ` ${status}` : ""})`);
        this.name = "ApiError";
    }
}

export function transportErrorMessage(error: unknown): string | null {
    if (error instanceof ApiError) {
        if (error.kind === "network") {
            return "Couldn't reach the server. Please try again.";
        }
        if (error.kind === "server") {
            return "The server had a problem. Please try again.";
        }
    }
    return null;
}

type RequestOptions = {
    method?: "GET" | "POST";
    body?: unknown;
    signal?: AbortSignal;
};

export async function apiFetch<T>(
    path: string,
    options: RequestOptions = {},
): Promise<T> {
    const { method = "GET", body, signal } = options;

    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            signal,
            headers:
                body === undefined
                    ? undefined
                    : { "Content-Type": "application/json" },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch (error) {
        if (signal?.aborted) throw error; // caller cancelled (e.g. unmount)
        throw new ApiError("network");
    }

    if (response.ok) {
        return (await response.json()) as T;
    }
    if (response.status === 404) {
        throw new ApiError("notFound", 404);
    }
    throw new ApiError(
        response.status >= 500 ? "server" : "client",
        response.status,
    );
}
