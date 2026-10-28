const TOKEN_KEY = 'gf_local_admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body = options.body;
  if (body !== undefined && typeof body !== 'string') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`/admin/api${path}`, { ...options, headers, body });
  } catch {
    throw new Error('The local admin API is not running. Start it with npm run server.');
  }

  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    setToken(null);
    const error = new Error(data.message || 'Please sign in again.');
    error.status = 401;
    throw error;
  }
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

export async function uploadImage(file) {
  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const body = new FormData();
  body.append('image', file);
  let response;
  try {
    response = await fetch('/admin/api/uploads', { method: 'POST', headers, body });
  } catch {
    throw new Error('The local admin API is not running. Start it with npm run server.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Image upload failed.');
  }
  return data.data.url;
}
