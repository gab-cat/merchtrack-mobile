import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../api';
import type { Product, Order } from '@prisma/client';

interface ProductInput {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  images?: string[];
  tags?: string[];
}

interface OrderInput {
  products: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: string;
  paymentMethod: string;
}

export function useCreateProduct() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ProductInput) => 
      api.post<Product>('/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductInput> }) =>
      api.put<Product>(`/products/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
    },
  });
}

export function useDeleteProduct() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      api.delete<void>(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useCreateOrder() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: OrderInput) =>
      api.post<Order>('/orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateOrder() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OrderInput> }) =>
      api.put<Order>(`/orders/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', variables.id] });
    },
  });
}

export function useUpdateProfile() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { firstName?: string; lastName?: string; imageUrl?: string }) =>
      api.put('/users/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}