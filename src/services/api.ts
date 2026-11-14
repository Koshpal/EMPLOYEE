import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const MAX_RETRY_AFTER_MS = 30_000;

// Only the dev server may fall back to a local API; a production build is checked in vite.config.ts.
export const BASE_URL: string =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api/v1' : '');
if (!BASE_URL) throw new Error('VITE_API_URL is not configured');

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
  _rateLimitRetryCount?: number;
};

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  // withCredentials sends httpOnly cookies automatically — no localStorage needed
  withCredentials: true,
});

// One refresh at a time. A page load fires several requests at once (and the transaction stream refreshes
// on its own); the server accepts one rotation per refresh token, so if each caller refreshed separately,
// all but the first would be refused and the employee would be sent to the login page.
let refreshInFlight: Promise<void> | null = null;
export const refreshSession = (): Promise<void> => {
  refreshInFlight ??= axios
    .post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true, timeout: 15000 })
    .then(() => undefined)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
};

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    if (!originalRequest) return Promise.reject(error);

    const requestUrl = originalRequest.url ?? '';
    const isAuthEndpoint = /\/auth\/(login|refresh|logout)(?:$|\?)/.test(requestUrl);

    // A failed login must stay on the login screen; never try to refresh it.
    // Refresh uses bare axios so it cannot re-enter this interceptor.
    if (error.response?.status === 401 && !originalRequest._authRetry && !isAuthEndpoint) {
      originalRequest._authRetry = true;
      try {
        await refreshSession();
      } catch {
        // Another tab may have refreshed at the same moment (cookies are shared between tabs and the
        // server accepts one refresh per token). If the session is valid now, carry on.
        const stillSignedIn = await axios
          .get(`${BASE_URL}/auth/me`, { withCredentials: true, timeout: 15000 })
          .then(() => true, () => false);
        if (!stillSignedIn) {
          try {
            localStorage.removeItem('user');
          } catch {
            /* storage unavailable */
          }
          if (window.location.pathname !== '/login') {
            window.location.assign('/login');
          }
          return Promise.reject(error);
        }
      }
      // Only a failed REFRESH means the session is gone. If the replayed request itself fails (403, 500…),
      // that error belongs to the caller.
      return axiosInstance(originalRequest);
    }

    // Retrying a mutation after a 429 could create duplicate bookings, transactions or feedback.
    // Only retry methods that are safe and idempotent.
    const method = (originalRequest.method ?? 'get').toLowerCase();
    const isSafeMethod = ['get', 'head', 'options'].includes(method);
    if (error.response?.status === 429 && isSafeMethod) {
      const retryCount = originalRequest._rateLimitRetryCount ?? 0;
      if (retryCount < MAX_RETRIES) {
        originalRequest._rateLimitRetryCount = retryCount + 1;
        const retryAfter = Number(error.response.headers?.['retry-after']);
        const delay =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.min(retryAfter * 1000, MAX_RETRY_AFTER_MS)
            : Math.min(RETRY_DELAY * 2 ** retryCount, MAX_RETRY_AFTER_MS);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return axiosInstance(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);
