import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { 
  ApiResponse, 
  ApiError, 
  ValidationError, 
  ApiRequestOptions,
  RateLimitInfo 
} from '@types/api';
import { storageService } from './storageService';
import { notificationService } from './notificationService';

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;
  private timeout: number;
  private rateLimitInfo: RateLimitInfo = {
    limit: 1000,
    remaining: 1000,
    reset: Date.now() + 3600000,
    retryAfter: null
  };
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private retryDelays = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || '/api';
    this.timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client-Version': import.meta.env.VITE_APP_VERSION || '1.0.0',
        'X-Client-Platform': 'web'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = storageService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();

        // Add timestamp
        config.headers['X-Request-Time'] = Date.now().toString();

        // Log request in development
        if (import.meta.env.DEV) {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
        }

        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(this.transformError(error));
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Update rate limit info
        this.updateRateLimitInfo(response);

        // Log response in development
        if (import.meta.env.DEV) {
          console.log(`[API] Response ${response.status}:`, response.data);
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle rate limiting
        if (error.response?.status === 429) {
          return this.handleRateLimit(error, originalRequest);
        }

        // Handle token expiration
        if (error.response?.status === 401 && !originalRequest._retry) {
          return this.handleTokenExpiration(error, originalRequest);
        }

        // Handle network errors with retry
        if (!error.response && !originalRequest._retryCount) {
          return this.handleNetworkError(error, originalRequest);
        }

        console.error('[API] Response error:', error);
        throw this.transformError(error);
      }
    );
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateRateLimitInfo(response: AxiosResponse): void {
    const headers = response.headers;
    if (headers['x-ratelimit-limit']) {
      this.rateLimitInfo.limit = parseInt(headers['x-ratelimit-limit']);
    }
    if (headers['x-ratelimit-remaining']) {
      this.rateLimitInfo.remaining = parseInt(headers['x-ratelimit-remaining']);
    }
    if (headers['x-ratelimit-reset']) {
      this.rateLimitInfo.reset = parseInt(headers['x-ratelimit-reset']) * 1000;
    }
    if (headers['retry-after']) {
      this.rateLimitInfo.retryAfter = parseInt(headers['retry-after']) * 1000;
    }
  }

  private async handleRateLimit(error: AxiosError, originalRequest: any): Promise<any> {
    const retryAfter = this.rateLimitInfo.retryAfter || 60000; // Default 1 minute
    
    notificationService.showError(
      `Rate limit exceeded. Retrying in ${Math.ceil(retryAfter / 1000)} seconds...`
    );

    await this.delay(retryAfter);
    return this.client(originalRequest);
  }

  private async handleTokenExpiration(error: AxiosError, originalRequest: any): Promise<any> {
    originalRequest._retry = true;

    try {
      const refreshToken = storageService.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.client.post('/auth/refresh', {
        refreshToken
      });

      const { token, refreshToken: newRefreshToken } = response.data.data;
      storageService.setToken(token);
      storageService.setRefreshToken(newRefreshToken);

      // Retry original request with new token
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return this.client(originalRequest);
    } catch (refreshError) {
      // Refresh failed, redirect to login
      storageService.clearTokens();
      window.location.href = '/login';
      throw this.transformError(error);
    }
  }

  private async handleNetworkError(error: AxiosError, originalRequest: any): Promise<any> {
    const retryCount = originalRequest._retryCount || 0;
    const maxRetries = 3;

    if (retryCount < maxRetries) {
      const delay = this.retryDelays[retryCount] || 16000;
      originalRequest._retryCount = retryCount + 1;

      notificationService.showWarning(
        `Network error. Retrying in ${delay / 1000} seconds... (${retryCount + 1}/${maxRetries})`
      );

      await this.delay(delay);
      return this.client(originalRequest);
    }

    throw this.transformError(error);
  }

  private transformError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || error.message || 'Server error',
        code: error.response.data?.code || 'SERVER_ERROR',
        status: error.response.status,
        details: error.response.data?.details,
        validationErrors: error.response.data?.validationErrors,
        timestamp: new Date().toISOString(),
        requestId: error.config?.headers?.['X-Request-ID']
      };
    } else if (error.request) {
      // Network error
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
        status: 0,
        timestamp: new Date().toISOString(),
        requestId: error.config?.headers?.['X-Request-ID']
      };
    } else {
      // Other error
      return {
        message: error.message || 'Unknown error',
        code: 'UNKNOWN_ERROR',
        status: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods
  async get<T = any>(
    url: string, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const config: AxiosRequestConfig = {
      params: options.params,
      timeout: options.timeout || this.timeout,
      signal: options.signal
    };

    if (options.headers) {
      config.headers = { ...config.headers, ...options.headers };
    }

    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T = any>(
    url: string, 
    data?: any, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const config: AxiosRequestConfig = {
      timeout: options.timeout || this.timeout,
      signal: options.signal
    };

    if (options.headers) {
      config.headers = { ...config.headers, ...options.headers };
    }

    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T = any>(
    url: string, 
    data?: any, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const config: AxiosRequestConfig = {
      timeout: options.timeout || this.timeout,
      signal: options.signal
    };

    if (options.headers) {
      config.headers = { ...config.headers, ...options.headers };
    }

    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T = any>(
    url: string, 
    data?: any, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const config: AxiosRequestConfig = {
      timeout: options.timeout || this.timeout,
      signal: options.signal
    };

    if (options.headers) {
      config.headers = { ...config.headers, ...options.headers };
    }

    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T = any>(
    url: string, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const config: AxiosRequestConfig = {
      timeout: options.timeout || this.timeout,
      signal: options.signal
    };

    if (options.headers) {
      config.headers = { ...config.headers, ...options.headers };
    }

    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  async upload<T = any>(
    url: string, 
    file: File, 
    options: ApiRequestOptions & { 
      onProgress?: (progress: number) => void,
      fieldName?: string 
    } = {}
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(options.fieldName || 'file', file);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: options.timeout || 0, // No timeout for uploads
      signal: options.signal,
      onUploadProgress: (progressEvent) => {
        if (options.onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          options.onProgress(progress);
        }
      }
    };

    if (options.headers) {
      config.headers = { ...config.headers, ...options.headers };
    }

    const response = await this.client.post<ApiResponse<T>>(url, formData, config);
    return response.data;
  }

  async download(
    url: string, 
    filename?: string, 
    options: ApiRequestOptions & { 
      onProgress?: (progress: number) => void 
    } = {}
  ): Promise<void> {
    const config: AxiosRequestConfig = {
      responseType: 'blob',
      timeout: options.timeout || 0, // No timeout for downloads
      signal: options.signal,
      onDownloadProgress: (progressEvent) => {
        if (options.onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          options.onProgress(progress);
        }
      }
    };

    if (options.headers) {
      config.headers = { ...config.headers, ...options.headers };
    }

    const response = await this.client.get(url, config);
    
    // Create blob URL and trigger download
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || url.split('/').pop() || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Queue management for high-traffic scenarios
  async enqueue<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('[API] Queue request failed:', error);
        }
      }

      // Rate limiting - respect API limits
      if (this.rateLimitInfo.remaining < 10) {
        const waitTime = Math.max(0, this.rateLimitInfo.reset - Date.now());
        if (waitTime > 0) {
          await this.delay(waitTime);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  // Utility methods
  getRateLimitInfo(): RateLimitInfo {
    return { ...this.rateLimitInfo };
  }

  isRateLimited(): boolean {
    return this.rateLimitInfo.remaining <= 0 && Date.now() < this.rateLimitInfo.reset;
  }

  getQueueLength(): number {
    return this.requestQueue.length;
  }

  clearQueue(): void {
    this.requestQueue.length = 0;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  // Cancel all pending requests
  cancelAllRequests(): void {
    this.clearQueue();
    // Note: Individual request cancellation should be handled via AbortController
  }
}

export const apiService = new ApiService();