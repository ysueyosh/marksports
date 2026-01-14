/**
 * User Registration API
 */

import { apiRequest } from './client';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  postalCode: string;
  prefecture: string;
  address: string;
  building?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    name: string;
    message: string;
  };
}

export async function register(
  registerData: RegisterRequest
): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>('/register', {
    method: 'POST',
    body: JSON.stringify(registerData),
  });
}
