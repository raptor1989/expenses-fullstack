import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

const AUTH_ATTEMPT_PATHS = ['/users/login', '/users/register'];

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // A 401 means the session is gone — send the user to the login page. Wrong credentials on
        // the login/register forms are also 401s, but those must stay on the page so the form can
        // show the API message instead of reloading it away.
        const requestPath: string = error.config?.url ?? '';
        const isAuthAttempt = AUTH_ATTEMPT_PATHS.some((path) => requestPath.endsWith(path));
        if (error.response?.status === 401 && !isAuthAttempt && window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

interface ApiErrorBody {
    message?: unknown;
    details?: unknown;
}

// Body of a 4xx API response; null for 5xx, network failures and non-axios errors,
// which must keep a generic message instead of exposing server internals.
function getClientErrorBody(error: unknown): { status: number; body: ApiErrorBody } | null {
    if (!axios.isAxiosError(error) || !error.response) return null;
    const { status, data } = error.response;
    if (status < 400 || status >= 500 || !data || typeof data !== 'object') return null;
    return { status, body: data as ApiErrorBody };
}

function getDetailMessages(body: ApiErrorBody): Record<string, string> {
    if (!body.details || typeof body.details !== 'object') return {};
    return Object.fromEntries(
        Object.entries(body.details).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    );
}

/** The server's explanation for a 4xx (detail messages, else `message`); `fallback` for anything else. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
    const clientError = getClientErrorBody(error);
    if (!clientError) return fallback;
    const details = Object.values(getDetailMessages(clientError.body));
    if (details.length > 0) return details.join('; ');
    const { message } = clientError.body;
    return typeof message === 'string' && message ? message : fallback;
}

/** Per-field messages from a 400 `details` object, keyed like the request fields (for Formik `setErrors`). */
export function getApiFieldErrors(error: unknown): Record<string, string> {
    const clientError = getClientErrorBody(error);
    if (!clientError || clientError.status !== 400) return {};
    return getDetailMessages(clientError.body);
}

export default api;
