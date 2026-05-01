const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    credentials: 'include', // always send cookies (httpOnly refresh token)
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error?.message ?? 'API error');
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    request<{ accessToken: string }>('/auth/register', {
      method: 'POST',
      body: data,
    }),

  login: (data: { email: string; password: string }) =>
    request<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: data,
    }),

  // No body needed — refresh token is in the httpOnly cookie
  refresh: () =>
    request<{ accessToken: string }>('/auth/refresh', { method: 'POST' }),

  // No body needed — refresh token is read from cookie server-side
  logout: () =>
    request<void>('/auth/logout', { method: 'POST' }),
};

// ─── Users ─────────────────────────────────────────────────────────────────

export const usersApi = {
  me: (token: string) =>
    request<{ id: string; email: string; name: string; role: string }>('/users/me', { token }),

  update: (token: string, data: { name?: string }) =>
    request('/users/me', { method: 'PATCH', body: data, token }),
};

// ─── Chefs ─────────────────────────────────────────────────────────────────

export const chefsApi = {
  list: (limit?: number) =>
    request<unknown[]>(`/chefs${limit ? `?limit=${limit}` : ''}`),

  getBySlug: (slug: string) =>
    request<unknown>(`/chefs/${slug}`),

  getMyProfile: (token: string) =>
    request('/chefs/me/profile', { token }),

  updateMyProfile: (token: string, data: Record<string, unknown>) =>
    request('/chefs/me/profile', { method: 'PATCH', body: data, token }),

  addMenuItem: (token: string, data: Record<string, unknown>) =>
    request('/chefs/me/menu', { method: 'POST', body: data, token }),

  deleteMenuItem: (token: string, itemId: string) =>
    request(`/chefs/me/menu/${itemId}`, { method: 'DELETE', token }),
};

// ─── Bookings ──────────────────────────────────────────────────────────────

export const bookingsApi = {
  create: (token: string, data: Record<string, unknown>) =>
    request('/bookings', { method: 'POST', body: data, token }),

  myBookings: (token: string) =>
    request<unknown[]>('/bookings/my', { token }),

  chefBookings: (token: string) =>
    request<unknown[]>('/bookings/chef', { token }),

  updateStatus: (token: string, id: string, status: string) =>
    request(`/bookings/${id}/status`, { method: 'PATCH', body: { status }, token }),
};
