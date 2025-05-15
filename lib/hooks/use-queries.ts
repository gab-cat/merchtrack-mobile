import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '../api';
import type { Product, Order, User, Payment } from '@prisma/client';
import { ApiResponse, QueryParams } from '@/types/common';

export function useProducts(params: QueryParams) {
  const api = useApiClient();
  
  return useQuery({
    queryKey: ['products'],
    queryFn: () => api.post<ApiResponse<Product[]>>('/products', {
      ...params,
    }),
  });
}

export function useProduct(id: string, params: QueryParams = {}) {
  const api = useApiClient();
  
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => api.post<ApiResponse<Product>>(`/products/${id}`, {
      ...params
    }),
    enabled: !!id,
  });
}

export function useOrders(params: QueryParams) {
  const api = useApiClient();

  return useQuery({
    queryKey: ['orders'],
    queryFn: () => api.post<ApiResponse<Order[]>>('/orders', {
      ...params
    }),
  });
}

export function useOrder(id: string, params: QueryParams) {
  const api = useApiClient();
  
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => api.post<ApiResponse<Order>>(`/orders/${id}`, {
      ...params
    }),
    enabled: !!id,
  });
}

export function usePayments(params: QueryParams) {
  const api = useApiClient();

  return useQuery({
    queryKey: ['payments'],
    queryFn: () => api.post<ApiResponse<Payment[]>>('/payments', {
      ...params
    }),
  });
}

export function usePayment(id: string, params: QueryParams) {
  const api = useApiClient();

  return useQuery({
    queryKey: ['payments', id],
    queryFn: () => api.post<ApiResponse<Payment>>(`/payments/${id}`, {
      ...params
    }),
    enabled: !!id,
  });
}

      
export function useProfile(id: string) {
  const api = useApiClient();
  
  return useQuery({
    queryKey: ['profile', id],
    queryFn: () => api.get<ApiResponse<User>>(`/users/${id}`),
    enabled: !!id,
  });
}

export function useUserImageQuery(id: string) {
  const api = useApiClient();
  
  return useQuery({
    queryKey: ['user-image', id],
    queryFn: () => api.get<ApiResponse<string>>(`/users/image/${id}`),
    enabled: !!id,
  });
}