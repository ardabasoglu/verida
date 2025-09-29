/**
 * Client-side CSRF token management
 */

let csrfToken: string | null = null;

/**
 * Fetch CSRF token from the server
 */
export async function fetchCSRFToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }

    const data = await response.json();

    if (data.success && data.csrfToken) {
      csrfToken = data.csrfToken;
      return data.csrfToken;
    }

    throw new Error('Invalid CSRF token response');
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
}

/**
 * Get the current CSRF token, fetching if necessary
 */
export async function getCSRFToken(): Promise<string> {
  if (!csrfToken) {
    await fetchCSRFToken();
  }

  if (!csrfToken) {
    throw new Error('Unable to obtain CSRF token');
  }

  return csrfToken;
}

/**
 * Clear the cached CSRF token (e.g., on logout)
 */
export function clearCSRFToken(): void {
  csrfToken = null;
}

/**
 * Enhanced fetch wrapper that automatically includes CSRF token
 */
export async function secureApiCall(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const { method = 'GET', headers = {}, ...otherOptions } = options;

  // Add CSRF token for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    try {
      const token = await getCSRFToken();

      // Add CSRF token to headers
      (headers as Record<string, string>)['x-csrf-token'] = token;
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      // Continue without CSRF token - let server handle the error
    }
  }

  // Ensure content-type is set for JSON requests
  if (options.body && typeof options.body === 'string') {
    (headers as Record<string, string>)['content-type'] = 'application/json';
  }

  return fetch(url, {
    method,
    headers,
    credentials: 'include', // Include cookies
    ...otherOptions,
  });
}

/**
 * Secure API client with automatic CSRF handling
 */
export const secureApi = {
  /**
   * GET request
   */
  get: async (url: string, options: RequestInit = {}) => {
    return secureApiCall(url, { ...options, method: 'GET' });
  },

  /**
   * POST request with CSRF protection
   */
  post: async (url: string, data?: unknown, options: RequestInit = {}) => {
    return secureApiCall(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PUT request with CSRF protection
   */
  put: async (url: string, data?: unknown, options: RequestInit = {}) => {
    return secureApiCall(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PATCH request with CSRF protection
   */
  patch: async (url: string, data?: unknown, options: RequestInit = {}) => {
    return secureApiCall(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * DELETE request with CSRF protection
   */
  delete: async (url: string, options: RequestInit = {}) => {
    return secureApiCall(url, { ...options, method: 'DELETE' });
  },
};

/**
 * React hook for CSRF token management
 */
export function useCSRFToken() {
  const [token, setToken] = React.useState<string | null>(csrfToken);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refreshToken = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const newToken = await fetchCSRFToken();
      setToken(newToken);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch CSRF token';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!token) {
      refreshToken();
    }
  }, [token, refreshToken]);

  return {
    token,
    loading,
    error,
    refreshToken,
    clearToken: () => {
      clearCSRFToken();
      setToken(null);
    },
  };
}

// Add React import for the hook
import React from 'react';
