import { z } from 'zod';

/** Used when admin marks order as out for delivery; backend sends SMS: Таны #<orderId> хүргэлтэд гарлаа. GERAR.MN */
export const STATUS_DELIVERY_STARTED = 'DELIVERY_STARTED';

/** Orders cancelled via admin SMS confirmation flow (code sent to user, admin confirms). */
export const STATUS_CANCELLED_BY_ADMIN = 'CANCELLED_BY_ADMIN';

export const CANCELLED_STATUSES = ['CANCELLED', STATUS_CANCELLED_BY_ADMIN] as const;

export function isOrderCancelled(status: string): boolean {
  return CANCELLED_STATUSES.includes(status as (typeof CANCELLED_STATUSES)[number]);
}

export const OrderItemSchema = z.object({
  id: z.number(),
  orderId: z.union([z.number(), z.string()]),
  productId: z.number(),
  quantity: z.number(),
  price: z.string(),
  itemType: z.union([z.enum(['STANDARD', 'POINT', 'POINT_PRODUCT']), z.string()]).default('STANDARD'),
  pointsPrice: z.union([z.number(), z.string()]).optional().nullable(),
  product: z.object({
    name: z.string(),
    description: z.string().optional().nullable(),
    price: z.string().optional().nullable(),
    images: z.array(z.string()).optional().nullable(),
    firstImage: z.string().optional().nullable(),
    category: z.any().optional(),
    categories: z.array(z.any()).optional(),
  }).passthrough().optional().nullable(),
  pointProduct: z.object({
    name: z.string(),
    description: z.string().optional().nullable(),
    pointsPrice: z.union([z.number(), z.string()]).optional().nullable(),
    images: z.array(z.string()).optional().nullable(),
    firstImage: z.string().optional().nullable(),
  }).passthrough().optional().nullable(),
}).passthrough();

/** Delivery address on order (shape may vary); null for guest orders without address. */
const OrderAddressSchema = z.union([z.object({}).passthrough(), z.null()]).optional();

export const OrderSchema = z.object({
  /** Order ID in format YYMMDDNNN (e.g. "260126001"). */
  id: z.string(),
  userId: z.number().nullable(),
  addressId: z.number().nullable().optional(),
  deliveryTimeSlot: z.string().nullable().optional(),
  deliveryDate: z.string().nullable().optional(),
  totalAmount: z.string(),
  status: z.union([
    z.enum(['PENDING', 'PAID', 'COMPLETED', 'CANCELLED', 'CANCELLED_BY_ADMIN', 'DELIVERED', 'DELIVERY_STARTED']),
    z.string(), // Allow any string status (e.g. "Хүргэгдсэн")
  ]),
  paymentStatus: z.string().optional(),
  /** Contact info from order form; used for guest orders when user is null. */
  contactFullName: z.string().optional().nullable(),
  contactPhoneNumber: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  earnedPoints: z.number().default(0),
  usedPoints: z.number().default(0),
  /** Registered user: { id, phoneNumber, name }; null for guest orders. */
  user: z
    .object({
      id: z.number(),
      phoneNumber: z.string(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  address: OrderAddressSchema.optional(),
  items: z.array(OrderItemSchema),
}).passthrough();

export const OrdersResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(OrderSchema),
});

/** Query params for advanced order search (GET /admin/orders/all?...) */
export interface OrderSearchFilters {
  orderId?: string;
  status?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  deliveryDateFrom?: string;
  deliveryDateTo?: string;
  phone?: string;
  name?: string;
  totalMin?: number;
  totalMax?: number;
  deliveryTimeSlot?: string;
  excludeCancelled?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'totalAmount' | 'status' | 'paymentStatus' | 'deliveryDate';
  sortOrder?: 'asc' | 'desc';
}

/** Response shape when calling GET /admin/orders/all with any query param (advanced search) */
export const SearchOrdersResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(OrderSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type OrdersResponse = z.infer<typeof OrdersResponseSchema>;
export type SearchOrdersResponse = z.infer<typeof SearchOrdersResponseSchema>;

export interface SearchOrdersResult {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Single event in order timeline (GET /api/admin/orders/:id/timeline). */
export const OrderTimelineEventSchema = z.object({
  id: z.number(),
  orderId: z.string(),
  type: z.enum(['ORDER_CREATED', 'STATUS_CHANGED', 'PAYMENT_STATUS_CHANGED', 'MESSAGE_SENT']),
  title: z.string(),
  description: z.string().nullable(),
  fromValue: z.string().nullable(),
  toValue: z.string().nullable(),
  channel: z.string().nullable(),
  performedBy: z.number().nullable(),
  createdAt: z.string(),
  performer: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .nullable(),
  _synthetic: z.boolean().optional(),
}).passthrough();

export const OrderTimelineResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(OrderTimelineEventSchema),
});

export type OrderTimelineEvent = z.infer<typeof OrderTimelineEventSchema>;
export type OrderTimelineResponse = z.infer<typeof OrderTimelineResponseSchema>;

/** Ebarimt (receipt) info for printing – GET /api/admin/orders/:id/ebarimt */
export const OrderEbarimtSchema = z
  .object({
    ebarimtId: z.string().nullable().optional(),
    receiptUrl: z.string().nullable().optional(),
    /** Delivery fee in MNT (0–50k→5k, 50k–90k→3k, >90k→0). */
    deliveryFee: z.number().nullable().optional(),
    delivery_fee: z.number().nullable().optional(),
    /** Full receipt payload (testing / when receipt_url is null) – accept both snake_case and camelCase */
    ebarimt_id: z.string().optional(),
    receipt_url: z.string().nullable().optional(),
    ebarimt_receipt_id: z.string().optional().nullable(),
    ebarimt_qr_data: z.string().optional().nullable(),
    ebarimt_status: z.string().optional().nullable(),
    ebarimt_lottery: z.string().optional().nullable(),
    ebarimt_by: z.string().optional().nullable(),
    ebarimt_receiver_type: z.string().optional().nullable(),
    ebarimt_receiver: z.string().optional().nullable(),
    ebarimt_receiver_phone: z.string().optional().nullable(),
    amount: z.string().optional().nullable(),
    vat_amount: z.string().optional().nullable(),
    city_tax_amount: z.string().optional().nullable(),
    merchant_register_no: z.string().optional().nullable(),
    merchant_tin: z.string().optional().nullable(),
    barimt_status: z.string().optional().nullable(),
    barimt_status_date: z.string().optional().nullable(),
    paid_by: z.string().optional().nullable(),
    object_type: z.string().optional().nullable(),
    note: z.string().optional().nullable(),
    created_date: z.string().optional().nullable(),
    ebarimtQrData: z.string().optional().nullable(),
    ebarimtLottery: z.string().optional().nullable(),
    ebarimtReceiptId: z.string().optional().nullable(),
    ebarimtAmount: z.string().optional().nullable(),
    ebarimtVatAmount: z.string().optional().nullable(),
    ebarimtCityTaxAmount: z.string().optional().nullable(),
  })
  .passthrough();
export const OrderEbarimtResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: OrderEbarimtSchema,
});
export type OrderEbarimt = z.infer<typeof OrderEbarimtSchema>;
export type OrderEbarimtResponse = z.infer<typeof OrderEbarimtResponseSchema>;
