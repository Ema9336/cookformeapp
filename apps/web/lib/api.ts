const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

export type AnalyticsEventPayload = {
  eventType: 'PAGE_VIEW' | 'CLICK' | 'FORM_SUBMIT' | 'CUSTOM';
  path?: string;
  element?: string;
  label?: string;
  sessionId: string;
  visitorId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  referrer?: string;
};

export type PaymentStatus = {
  stripeEnabled: boolean;
  bookingsEnabled: boolean;
  mode: 'disabled' | 'test' | 'live';
  publishableKeyPresent: boolean;
  message: string;
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
    request<{ id: string }>('/bookings', { method: 'POST', body: data, token }),

  myBookings: (token: string) =>
    request<unknown[]>('/bookings/my', { token }),

  chefBookings: (token: string) =>
    request<unknown[]>('/bookings/chef', { token }),

  updateStatus: (token: string, id: string, status: string) =>
    request(`/bookings/${id}/status`, { method: 'PATCH', body: { status }, token }),

  submitReview: (token: string, id: string, data: { rating: number; review?: string }) =>
    request(`/bookings/${id}/review`, { method: 'POST', body: data, token }),
};

// ─── Analytics ─────────────────────────────────────────────────────────────

export const analyticsApi = {
  trackEvent: (data: AnalyticsEventPayload) =>
    request<{ ok: boolean }>('/analytics/events', { method: 'POST', body: data }),
};

export const paymentsApi = {
  status: () => request<PaymentStatus>('/payments/status'),
  createIntent: (token: string, data: { amount: number; currency?: string; chefSlug?: string }) =>
    request<{ id: string; clientSecret: string | null; status: string }>('/payments/intent', {
      method: 'POST',
      body: data,
      token,
    }),
};

// ─── Notifications ──────────────────────────────────────────────────────────

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  bookingId: string | null;
  createdAt: string;
};

export const notificationsApi = {
  list: (token: string) =>
    request<{ notifications: AppNotification[]; unread: number }>('/notifications', { token }),
  markRead: (token: string, id: string) =>
    request<{ ok: boolean }>(`/notifications/${id}/read`, { method: 'PATCH', token }),
  markAllRead: (token: string) =>
    request<{ ok: boolean }>('/notifications/read-all', { method: 'PATCH', token }),
};

// ─── Admin ─────────────────────────────────────────────────────────────────

export const adminApi = {
  listChefs: (token: string) =>
    request<unknown[]>('/admin/chefs', { token }),

  listAuditLogs: (token: string, limit = 100) =>
    request<unknown[]>(`/admin/audit-logs?limit=${limit}`, { token }),

  getAnalyticsSummary: (token: string, from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    return request<unknown>(`/admin/analytics/summary${qs.toString() ? `?${qs.toString()}` : ''}`, { token });
  },

  listAnalyticsEvents: (
    token: string,
    params?: {
      limit?: number;
      eventType?: string;
      path?: string;
      query?: string;
      from?: string;
      to?: string;
    },
  ) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.eventType) qs.set('eventType', params.eventType);
    if (params?.path) qs.set('path', params.path);
    if (params?.query) qs.set('query', params.query);
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);

    return request<unknown[]>(`/admin/analytics/events${qs.toString() ? `?${qs.toString()}` : ''}`, {
      token,
    });
  },

  listAnalyticsJourneys: (
    token: string,
    params?: { limit?: number; from?: string; to?: string; query?: string },
  ) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    if (params?.query) qs.set('query', params.query);

    return request<unknown[]>(`/admin/analytics/journeys${qs.toString() ? `?${qs.toString()}` : ''}`, {
      token,
    });
  },

  listUsers: (token: string) =>
    request<unknown[]>('/admin/users', { token }),

  updateUserRole: (token: string, id: string, role: 'CUSTOMER' | 'CHEF' | 'ADMIN') =>
    request(`/admin/users/${id}/role`, { method: 'PATCH', body: { role }, token }),

  updateUserRolesBulk: (
    token: string,
    ids: string[],
    role: 'CUSTOMER' | 'CHEF' | 'ADMIN',
  ) => request('/admin/users/roles/bulk', { method: 'PATCH', body: { ids, role }, token }),

  updateCompliance: (
    token: string,
    id: string,
    data: { status: string; adminNotes?: string },
  ) => request(`/admin/chefs/${id}/compliance`, { method: 'PATCH', body: data, token }),

  updateBookable: (
    token: string,
    id: string,
    data: { isBookable: boolean },
  ) => request(`/admin/chefs/${id}/bookable`, { method: 'PATCH', body: data, token }),
};
