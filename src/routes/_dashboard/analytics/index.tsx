import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getDashboardSummary,
  getRevenueOverview,
  getRevenueTrends,
  getRevenueByProduct,
  getRevenueByCategory,
  getRevenueByCustomer,
} from '@/queries/analytics/query';
import { formatPrice, cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  BarChart3,
  Users,
  Package,
  Calendar,
  CreditCard,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heatmap } from '@/components/ui/heatmap';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from 'recharts';
import { getUsers } from '@/queries/user/query';
import { getProducts } from '@/queries/product/query';
import { getAllOrders } from '@/queries/order/query';

const TITLE = 'Аналитик | Gerar';

const statusTranslations: Record<string, string> = {
  'PAID': 'Төлөгдсөн',
  'paid': 'Төлөгдсөн',
  'PENDING': 'Хүлээгдэж буй',
  'pending': 'Хүлээгдэж буй',
  'CANCELLED': 'Цуцлагдсан',
  'cancelled': 'Цуцлагдсан',
  'SHIPPED': 'Хүргэгдсэн',
  'shipped': 'Хүргэгдсэн',
  'DELIVERED': 'Хүргэлт дууссан',
  'delivered': 'Хүргэлт дууссан',
};

function translateStatus(status: string) {
  return statusTranslations[status] || status;
}

function aggregateByDate(
  data: { createdAt?: string; created_at?: string }[],
  startDate: string,
  endDate: string,
) {
  const counts: Record<string, number> = {};

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [];
  }

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    counts[dateStr] = 0;
  }

  data.forEach((item) => {
    const rawDate = item.createdAt || item.created_at;
    if (!rawDate) return;
    const dateStr = new Date(rawDate).toISOString().split('T')[0];
    if (counts[dateStr] !== undefined) {
      counts[dateStr]++;
    }
  });

  return Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const Route = createFileRoute('/_dashboard/analytics/')({
  head: () => ({ meta: [{ title: TITLE }] }),
  component: AnalyticsPage,
});

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 100 },
  },
};

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading,
  trend,
  color = "blue",
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  isLoading?: boolean;
  trend?: { percentage: number; isPositive: boolean };
  color?: "blue" | "emerald" | "violet" | "amber";
}) {
  const colorMap = {
    blue: "from-blue-500/10 to-blue-500/5 text-blue-500 border-blue-500/20",
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-500 border-emerald-500/20",
    violet: "from-violet-500/10 to-violet-500/5 text-violet-500 border-violet-500/20",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-500 border-amber-500/20",
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="overflow-hidden border-none bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", colorMap[color])} />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={cn("p-2 rounded-lg bg-background/80 shadow-sm", colorMap[color])}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <>
              <div className="text-3xl font-bold tracking-tight">{value}</div>
              {description && (
                <p className="text-xs text-muted-foreground mt-1 font-medium">{description}</p>
              )}
              {trend && (
                <div className="flex items-center mt-3 text-xs">
                  <div className={cn(
                    "flex items-center px-1.5 py-0.5 rounded-full mr-2",
                    trend.isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                  )}>
                    {trend.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    <span className="font-bold">{Math.abs(trend.percentage).toFixed(1)}%</span>
                  </div>
                  <span className="text-muted-foreground">өмнөх хугацаанаас</span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [activeHeatmapTab, setActiveHeatmapTab] = useState('orders');
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState<string | null>(null);
  const [viewAllType, setViewAllType] = useState<'products' | 'categories' | 'customers' | null>(null);
  const [viewAllPage, setViewAllPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Dashboard summary query
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: getDashboardSummary,
  });

  // Revenue overview query
  const { data: overviewData } = useQuery({
    queryKey: ['analytics', 'overview', dateRange],
    queryFn: () =>
      getRevenueOverview({
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
        compareWithPrevious: true,
      }),
    enabled: showCustomRange && !!dateRange.startDate && !!dateRange.endDate,
  });

  // Revenue trends query
  const getTrendsDateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();

    if (trendPeriod === 'daily') {
      start.setDate(start.getDate() - 30);
    } else if (trendPeriod === 'weekly') {
      start.setDate(start.getDate() - 90);
    } else {
      start.setMonth(start.getMonth() - 12);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [trendPeriod]);

  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics', 'trends', trendPeriod, getTrendsDateRange],
    queryFn: () =>
      getRevenueTrends({
        period: trendPeriod,
        startDate: getTrendsDateRange.startDate,
        endDate: getTrendsDateRange.endDate,
      }),
  });

  // Heatmap date range (Last 1 year)
  const heatmapDateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, []);

  // All Heatmap Queries
  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['analytics', 'all-users'],
    queryFn: () => getUsers({ limit: 5000 }),
  });

  const { data: allProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['analytics', 'all-products'],
    queryFn: () => getProducts({ limit: 5000 }),
  });

  const { data: allOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['analytics', 'all-orders'],
    queryFn: getAllOrders,
  });

  // Data Aggregations for Heatmap
  const heatmapDataMap = useMemo(() => {
    const users = allUsers?.users ? aggregateByDate(allUsers.users, heatmapDateRange.startDate, heatmapDateRange.endDate) : [];
    const products = allProducts?.products ? aggregateByDate(allProducts.products, heatmapDateRange.startDate, heatmapDateRange.endDate) : [];
    const processedOrders = allOrders?.filter(o => o.status !== 'CANCELLED' && o.status !== 'cancelled') || [];
    const orders = aggregateByDate(processedOrders, heatmapDateRange.startDate, heatmapDateRange.endDate);
    const payments = aggregateByDate(processedOrders.filter(o => o.paymentStatus === 'PAID' || o.paymentStatus === 'paid' || o.status === 'PAID'), heatmapDateRange.startDate, heatmapDateRange.endDate);

    return { users, products, orders, payments };
  }, [allUsers, allProducts, allOrders, heatmapDateRange]);

  const { data: productsData, isLoading: topProductsLoading } = useQuery({
    queryKey: ['analytics', 'products'],
    queryFn: () => getRevenueByProduct({ limit: 100 }),
  });

  const { data: categoriesData, isLoading: topCategoriesLoading } = useQuery({
    queryKey: ['analytics', 'categories'],
    queryFn: () => getRevenueByCategory(),
  });

  const { data: customersData, isLoading: topCustomersLoading } = useQuery({
    queryKey: ['analytics', 'customers'],
    queryFn: () => getRevenueByCustomer({ limit: 100 }),
  });

  const handleDateRangeSubmit = () => {
    if (dateRange.startDate && dateRange.endDate) {
      setShowCustomRange(true);
      queryClient.invalidateQueries({
        queryKey: ['analytics', 'overview', dateRange],
      });
    }
  };


  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 p-1"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Аналитик
          </h1>
          <p className="text-muted-foreground mt-1">
            Таны бизнесийн гол үзүүлэлтүүд ба чиг хандлага
          </p>
        </motion.div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Өнөөдрийн орлого"
          value={dashboardData ? formatPrice(dashboardData.periods.today.revenue) : '0₮'}
          description={`${dashboardData?.periods.today.orders || 0} захиалга`}
          icon={DollarSign}
          isLoading={dashboardLoading}
          trend={dashboardData?.periods.today.comparison}
          color="blue"
        />
        <StatCard
          title="Энэ долоо хоног"
          value={dashboardData ? formatPrice(dashboardData.periods.thisWeek.revenue) : '0₮'}
          description={`${dashboardData?.periods.thisWeek.orders || 0} захиалга`}
          icon={TrendingUp}
          isLoading={dashboardLoading}
          trend={dashboardData?.periods.thisWeek.comparison}
          color="emerald"
        />
        <StatCard
          title="Энэ сар"
          value={dashboardData ? formatPrice(dashboardData.periods.thisMonth.revenue) : '0₮'}
          description={`${dashboardData?.periods.thisMonth.orders || 0} захиалга`}
          icon={BarChart3}
          isLoading={dashboardLoading}
          trend={dashboardData?.periods.thisMonth.comparison}
          color="violet"
        />
        <StatCard
          title="Энэ жил"
          value={dashboardData ? formatPrice(dashboardData.periods.thisYear.revenue) : '0₮'}
          description={`${dashboardData?.periods.thisYear.orders || 0} захиалга`}
          icon={ShoppingCart}
          isLoading={dashboardLoading}
          trend={dashboardData?.periods.thisYear.comparison}
          color="amber"
        />
      </div>

      {/* Activity Heatmap Redesign */}
      <motion.div variants={itemVariants}>
        <Card className="border-none shadow-sm bg-background/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                  Үйл ажиллагааны идэвх
                </CardTitle>
                <CardDescription>Сүүлийн нэг жилийн идэвхжүүлэлтийн тойм</CardDescription>
              </div>

              <Tabs
                value={activeHeatmapTab}
                onValueChange={setActiveHeatmapTab}
                className="w-full md:w-auto"
              >
                <TabsList className="bg-background/80 p-1 border shadow-sm">
                  <TabsTrigger value="orders" className="flex items-center gap-2">
                    <ShoppingCart className="h-3.5 w-3.5" /> Захиалга
                  </TabsTrigger>
                  <TabsTrigger value="payments" className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5" /> Төлбөр
                  </TabsTrigger>
                  <TabsTrigger value="users" className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" /> Хэрэглэгч
                  </TabsTrigger>
                  <TabsTrigger value="products" className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5" /> Бүтээгдэхүүн
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="pt-8 px-8">
            <Heatmap
              data={heatmapDataMap[activeHeatmapTab as keyof typeof heatmapDataMap] || []}
              startDate={new Date(heatmapDateRange.startDate)}
              endDate={new Date(heatmapDateRange.endDate)}
              loading={ordersLoading || usersLoading || productsLoading}
              selectedDate={selectedHeatmapDate}
              onDateSelect={setSelectedHeatmapDate}
              className="py-2"
              colorScale={activeHeatmapTab === 'payments' ? [
                "bg-muted/30",
                "bg-amber-500/20",
                "bg-amber-500/40",
                "bg-amber-500/70",
                "bg-amber-500",
              ] : activeHeatmapTab === 'users' ? [
                "bg-muted/30",
                "bg-violet-500/20",
                "bg-violet-500/40",
                "bg-violet-500/70",
                "bg-violet-500",
              ] : undefined}
            />
          </CardContent>

          <Dialog open={!!selectedHeatmapDate} onOpenChange={(open) => !open && setSelectedHeatmapDate(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center">
                  <Calendar className="h-5 w-5 mr-3 text-primary" />
                  {selectedHeatmapDate && new Date(selectedHeatmapDate).toLocaleDateString('mn-MN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {activeHeatmapTab === 'orders' ? 'Захиалгын идэвх' :
                    activeHeatmapTab === 'payments' ? 'Төлбөрийн идэвх' :
                      activeHeatmapTab === 'users' ? 'Шинэ хэрэглэгчид' : 'Шинэ бүтээгдэхүүнүүд'}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4">
                {selectedHeatmapDate && (
                  <div className="grid gap-4">
                    {activeHeatmapTab === 'orders' || activeHeatmapTab === 'payments' ? (
                      <div className="space-y-4">
                        {(() => {
                          const filtered = allOrders?.filter(o => {
                            const isProcessed = o.status !== 'CANCELLED' && o.status !== 'cancelled';
                            if (!isProcessed) return false;

                            const date = new Date(o.createdAt).toISOString().split('T')[0];
                            if (activeHeatmapTab === 'payments') {
                              return date === selectedHeatmapDate && (o.paymentStatus === 'PAID' || o.paymentStatus === 'paid' || o.status === 'PAID');
                            }
                            return date === selectedHeatmapDate;
                          }) || [];

                          if (filtered.length === 0) {
                            return <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                              <ShoppingCart className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
                              <p className="text-sm text-muted-foreground italic">Энэ өдөр ямар нэгэн бичилт олдсонгүй</p>
                            </div>;
                          }

                          return (
                            <div className="grid gap-2">
                              {filtered.map(order => (
                                <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-background border border-border/50 hover:border-primary/30 transition-all hover:bg-muted/5 group">
                                  <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                      <ShoppingCart className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold">#{order.id}</p>
                                      <p className="text-xs text-muted-foreground font-medium">{order.user?.name || 'Зочин'} • {order.contactPhoneNumber || 'Утасгүй'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-right mr-2">
                                      <p className="text-sm font-bold">{formatPrice(order.totalAmount)}</p>
                                      <p className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full inline-block font-bold uppercase tracking-wider",
                                        order.paymentStatus === 'PAID' || order.paymentStatus === 'paid' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                                      )}>
                                        {translateStatus(order.paymentStatus || order.status)}
                                      </p>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-9 w-9 border border-border/50 hover:bg-primary/10 hover:text-primary transition-all"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`/orders/${order.id}`, '_blank');
                                      }}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    ) : activeHeatmapTab === 'users' ? (
                      <div className="space-y-4">
                        {(() => {
                          const filtered = allUsers?.users?.filter(u => {
                            const rawDate = u.createdAt || (u as any).created_at;
                            if (!rawDate) return false;
                            const date = new Date(rawDate).toISOString().split('T')[0];
                            return date === selectedHeatmapDate;
                          }) || [];

                          if (filtered.length === 0) {
                            return <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                              <Users className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
                              <p className="text-sm text-muted-foreground italic">Шинэ хэрэглэгч бүртгэгдээгүй байна</p>
                            </div>;
                          }

                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {filtered.map(user => (
                                <div key={user.id} className="flex items-center gap-4 p-4 rounded-xl bg-background border border-border/50 hover:bg-muted/5 transition-colors">
                                  <div className="h-12 w-12 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-600 font-bold text-lg">
                                    {user.name?.charAt(0) || 'U'}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.phoneNumber}</p>
                                    <p className="text-[10px] text-muted-foreground/60">
                                      {(user.createdAt || (user as any).created_at)
                                        ? new Date(user.createdAt || (user as any).created_at).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })
                                        : '-'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(() => {
                          const filtered = allProducts?.products?.filter(p => {
                            const rawDate = p.createdAt || (p as any).created_at;
                            if (!rawDate) return false;
                            const date = new Date(rawDate).toISOString().split('T')[0];
                            return date === selectedHeatmapDate;
                          }) || [];

                          if (filtered.length === 0) {
                            return <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                              <Package className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
                              <p className="text-sm text-muted-foreground italic">Шинэ бүтээгдэхүүн нэмэгдээгүй байна</p>
                            </div>;
                          }

                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {filtered.map(product => (
                                <div key={product.id} className="flex items-center gap-4 p-4 rounded-xl bg-background border border-border/50 hover:bg-muted/5 transition-colors">
                                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <Package className="h-6 w-6 text-emerald-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">{product.name}</p>
                                    <p className="text-xs font-semibold text-emerald-600">{formatPrice(product.price)}</p>
                                    <p className="text-[10px] text-muted-foreground/60">
                                      {(product.createdAt || (product as any).created_at)
                                        ? new Date(product.createdAt || (product as any).created_at).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })
                                        : '-'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* View All Modal */}
          <Dialog open={!!viewAllType} onOpenChange={(open) => !open && setViewAllType(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-6">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-bold flex items-center">
                  {viewAllType === 'products' && <Package className="h-6 w-6 mr-3 text-primary" />}
                  {viewAllType === 'categories' && <BarChart3 className="h-6 w-6 mr-3 text-primary" />}
                  {viewAllType === 'customers' && <Users className="h-6 w-6 mr-3 text-primary" />}
                  {viewAllType === 'products' ? 'Тэргүүлэх бүтээгдэхүүнүүд' :
                    viewAllType === 'categories' ? 'Ангиллын задлан (Бүх)' : 'Тэргүүлэх хэрэглэгчид'}
                </DialogTitle>
                <DialogDescription>
                  {viewAllType === 'products' ? 'Бүх бүтээгдэхүүний борлуулалтын үзүүлэлт' :
                    viewAllType === 'categories' ? 'Ангилал тус бүрийн орлогын эзлэх хувь' : 'Хамгийн идэвхтэй хэрэглэгчдийн жагсаалт'}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-1">
                {viewAllType === 'products' && productsData && (
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead>Бүтээгдэхүүн</TableHead>
                        <TableHead className="text-right">Захиалга</TableHead>
                        <TableHead className="text-right">Тоо ширхэг</TableHead>
                        <TableHead className="text-right">Орлого</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productsData.products.slice((viewAllPage - 1) * ITEMS_PER_PAGE, viewAllPage * ITEMS_PER_PAGE).map((product) => (
                        <TableRow key={product.productId} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-bold py-4">{product.productName}</TableCell>
                          <TableCell className="text-right">{product.orderCount}</TableCell>
                          <TableCell className="text-right">{product.quantity}</TableCell>
                          <TableCell className="text-right">
                            <span className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">
                              {formatPrice(product.revenue)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {viewAllType === 'categories' && categoriesData && (
                  <div className="space-y-6 py-4">
                    {categoriesData.categories.slice((viewAllPage - 1) * ITEMS_PER_PAGE, viewAllPage * ITEMS_PER_PAGE).map((cat, i) => {
                      const maxRevenue = Math.max(...categoriesData.categories.map(c => c.revenue));
                      const percentage = (cat.revenue / maxRevenue) * 100;
                      return (
                        <div key={cat.categoryId} className="space-y-2 p-4 rounded-xl border bg-muted/5">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {i + 1 + (viewAllPage - 1) * ITEMS_PER_PAGE}
                              </div>
                              <div>
                                <p className="font-bold">{cat.categoryName}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{cat.productCount} бүтээгдэхүүн • {cat.orderCount} захиалга</p>
                              </div>
                            </div>
                            <span className="text-lg font-black text-primary">{formatPrice(cat.revenue)}</span>
                          </div>
                          <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className="h-full bg-primary rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {viewAllType === 'customers' && customersData && (
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead>Хэрэглэгч</TableHead>
                        <TableHead className="text-right">Захиалга</TableHead>
                        <TableHead className="text-right">Дундаж захиалга</TableHead>
                        <TableHead className="text-right">Нийт дүн</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customersData.customers.slice((viewAllPage - 1) * ITEMS_PER_PAGE, viewAllPage * ITEMS_PER_PAGE).map((customer) => (
                        <TableRow key={customer.userId} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="py-4">
                            <div className="flex flex-col">
                              <span className="font-bold">{customer.userName || 'Unknown'}</span>
                              <span className="text-xs text-muted-foreground">{customer.phoneNumber}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold">{customer.orderCount}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{formatPrice(customer.averageOrderValue)}</TableCell>
                          <TableCell className="text-right">
                            <span className="bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                              {formatPrice(customer.totalRevenue)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Simple Pagination */}
              <div className="pt-6 border-t mt-auto flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Нийт {(() => {
                    if (viewAllType === 'products') return productsData?.total || 0;
                    if (viewAllType === 'categories') return categoriesData?.total || 0;
                    if (viewAllType === 'customers') return customersData?.total || 0;
                    return 0;
                  })()} бичилтээс {(viewAllPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(viewAllPage * ITEMS_PER_PAGE, (viewAllType === 'products' ? productsData?.total : viewAllType === 'categories' ? categoriesData?.total : customersData?.total) || 0)}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={viewAllPage === 1}
                    onClick={() => setViewAllPage(p => p - 1)}
                  >
                    Өмнөх
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(() => {
                      const total = (viewAllType === 'products' ? productsData?.total : viewAllType === 'categories' ? categoriesData?.total : customersData?.total) || 0;
                      return viewAllPage * ITEMS_PER_PAGE >= total;
                    })()}
                    onClick={() => setViewAllPage(p => p + 1)}
                  >
                    Дараах
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Trend Chart */}
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="h-full border-none shadow-sm bg-background/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Орлогын өөрчлөлт</CardTitle>
                <CardDescription>Сүүлийн хугацааны орлогын график</CardDescription>
              </div>
              <Select value={trendPeriod} onValueChange={(v) => setTrendPeriod(v as any)}>
                <SelectTrigger className="w-[130px] h-8 text-xs bg-background/50 border-none shadow-none ring-1 ring-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Өдөр бүр</SelectItem>
                  <SelectItem value="weekly">7 хоног бүр</SelectItem>
                  <SelectItem value="monthly">Сар бүр</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[300px] w-full">
                {trendsLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendsData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.3)" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                        formatter={(value: any) => [formatPrice(Number(value) || 0), 'Орлого']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' })}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Categories Breakdown */}
        <motion.div variants={itemVariants}>
          <Card className="h-full border-none shadow-sm bg-background/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Ангиллын задлан</CardTitle>
              <CardDescription>Нийт борлуулалтын эзлэх хувь</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCategoriesLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))
                ) : categoriesData?.categories.slice(0, 6).map((cat, i) => {
                  const maxRevenue = Math.max(...categoriesData.categories.map(c => c.revenue));
                  const percentage = (cat.revenue / maxRevenue) * 100;

                  return (
                    <div key={cat.categoryId} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{cat.categoryName}</span>
                        <span className="text-muted-foreground">{formatPrice(cat.revenue)}</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className={cn(
                            "h-full rounded-full",
                            i === 0 ? "bg-blue-500" : i === 1 ? "bg-emerald-500" : i === 2 ? "bg-violet-500" : "bg-primary/60"
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button variant="ghost" className="w-full mt-6 text-xs text-muted-foreground" size="sm" onClick={() => { setViewAllType('categories'); setViewAllPage(1); }}>
                Бүх ангиллыг харах <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Products Table Redesign */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-sm bg-background/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Тэргүүлэх бүтээгдэхүүнүүд</CardTitle>
                <CardDescription>Хамгийн өндөр борлуулалттай</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => { setViewAllType('products'); setViewAllPage(1); }}>
                Бүгдийг харах
              </Button>
            </CardHeader>
            <CardContent>
              {topProductsLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-xs">Бүтээгдэхүүн</TableHead>
                      <TableHead className="text-right text-xs">Захиалга</TableHead>
                      <TableHead className="text-right text-xs">Орлого</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsData?.products.slice(0, 5).map((product) => (
                      <TableRow key={product.productId} className="hover:bg-muted/20 border-border/50">
                        <TableCell className="py-3">
                          <span className="font-semibold text-sm">{product.productName}</span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{product.orderCount}</TableCell>
                        <TableCell className="text-right">
                          <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full text-xs font-bold">
                            {formatPrice(product.revenue)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Customers Table Redesign */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-sm bg-background/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Тэргүүлэх хэрэглэгчид</CardTitle>
                <CardDescription>Хамгийн үнэнч хэрэглэгчид</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => { setViewAllType('customers'); setViewAllPage(1); }}>
                Бүгдийг харах
              </Button>
            </CardHeader>
            <CardContent>
              {topCustomersLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-xs">Хэрэглэгч</TableHead>
                      <TableHead className="text-right text-xs">Захиалга</TableHead>
                      <TableHead className="text-right text-xs">Нийт дүн</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customersData?.customers.slice(0, 5).map((customer) => (
                      <TableRow key={customer.userId} className="hover:bg-muted/20 border-border/50">
                        <TableCell className="py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">{customer.userName || 'Unknown'}</span>
                            <span className="text-[10px] text-muted-foreground">{customer.phoneNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{customer.orderCount}</TableCell>
                        <TableCell className="text-right">
                          <span className="bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                            {formatPrice(customer.totalRevenue)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Manual Date Range Analysis - Keep at bottom or in a dialog */}
      <motion.div variants={itemVariants}>
        <Card className="border-dashed bg-muted/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Сонгосон хугацааны шинжилгээ</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Эхлэх огноо</Label>
                <Input
                  id="startDate"
                  type="date"
                  className="h-8 text-xs w-[140px] bg-background"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate" className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Дуусах огноо</Label>
                <Input
                  id="endDate"
                  type="date"
                  className="h-8 text-xs w-[140px] bg-background"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                />
              </div>
              <Button onClick={handleDateRangeSubmit} size="sm" className="h-8 text-xs">Шинжлэх</Button>
            </div>

            <AnimatePresence>
              {overviewData && showCustomRange && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-6 pt-6 border-t overflow-hidden"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Орлого</p>
                      <p className="text-xl font-bold">{formatPrice(overviewData.period.totalRevenue)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Захиалга</p>
                      <p className="text-xl font-bold">{overviewData.period.totalOrders}</p>
                    </div>
                    {overviewData.comparison && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Өсөлт</p>
                        <p className={cn(
                          "text-xl font-bold",
                          overviewData.comparison.growth.isPositive ? 'text-emerald-500' : 'text-red-500'
                        )}>
                          {overviewData.comparison.growth.isPositive ? '+' : ''}{overviewData.comparison.growth.percentage.toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
