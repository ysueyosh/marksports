import { apiClient } from './client';

export interface ShippingSettings {
  baseFee: number;
  freeShippingThreshold: number;
  regionSurcharges: {
    hokkaido: number;
    tohoku: number;
    chubuKanto: number;
    chugokuKansai: number;
    kyushu: number;
    okinawa: number;
  };
}

export interface ShippingSettingsResponse {
  success: boolean;
  message: string;
  data?: ShippingSettings;
}

export const getAdminShippingSettings =
  async (): Promise<ShippingSettingsResponse> => {
    const response = await apiClient.get<ShippingSettingsResponse>(
      '/admin/shipping-settings',
    );
    return response as ShippingSettingsResponse;
  };

export const updateAdminShippingSettings = async (request: {
  baseFee: number;
  regionSurcharges: ShippingSettings['regionSurcharges'];
}): Promise<ShippingSettingsResponse> => {
  const response = await apiClient.put<ShippingSettingsResponse>(
    '/admin/shipping-settings',
    request,
  );
  return response as ShippingSettingsResponse;
};
