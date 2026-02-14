/**
 * Page views API
 */

import { apiClient } from './client';

export interface RecordPageViewResponse {
  success: boolean;
  message: string;
  data?: {
    pageId: string;
    date: string;
    count: number;
  };
}

export async function recordPageView(
  pageId: string,
): Promise<RecordPageViewResponse> {
  return apiClient.post<RecordPageViewResponse>('/page-views', {
    pageId,
  });
}
