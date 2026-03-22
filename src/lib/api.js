const API = 'https://lajarana-api.luminari.agency/api';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jarana_token');
}

export function setToken(token) {
  localStorage.setItem('jarana_token', token);
}

export function clearToken() {
  localStorage.removeItem('jarana_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Error');
  return data;
}

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  getEvents: () => request('/events'),
  getEvent: (id) => request(`/events/${id}`),
  createEvent: (body) => request('/events', { method: 'POST', body: JSON.stringify(body) }),
  updateEvent: (id, body) => request(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getTicketTypes: (eventId) => request(`/ticket-types/by-event/${eventId}`),
  createTicketType: (body) => request('/ticket-types', { method: 'POST', body: JSON.stringify(body) }),
  getEventStats: (id) => request(`/events/${id}/stats`),
  getPublicEvents: () => request('/public/events'),
  getPublicEvent: (slug) => request(`/public/events/${slug}`),
  // Plans
  getPlans: () => request('/plans'),
  upgradePlan: () => request('/plans/upgrade', { method: 'POST' }),
  cancelPlan: () => request('/plans/cancel', { method: 'POST' }),
  // Users
  getProfile: () => request('/users/me'),
  updateProfile: (body) => request('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
};
