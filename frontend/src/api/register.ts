/**
 * User Registration API
 */

import { apiClient } from './client';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  sex?: string;
  registerAddress: boolean;
  postalCode?: string;
  prefecture?: string;
  address?: string;
  option?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    name: string;
  };
}

export async function register(
  registerData: RegisterRequest
): Promise<RegisterResponse> {
  return apiClient.post<RegisterResponse>('/register', registerData);
}
