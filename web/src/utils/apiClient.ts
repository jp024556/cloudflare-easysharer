import { API_BASE_URL } from '../config/constants';

// Token expiry handler
const handleTokenExpiry = () => {
  const token = localStorage.getItem('authToken');
  if (token && token !== 'demo-token' && !token.startsWith('demo-token-')) {
    localStorage.removeItem('authToken');
    // Redirect to login page
    window.location.href = '/signin';
  }
};

export interface AuthRegisterRequest {
  email: string;
  password: string;
  name: string;
  mobileNumber?: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    name: string;
    mobileNumber?: string;
    subscription: 'free' | 'premium' | 'enterprise';
    avatar?: string;
  };
  token?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface InitiateUploadRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
  senderMobileNumber: string; // This will now accept name instead of mobile number
  recipientId: string;
  chunkSize?: number;
}

export interface InitiateUploadResponse {
  uploadId: string;
  chunkSize: number;
  totalChunks: number;
  message: string;
}

export interface ChunkUploadRequest {
  uploadId: string;
  chunkIndex: number;
  chunk: Blob;
  chunkHash?: string;
}

export interface ChunkUploadResponse {
  message: string;
  chunkIndex: number;
  progress: number;
  uploadedChunks: number;
  totalChunks: number;
  status: string;
}

export interface CompleteUploadRequest {
  uploadId: string;
  fileHash?: string;
}

export interface CompleteUploadResponse {
  message: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

export interface UploadStatusResponse {
  uploadId: string;
  status: string;
  fileName: string;
  fileSize: number;
  progress: number;
  uploadedChunks: number;
  totalChunks: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeUploadResponse {
  uploadId: string;
  status: string;
  progress: number;
  uploadedChunks: number;
  totalChunks: number;
  missingChunks: number[];
  chunkSize: number;
  canResume: boolean;
}

export interface ResolveShortCodeResponse {
  message: string;
  recipientId: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Check for 401 Unauthorized responses
    if (response.status === 401) {
      handleTokenExpiry();
      throw new Error('Authentication failed - redirecting to login');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private async requestFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    // Check for 401 Unauthorized responses
    if (response.status === 401) {
      handleTokenExpiry();
      throw new Error('Authentication failed - redirecting to login');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async resolveShortCode(shortCode: string): Promise<ResolveShortCodeResponse> {
    return this.request<ResolveShortCodeResponse>(`/s/${shortCode}`);
  }

  async initiateUpload(data: InitiateUploadRequest): Promise<InitiateUploadResponse> {
    return this.request<InitiateUploadResponse>('/uploads/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadChunk(data: ChunkUploadRequest): Promise<ChunkUploadResponse> {
    const formData = new FormData();
    formData.append('uploadId', data.uploadId);
    formData.append('chunkIndex', data.chunkIndex.toString());
    formData.append('chunk', data.chunk);
    if (data.chunkHash) {
      formData.append('chunkHash', data.chunkHash);
    }

    return this.requestFormData<ChunkUploadResponse>('/uploads/chunk', formData);
  }

  async completeUpload(data: CompleteUploadRequest): Promise<CompleteUploadResponse> {
    return this.request<CompleteUploadResponse>('/uploads/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async abortUpload(uploadId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/uploads/abort', {
      method: 'POST',
      body: JSON.stringify({ uploadId }),
    });
  }

  async getUploadStatus(uploadId: string): Promise<UploadStatusResponse> {
    return this.request<UploadStatusResponse>(`/uploads/status?uploadId=${uploadId}`);
  }

  async resumeUpload(uploadId: string): Promise<ResumeUploadResponse> {
    return this.request<ResumeUploadResponse>('/uploads/resume', {
      method: 'POST',
      body: JSON.stringify({ uploadId }),
    });
  }

  // Authentication endpoints
  async register(data: AuthRegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: AuthLoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<{ message: string }> {
    const token = localStorage.getItem('authToken');
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getUserDetails(): Promise<{ user: any }> {
    const token = localStorage.getItem('authToken');
    return this.request<{ user: any }>('/auth/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const token = localStorage.getItem('authToken');
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();