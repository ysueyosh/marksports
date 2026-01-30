/**
 * API Configuration Constants
 */

// Local development
// PC
// export const API_BASE_URL = 'http://localhost:5000';
// スマホ
// export const API_BASE_URL = 'http://192.168.40.228:5000';

// Production (AWS Lambda deployed)
export const API_BASE_URL = 'http://127.0.0.1:5000';
// 'https://vyxotu48nk.execute-api.ap-northeast-1.amazonaws.com';

export const API_ENDPOINTS = {
  LOGIN: '/login',
  HEALTH: '/health',
  // Add more endpoints as needed
};
