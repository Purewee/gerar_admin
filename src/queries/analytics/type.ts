import { z } from 'zod';

// Revenue Overview Types
export const RevenueByStatusSchema = z.object({
  status: z.string(),
  revenue: z.number(),
  orderCount: z.number(),
});

export const RevenueByPaymentStatusSchema = z.object({
  paymentStatus: z.string(),
  revenue: z.number(),
  orderCount: z.number(),
});

export const OrderCountsByStatusSchema = z.object({
  status: z.string(),
  count: z.number(),
});

export const PreviousPeriodSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  totalRevenue: z.number(),
  totalOrders: z.number(),
});

export const GrowthSchema = z.object({
  percentage: z.number(),
  absolute: z.number(),
  isPositive: z.boolean(),
});

export const ComparisonSchema = z.object({
  previousPeriod: PreviousPeriodSchema,
  growth: GrowthSchema,
});

export const AllTimeRevenueSchema = z.object({
  totalRevenue: z.number(),
  totalOrders: z.number(),
});

export const PeriodRevenueSchema = z.object({
  totalRevenue: z.number(),
  totalOrders: z.number(),
  averageOrderValue: z.number(),
});

export const RevenueOverviewDataSchema = z.object({
  allTime: AllTimeRevenueSchema,
  period: PeriodRevenueSchema,
  revenueByStatus: z.array(RevenueByStatusSchema),
  revenueByPaymentStatus: z.array(RevenueByPaymentStatusSchema),
  orderCountsByStatus: z.array(OrderCountsByStatusSchema),
  comparison: ComparisonSchema.optional(),
});

export const RevenueOverviewResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: RevenueOverviewDataSchema,
  meta: z.object({
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    compareWithPrevious: z.boolean().optional(),
  }),
});

// Revenue Trends Types
export const TrendDataPointSchema = z.object({
  date: z.string(),
  revenue: z.number(),
  orderCount: z.number(),
  averageOrderValue: z.number(),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
});

export const RevenueTrendsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(TrendDataPointSchema),
  meta: z.object({
    period: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    groupBy: z.string().nullable().optional(),
  }),
});

// Revenue by Product Types
export const ProductRevenueSchema = z.object({
  productId: z.number(),
  productName: z.string(),
  revenue: z.number(),
  quantity: z.number(),
  orderCount: z.number(),
  averageOrderValue: z.number(),
});

export const RevenueByProductResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    products: z.array(ProductRevenueSchema),
    total: z.number(),
  }),
  meta: z.object({
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    limit: z.number(),
    sortBy: z.string(),
    sortOrder: z.string(),
  }),
});

// Revenue by Category Types
export const CategoryRevenueSchema = z.object({
  categoryId: z.number(),
  categoryName: z.string(),
  parentId: z.number().nullable(),
  revenue: z.number(),
  orderCount: z.number(),
  productCount: z.number(),
  averageOrderValue: z.number(),
});

export const RevenueByCategoryResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    categories: z.array(CategoryRevenueSchema),
    total: z.number(),
  }),
  meta: z.object({
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    includeSubcategories: z.boolean(),
  }),
});

// Revenue by Customer Types
export const CustomerRevenueSchema = z.object({
  userId: z.number(),
  userName: z.string(),
  phoneNumber: z.string(),
  email: z.string().nullable(),
  totalRevenue: z.number(),
  orderCount: z.number(),
  averageOrderValue: z.number(),
});

export const RevenueByCustomerResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    customers: z.array(CustomerRevenueSchema),
    total: z.number(),
  }),
  meta: z.object({
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    limit: z.number(),
    sortBy: z.string(),
    sortOrder: z.string(),
  }),
});

// Revenue by Payment Method Types
export const PaymentMethodRevenueSchema = z.object({
  paymentMethod: z.string(),
  revenue: z.number(),
  orderCount: z.number(),
  percentage: z.number(),
  averageOrderValue: z.number(),
});

export const RevenueByPaymentMethodResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    paymentMethods: z.array(PaymentMethodRevenueSchema),
    total: z.number(),
    totalRevenue: z.number(),
  }),
  meta: z.object({
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
  }),
});

// Dashboard Summary Types
export const PeriodComparisonSchema = z.object({
  percentage: z.number(),
  absolute: z.number(),
  isPositive: z.boolean(),
});

export const PeriodDataSchema = z.object({
  revenue: z.number(),
  orders: z.number(),
  comparison: PeriodComparisonSchema,
});

export const DashboardSummaryDataSchema = z.object({
  periods: z.object({
    today: PeriodDataSchema,
    thisWeek: PeriodDataSchema,
    thisMonth: PeriodDataSchema,
    thisYear: PeriodDataSchema,
  }),
  topProducts: z.array(ProductRevenueSchema),
  topCategories: z.array(CategoryRevenueSchema),
  trend: z.array(TrendDataPointSchema),
});

export const DashboardSummaryResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: DashboardSummaryDataSchema,
});

// Type exports
export type RevenueByStatus = z.infer<typeof RevenueByStatusSchema>;
export type RevenueByPaymentStatus = z.infer<typeof RevenueByPaymentStatusSchema>;
export type OrderCountsByStatus = z.infer<typeof OrderCountsByStatusSchema>;
export type PreviousPeriod = z.infer<typeof PreviousPeriodSchema>;
export type Growth = z.infer<typeof GrowthSchema>;
export type Comparison = z.infer<typeof ComparisonSchema>;
export type AllTimeRevenue = z.infer<typeof AllTimeRevenueSchema>;
export type PeriodRevenue = z.infer<typeof PeriodRevenueSchema>;
export type RevenueOverviewData = z.infer<typeof RevenueOverviewDataSchema>;
export type RevenueOverviewResponse = z.infer<typeof RevenueOverviewResponseSchema>;

export type TrendDataPoint = z.infer<typeof TrendDataPointSchema>;
export type RevenueTrendsResponse = z.infer<typeof RevenueTrendsResponseSchema>;

export type ProductRevenue = z.infer<typeof ProductRevenueSchema>;
export type RevenueByProductResponse = z.infer<typeof RevenueByProductResponseSchema>;

export type CategoryRevenue = z.infer<typeof CategoryRevenueSchema>;
export type RevenueByCategoryResponse = z.infer<typeof RevenueByCategoryResponseSchema>;

export type CustomerRevenue = z.infer<typeof CustomerRevenueSchema>;
export type RevenueByCustomerResponse = z.infer<typeof RevenueByCustomerResponseSchema>;

export type PaymentMethodRevenue = z.infer<typeof PaymentMethodRevenueSchema>;
export type RevenueByPaymentMethodResponse = z.infer<typeof RevenueByPaymentMethodResponseSchema>;

export type PeriodComparison = z.infer<typeof PeriodComparisonSchema>;
export type PeriodData = z.infer<typeof PeriodDataSchema>;
export type DashboardSummaryData = z.infer<typeof DashboardSummaryDataSchema>;
export type DashboardSummaryResponse = z.infer<typeof DashboardSummaryResponseSchema>;
