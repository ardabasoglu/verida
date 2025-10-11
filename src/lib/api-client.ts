import { handleError, AppError } from './errors';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new AppError(
          data.error || data.message || 'İstek başarısız oldu',
          response.status
        );
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      // Network or other errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new AppError('Bağlantı hatası. İnternet bağlantınızı kontrol edin.', 0);
      }
      
      throw handleError(error);
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // File upload with progress
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response);
          } else {
            reject(new AppError(
              response.error || response.message || 'Dosya yükleme başarısız',
              xhr.status
            ));
          }
        } catch {
          reject(new AppError('Yanıt işlenemedi', xhr.status));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new AppError('Dosya yükleme sırasında ağ hatası oluştu', 0));
      });

      xhr.addEventListener('timeout', () => {
        reject(new AppError('Dosya yükleme zaman aşımına uğradı', 0));
      });

      xhr.open('POST', `${this.baseUrl}${endpoint}`);
      xhr.send(formData);
    });
  }
}

// Default instance
export const apiClient = new ApiClient();

// React hook for API calls with error handling
import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';

interface UseApiOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

export function useApi<T = unknown>(options: UseApiOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);
  const toast = useToast();

  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'İşlem başarıyla tamamlandı',
  } = options;

  const execute = useCallback(async (
    apiCall: () => Promise<ApiResponse<T>>
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCall();
      
      if (response.success && response.data) {
        setData(response.data);
        
        if (showSuccessToast) {
          toast.success(successMessage, response.message);
        }
        
        return response.data;
      } else {
        throw new AppError(response.error || 'İşlem başarısız oldu');
      }
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      
      if (showErrorToast) {
        toast.error('Hata', appError.message);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, showSuccessToast, showErrorToast, successMessage]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
  };
}

// Specific hooks for common operations
export function useApiMutation<T = unknown>(options: UseApiOptions = {}) {
  return useApi<T>({
    showSuccessToast: true,
    showErrorToast: true,
    ...options,
  });
}

export function useApiQuery<T = unknown>(options: UseApiOptions = {}) {
  return useApi<T>({
    showSuccessToast: false,
    showErrorToast: true,
    ...options,
  });
}