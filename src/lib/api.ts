/**
 * MySQL API client. All data and auth go through the Node/MySQL backend.
 * Set VITE_API_URL (e.g. http://localhost:3001). Token is read from localStorage (crm_token).
 */

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

const TOKEN_KEY = 'crm_token';

export function getApiBase() {
  return API_BASE;
}

/** Resolve asset URL (e.g. avatar, uploaded file) to full API origin path. */
export function getAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = API_BASE.replace(/\/$/, '');
  return path.startsWith('/') ? base + path : base + '/' + path;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function isUsingMySQL(): boolean {
  return true;
}

async function request<T = unknown>(
  path: string,
  options: RequestInit & { params?: Record<string, string | number | undefined> } = {}
): Promise<{ data: T | null; error: { message: string } | null }> {
  let url = `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
  const { params, ...init } = options;
  if (params && Object.keys(params).length > 0) {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') search.set(k, String(v));
    }
    const q = search.toString();
    if (q) url += (url.includes('?') ? '&' : '?') + q;
  }
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(url, { ...init, headers });
    const text = await res.text();
    const data = text ? (JSON.parse(text) as T) : null;
    if (!res.ok) {
      return { data: null, error: { message: (data as { error?: string })?.error || res.statusText } };
    }
    return { data, error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : 'Network error' } };
  }
}

export const api = {
  async get(path: string, params?: Record<string, string | number | undefined>) {
    return request(path, { method: 'GET', params });
  },
  async post(path: string, body: unknown) {
    return request(path, { method: 'POST', body: JSON.stringify(body) });
  },
  async patch(path: string, body: unknown) {
    return request(path, { method: 'PATCH', body: JSON.stringify(body) });
  },
  async delete(path: string, params?: Record<string, string | number | undefined>) {
    return request(path, { method: 'DELETE', params });
  },
};

export default api;
