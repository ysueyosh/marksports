import { apiClient } from './client';

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
  option?: string;
  isMain: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  option?: string;
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
  postalCode: string,
): Promise<SearchAddressResponse> {
  return apiClient.post<SearchAddressResponse>('/search-address', {
    postalCode,
  });
}

/**
 * Get user addresses
 */
export async function getAddresses(): Promise<GetAddressesResponse> {
  const response = await apiClient.get<GetAddressesResponse>('/addresses');

  return response;
}

/**
 * Add new address
 */
export async function addAddress(
  addressData: AddAddressRequest,
): Promise<AddAddressResponse> {
  return apiClient.post<AddAddressResponse>('/addresses', addressData);
}

/**
 * Update address
 */
export async function updateAddress(
  addressId: string,
  addressData: Partial<AddAddressRequest>,
): Promise<UpdateAddressResponse> {
  return apiClient.put<UpdateAddressResponse>(
    `/addresses/${addressId}`,
    addressData,
  );
}

/**
 * Delete address
 */
export async function deleteAddress(
  addressId: string,
): Promise<DeleteAddressResponse> {
  return apiClient.delete<DeleteAddressResponse>(`/addresses/${addressId}`);
}

/**
 * Set address as default
 */
export async function setDefaultAddress(
  addressId: string,
): Promise<SetDefaultAddressResponse> {
  return apiClient.put<SetDefaultAddressResponse>(
    `/addresses/${addressId}/default`,
    {},
  );
}
