/**
 * MySQL API client. Replaces Supabase client for data when using the Node/MySQL backend.
 * Set VITE_USE_MYSQL_API=true and VITE_API_URL=http://localhost:3001 to use MySQL.
 * Auth remains Supabase; token from supabase.auth.getSession() is sent to the API.
 */

const USE_MYSQL = import.meta.env.VITE_USE_MYSQL_API === 'true' || import.meta.env.VITE_USE_MYSQL_API === '1';
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

let getToken: (() => Promise<string | null>) | null = null;

export function setApiTokenGetter(fn: () => Promise<string | null>) {
  getToken = fn;
}

export function isUsingMySQL(): boolean {
  return USE_MYSQL;
}

async function request<T = unknown>(
  path: string,
  options: RequestInit & { params?: Record<string, string | number | undefined> } = {}
): Promise<{ data: T | null; error: { message: string } | null }> {
  if (!USE_MYSQL) {
    return { data: null, error: { message: 'MySQL API not enabled' } };
  }
  const { params, ...init } = options;
  let url = `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
  if (params && Object.keys(params).length > 0) {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') search.set(k, String(v));
    }
    const q = search.toString();
    if (q) url += (url.includes('?') ? '&' : '?') + q;
  }
  const token = getToken ? await getToken() : null;
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
