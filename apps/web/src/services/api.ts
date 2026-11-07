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

export default api;
