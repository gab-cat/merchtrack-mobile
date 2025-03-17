import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be positive'),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  categoryId: z.string().min(1, 'Category is required'),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  tags: z.array(z.string()).optional(),
});

export const orderSchema = z.object({
  products: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one product is required'),
  shippingAddress: z.string().min(1, 'Shipping address is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
});

export const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  imageUrl: z.string().url('Invalid image URL').optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
export type OrderFormData = z.infer<typeof orderSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;