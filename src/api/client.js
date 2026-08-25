/**
 * The one place that talks to the Amarathon backend.
 *
 * Two rules the rest of the app relies on:
 *   1. Every call either resolves with parsed JSON or throws an `ApiError`
 *      carrying the backend's own `detail` string — screens render that
 *      message directly instead of inventing their own.
 *   2. A 401 triggers exactly one refresh, no matter how many requests hit it
 *      at once (see `refreshing` below), and the original requests are retried
 *      behind it. A failed refresh clears the session and notifies listeners.
 */

const DEFAULT_BACKEND_BASE = 'https://amarathon.krishnarajthadesar.in';
const RAW_BASE =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : DEFAULT_BACKEND_BASE);
// Same-origin in dev (Vite proxies /api); production talks directly to the
// deployed Amarathon backend unless VITE_API_BASE_URL overrides it.
export const BASE_URL = RAW_BASE.replace(/\/+$/, '');
const API = `${BASE_URL}/api`;
export const GATEWAY_URL = (import.meta.env.VITE_API_GATEWAY_URL || 'https://api-get-away.krishnarajthadesar.in').replace(/\/+$/, '');
const GATEWAY_API = `${GATEWAY_URL}${import.meta.env.VITE_GATEWAY_ROUTE || '/api/amarathon'}/api`;

const ACCESS_KEY = 'amarathon_access_token';
const REFRESH_KEY = 'amarathon_refresh_token';
const USER_KEY = 'amarathon_user';

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/* ------------------------------------------------------------------ tokens */

const store = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode: the session lives for this tab only */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* nothing to do */
    }
  },
};

export const getAccessToken = () => store.get(ACCESS_KEY);
export const getRefreshToken = () => store.get(REFRESH_KEY);

export function getStoredUser() {
  try {
    const raw = store.get(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession({ access_token, refresh_token, user }) {
  if (access_token) store.set(ACCESS_KEY, access_token);
  if (refresh_token) store.set(REFRESH_KEY, refresh_token);
  if (user) store.set(USER_KEY, JSON.stringify(user));
  return user;
}

export function clearSession() {
  store.remove(ACCESS_KEY);
  store.remove(REFRESH_KEY);
  store.remove(USER_KEY);
}

export const isLoggedIn = () => Boolean(getAccessToken() && getRefreshToken());

// AuthContext subscribes so a refresh failure logs the UI out immediately
// rather than on the next render that happens to notice.
const sessionListeners = new Set();
export function onSessionLost(listener) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}
function loseSession() {
  clearSession();
  sessionListeners.forEach((listener) => listener());
}

/* ----------------------------------------------------------------- request */

async function parse(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function messageFrom(body, fallback) {
  if (!body) return fallback;
  if (typeof body === 'string') return body;
  const { detail } = body;
  if (typeof detail === 'string') return detail;
  // FastAPI validation errors arrive as a list of {loc, msg, type}.
  if (Array.isArray(detail) && detail.length) {
    return detail
      .map((item) => {
        const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : null;
        return field ? `${field}: ${item.msg}` : item.msg;
      })
      .join(', ');
  }
  return fallback;
}

// One in-flight refresh, shared by everything that 401s while it runs.
let refreshing = null;

async function runRefresh() {
  const refresh_token = getRefreshToken();
  if (!refresh_token) return false;

  try {
    const response = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    });
    if (!response.ok) return false;
    const data = await parse(response);
    if (!data?.access_token) return false;
    saveSession(data);
    return true;
  } catch {
    // Network failure isn't a dead session — keep the tokens and let the
    // caller surface the outage.
    return false;
  }
}

function refreshOnce() {
  if (!refreshing) {
    refreshing = runRefresh().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

async function request(path, { method = 'GET', body, auth = true, isForm = false } = {}) {
  const send = async () => {
    const headers = {};
    if (!isForm) headers['Content-Type'] = 'application/json';
    if (auth) {
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    return fetch(`${API}${path}`, {
      method,
      headers,
      body: isForm ? body : body === undefined ? undefined : JSON.stringify(body),
    });
  };

  let response;
  try {
    response = await send();
  } catch {
    throw new ApiError('Can’t reach the server. Check your connection.', 0, null);
  }

  // 403 is here because FastAPI's HTTPBearer answers a missing header with 403,
  // not 401 — without it a returning tab with an expired token never refreshes.
  if ((response.status === 401 || response.status === 403) && auth && getRefreshToken()) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      try {
        response = await send();
      } catch {
        throw new ApiError('Can’t reach the server. Check your connection.', 0, null);
      }
    } else {
      loseSession();
      throw new ApiError('Your session expired. Please sign in again.', 401, null);
    }
  }

  const payload = await parse(response);
  if (!response.ok) {
    throw new ApiError(
      messageFrom(payload, `Request failed (${response.status})`),
      response.status,
      payload
    );
  }
  return payload;
}

export function authentikLoginUrl(next = '/login?authentik=1') {
  const url = new URL(`${GATEWAY_URL}/auth/login`);
  url.searchParams.set('frontend_host', window.location.origin);
  url.searchParams.set('next', next);
  return url.toString();
}

async function gatewayRequest(path, { method = 'GET', auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && getAccessToken()) headers.Authorization = `Bearer ${getAccessToken()}`;
  let response;
  try {
    response = await fetch(`${GATEWAY_API}${path}`, { method, headers, credentials: 'include' });
  } catch {
    throw new ApiError('Can’t reach API Get Away.', 0, null);
  }
  const payload = await parse(response);
  if (!response.ok) throw new ApiError(messageFrom(payload, 'Authentik request failed'), response.status, payload);
  return payload;
}

/* -------------------------------------------------------------------- auth */

export const api = {
  health: () =>
    fetch(`${BASE_URL}/health`, {
      signal: AbortSignal.timeout(6000),
    })
      .then((r) => r.ok)
      .catch(() => false),

  register: async ({ username, password, display_name }) =>
    saveSession(
      await request('/auth/register', {
        method: 'POST',
        auth: false,
        body: { username, password, display_name },
      })
    ),

  login: async ({ username, password }) =>
    saveSession(
      await request('/auth/login', { method: 'POST', auth: false, body: { username, password } })
    ),

  loginWithAuthentik: async () => saveSession(
    await gatewayRequest('/auth/authentik/session', { method: 'POST' })
  ),
  authentikStatus: () => request('/auth/authentik'),
  linkAuthentik: () => gatewayRequest('/auth/authentik/link', { method: 'POST', auth: true }),
  unlinkAuthentik: () => request('/auth/authentik', { method: 'DELETE' }),

  logout: async () => {
    const refresh_token = getRefreshToken();
    if (refresh_token) {
      // Best effort: a dead backend must not trap someone in a signed-in shell.
      await request('/auth/logout', {
        method: 'POST',
        auth: false,
        body: { refresh_token },
      }).catch(() => null);
    }
    clearSession();
  },

  me: () => request('/auth/me'),
  updateProfile: async (display_name) => {
    const user = await request('/auth/me', { method: 'PATCH', body: { display_name } });
    saveSession({ user });
    return user;
  },
  changePassword: (current_password, new_password) =>
    request('/auth/password', { method: 'POST', body: { current_password, new_password } }),

  /* ----------------------------------------------------------- friends */

  searchUsers: (q) => request(`/users/search?q=${encodeURIComponent(q)}`),
  friends: () => request('/friends'),
  friendRequests: () => request('/friends/requests'),
  sendFriendRequest: (username) =>
    request('/friends/requests', { method: 'POST', body: { username } }),
  respondToFriendRequest: (id, accept) =>
    request(`/friends/requests/${id}/respond`, { method: 'POST', body: { accept } }),
  removeFriend: (userId) => request(`/friends/${userId}`, { method: 'DELETE' }),

  /* -------------------------------------------------------- challenges */

  challenges: () => request('/challenges'),
  challenge: (uuid) => request(`/challenges/${uuid}`),
  createChallenge: (payload) => request('/challenges', { method: 'POST', body: payload }),
  updateChallenge: (uuid, payload) =>
    request(`/challenges/${uuid}`, { method: 'PATCH', body: payload }),
  deleteChallenge: (uuid) => request(`/challenges/${uuid}`, { method: 'DELETE' }),
  inviteToChallenge: (uuid, usernames) =>
    request(`/challenges/${uuid}/participants`, { method: 'POST', body: { invite: usernames } }),
  respondToChallenge: (uuid, accept) =>
    request(`/challenges/${uuid}/respond`, { method: 'POST', body: { accept } }),
  leaveChallenge: (uuid) => request(`/challenges/${uuid}/leave`, { method: 'POST' }),
  periods: (uuid, { limit = 30, offset = 0 } = {}) =>
    request(`/challenges/${uuid}/periods?limit=${limit}&offset=${offset}`),
  currentPeriod: (uuid) => request(`/challenges/${uuid}/current`),

  /* ------------------------------------------------------------ entries */

  period: (periodId) => request(`/periods/${periodId}`),
  logEntry: (periodId, value, note) =>
    request(`/periods/${periodId}/entry`, { method: 'PUT', body: { value, note: note || null } }),
  deleteEntry: (periodId) => request(`/periods/${periodId}/entry`, { method: 'DELETE' }),

  /* ------------------------------------------------------------- images */

  uploadEntryImage: (entryUuid, file) => {
    const form = new FormData();
    form.append('file', file);
    return request(`/entries/${entryUuid}/images`, { method: 'POST', body: form, isForm: true });
  },
  entryImages: (entryUuid) => request(`/entries/${entryUuid}/images`),
  imageUrl: (imageUuid) => request(`/images/${imageUuid}/url`),
  deleteImage: (imageUuid) => request(`/images/${imageUuid}`, { method: 'DELETE' }),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/users/me/avatar', { method: 'POST', body: form, isForm: true });
  },
  avatarUrl: (userId) => request(`/users/${userId}/avatar/url`),

  /* -------------------------------------------------------------- stats */

  dashboard: () => request('/stats/dashboard'),
  overview: () => request('/stats/me'),
  activity: (days = 90) => request(`/stats/me/activity?days=${days}`),
  leaderboard: (uuid) => request(`/challenges/${uuid}/leaderboard`),
  timeseries: (uuid, limit = 90) => request(`/challenges/${uuid}/timeseries?limit=${limit}`),

  /* ----------------------------------------------------------- settings */

  settings: () => request('/settings'),
  updateSettings: (payload) => request('/settings', { method: 'PUT', body: payload }),
};

export default api;
