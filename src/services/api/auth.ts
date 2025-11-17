import { apiClient } from './client';

export interface User {
  id: number;
  email: string;
  name?: string;
  subscription_tier: 'free' | 'starter' | 'pro';
  subscription_status: string;
  minutes_quota: number;
  minutes_used_this_month: number;
  minutes_remaining: number;
  created_at: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', data);
  if (response.token) {
    apiClient.setToken(response.token);
  }
  return response;
}

export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', data);
  if (response.token) {
    apiClient.setToken(response.token);
  }
  return response;
}

export async function getProfile(): Promise<{ success: boolean; user: User }> {
  return apiClient.get('/auth/profile');
}

export async function getUsageStats(): Promise<{
  success: boolean;
  stats: {
    subscription_tier: string;
    minutes_quota: number;
    minutes_used_this_month: number;
    minutes_remaining: number;
    total_videos_processed: number;
    total_minutes_processed: number;
  };
}> {
  return apiClient.get('/auth/usage');
}

export function logout() {
  apiClient.setToken(null);
}
