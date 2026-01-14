import { API_BASE_URL } from './constants';
import { apiRequest } from './client';

export interface SearchAddressResponse {
  success: boolean;
  data?: {
    postalCode: string;
    prefecture: string;
    address: string;
  };
  message?: string;
}

export interface AddressItem {
  id: string;
  postalCode: string;
  prefecture: string;
  address: string;
  building?: string;
  isDefault: boolean;
}

export interface GetAddressesResponse {
  success: boolean;
  message: string;
  data?: AddressItem[];
}

export interface AddAddressRequest {
  postalCode: string;
  prefecture: string;
  address: string;
  building?: string;
}

export interface AddAddressResponse {
  success: boolean;
  message: string;
  data?: AddressItem;
}

export interface UpdateAddressResponse {
  success: boolean;
  message: string;
  data?: AddressItem;
}

export interface DeleteAddressResponse {
  success: boolean;
  message: string;
}

export interface SetDefaultAddressResponse {
  success: boolean;
  message: string;
  data?: AddressItem;
}

export async function searchAddressByPostalCode(
  postalCode: string
): Promise<SearchAddressResponse> {
  return apiRequest<SearchAddressResponse>('/search-address', {
    method: 'POST',
    body: JSON.stringify({
      postalCode,
    }),
  });
}

/**
 * Get user addresses
 */
export async function getAddresses(): Promise<GetAddressesResponse> {
  const response = await apiRequest<GetAddressesResponse>('/addresses', {
    method: 'GET',
  });

  return response;
}

/**
 * Add new address
 */
export async function addAddress(
  addressData: AddAddressRequest
): Promise<AddAddressResponse> {
  return apiRequest<AddAddressResponse>('/addresses', {
    method: 'POST',
    body: JSON.stringify(addressData),
  });
}

/**
 * Update address
 */
export async function updateAddress(
  addressId: string,
  addressData: Partial<AddAddressRequest>
): Promise<UpdateAddressResponse> {
  return apiRequest<UpdateAddressResponse>(`/addresses/${addressId}`, {
    method: 'PUT',
    body: JSON.stringify(addressData),
  });
}

/**
 * Delete address
 */
export async function deleteAddress(
  addressId: string
): Promise<DeleteAddressResponse> {
  return apiRequest<DeleteAddressResponse>(`/addresses/${addressId}`, {
    method: 'DELETE',
  });
}

/**
 * Set address as default
 */
export async function setDefaultAddress(
  addressId: string
): Promise<SetDefaultAddressResponse> {
  return apiRequest<SetDefaultAddressResponse>(
    `/addresses/${addressId}/default`,
    {
      method: 'PUT',
    }
  );
}
