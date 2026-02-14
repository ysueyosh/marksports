/**
 * Admin page view stats API
 */

import { apiClient } from './client';

export type AccessView = 'week' | 'month' | 'year' | 'all';

export interface PageViewStat {
  date: string;
  count: number;
  label?: string;
}

export interface GetPageViewStatsResponse {
  success: boolean;
  message?: string;
  data?: {
    items: PageViewStat[];
  };
}

export async function getPageViewStats(
  pageId: string,
  view: AccessView,
): Promise<GetPageViewStatsResponse> {
  try {
    const params = new URLSearchParams({
      pageId,
      view,
    });
    return await apiClient.get<GetPageViewStatsResponse>(
      `/admin/page-views?${params.toString()}`,
    );
  } catch (error) {
    console.error('Failed to fetch page view stats:', error);
    return {
      success: false,
      message: 'Failed to fetch page view stats',
    };
  }
}
