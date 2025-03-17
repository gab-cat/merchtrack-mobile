import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '../api';
import type { Product, Order, User } from '@prisma/client';
import { QueryParams } from '@/types/common';

export function useProducts(params: QueryParams) {
  const api = useApiClient();
  
  return useQuery({
    queryKey: ['products'],
    queryFn: () => api.post<Product[]>('/products', {
      ...params,
    }),
  });
}

export function useProduct(id: string, params: QueryParams) {
  const api = useApiClient();
  
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => api.post<Product>(`/products/${id}`, {
      ...params
    }),
    enabled: !!id,
  });
}

export function useOrders(params: QueryParams) {
  const api = useApiClient();
  
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => api.post<Order[]>('/orders', {
      ...params
    }),
  });
}

export function useOrder(id: string, params: QueryParams) {
  const api = useApiClient();
  
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => api.post<Order>(`/orders/${id}`, {
      ...params
    }),
    enabled: !!id,
  });
}

export function useProfile(id: string) {
  const api = useApiClient();
  
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<User>(`/users/${id}`),
    enabled: !!id,
  });
}

export function useUserImageQuery(id: string) {
  const api = useApiClient();
  
  return useQuery({
    queryKey: ['user-image'],
    queryFn: () => api.get<string>(`/users/image/${id}`),
    enabled: !!id,
  });
}