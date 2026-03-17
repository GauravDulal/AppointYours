const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

type ApiError = {
  detail?: string;
};

export class ApiException extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiException';
  }
}

export async function fetcher<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    const error: ApiError = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new ApiException(response.status, error.detail || 'An error occurred');
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string) => fetcher<T>(endpoint, { method: 'GET' }),
  post: <T, B = unknown>(endpoint: string, body: B) =>
    fetcher<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T, B = unknown>(endpoint: string, body: B) =>
    fetcher<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T, B = unknown>(endpoint: string, body: B) =>
    fetcher<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => fetcher<T>(endpoint, { method: 'DELETE' }),
};

