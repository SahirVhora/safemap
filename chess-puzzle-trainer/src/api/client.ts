const RAW_BASE_URL = (import.meta.env.VITE_API_URL || '').trim();

function joinApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!RAW_BASE_URL) return normalizedPath;

  const base = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;
  const withoutLeadingApi = normalizedPath.startsWith('/api/') ? normalizedPath.slice(4) : normalizedPath;

  // Support both:
  // VITE_API_URL=http://localhost:4000
  // VITE_API_URL=http://localhost:4000/api
  if (base.endsWith('/api')) {
    return `${base}${withoutLeadingApi}`;
  }
  return `${base}${normalizedPath}`;
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(joinApiUrl(path), {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (data && data.error) || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export async function apiUpload<T>(path: string, body: FormData, token?: string | null, extraHeaders?: Record<string, string>) {
  const headers = new Headers(extraHeaders || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(joinApiUrl(path), {
    method: 'POST',
    body,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data && data.error) || `Upload failed: ${response.status}`);
  }
  return data as T;
}
