import { z } from 'zod';

export const AddressSchema = z.object({
  id: z.number(),
  userId: z.number(),
  label: z.string().nullable(),
  fullName: z.string(),
  phoneNumber: z.string(),
  provinceOrDistrict: z.string(),
  khorooOrSoum: z.string(),
  street: z.string().nullable(),
  neighborhood: z.string().nullable(),
  residentialComplex: z.string().nullable(),
  building: z.string().nullable(),
  entrance: z.string().nullable(),
  apartmentNumber: z.string().nullable(),
  addressNote: z.string().nullable(),
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const OrderItemSchema = z.object({
  id: z.number(),
  quantity: z.number(),
  price: z.string(),
  product: z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().optional(),
    price: z.string(),
    images: z.array(z.string()).optional(),
    categories: z.array(z.object({
      id: z.number(),
      name: z.string(),
    })).optional(),
  }).optional(),
});

export const UserOrderSchema = z.object({
  id: z.number(),
  status: z.string(),
  totalAmount: z.string(),
  deliveryTimeSlot: z.string().nullable(),
  address: AddressSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(OrderItemSchema).optional(),
});

export const UserSchema = z.object({
  id: z.number(),
  phoneNumber: z.string(),
  email: z.string().nullable(),
  name: z.string(),
  role: z.enum(['USER', 'ADMIN']),
  createdAt: z.string(),
  updatedAt: z.string(),
  _count: z.object({
    orders: z.number(),
    addresses: z.number(),
    favorites: z.number().optional(),
    cartItems: z.number().optional(),
  }).optional(),
});

export const UserDetailSchema = UserSchema.extend({
  addresses: z.array(AddressSchema).optional(),
  orders: z.array(UserOrderSchema).optional(),
});

export const UsersResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.array(UserSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }).optional(),
});

export const UserResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: UserDetailSchema,
});

export type User = z.infer<typeof UserSchema>;
export type UserDetail = z.infer<typeof UserDetailSchema>;
export type UsersResponse = z.infer<typeof UsersResponseSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
