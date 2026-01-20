/**
 * Admin image upload API client
 */

import { apiRequest } from './client';

export interface UploadImageRequest {
  productId: string;
  imageName: string;
  file: File;
}

export interface UploadImageResponse {
  success: boolean;
  data?: {
    s3Url: string;
  };
  error?: string;
}

export const adminImageAPI = {
  /**
   * Upload image to S3 via backend
   */
  uploadImage: async (
    productId: string,
    imageName: string,
    file: File
  ): Promise<UploadImageResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('productId', productId);
    formData.append('imageName', imageName);

    return apiRequest<UploadImageResponse>('/admin/images/upload', {
      method: 'POST',
      body: formData,
    }).catch((error) => ({
      success: false,
      error: error.message,
    }));
  },
};
