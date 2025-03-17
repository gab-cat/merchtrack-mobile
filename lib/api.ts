const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, data.message || 'Something went wrong');
  }

  return data as T;
}

export function useApiClient() {
  const fetchWithAuth = async <T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const token = process.env.EXPO_PUBLIC_API_TOKEN;
    if (!token) {
      throw new Error('API token is not defined in the environment variables');
    }
    return fetchApi<T>(path, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  };

  return {
    get: <T>(path: string) => fetchWithAuth<T>(path, { method: 'GET' }),
    post: <T>(path: string, data: unknown) =>
      fetchWithAuth<T>(path, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    put: <T>(path: string, data: unknown) =>
      fetchWithAuth<T>(path, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: <T>(path: string) =>
      fetchWithAuth<T>(path, { method: 'DELETE' }),
  };
}