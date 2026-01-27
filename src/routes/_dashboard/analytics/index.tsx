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
  getRevenueByPaymentMethod,
} from '@/queries/analytics/query';
import { formatPrice } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';
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

export const Route = createFileRoute('/_dashboard/analytics/')({
  component: AnalyticsPage,
});

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading,
  trend,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  isLoading?: boolean;
  trend?: { percentage: number; isPositive: boolean };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <div className="flex items-center mt-2 text-xs">
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={trend.isPositive ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(trend.percentage).toFixed(1)}%
                </span>
                <span className="text-muted-foreground ml-1">өмнөх хугацаатай харьцуулахад</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
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

  // Dashboard summary query
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: getDashboardSummary,
  });

  // Revenue overview query
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
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
  const getTrendsDateRange = () => {
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
  };

  const trendsDateRange = getTrendsDateRange();
  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics', 'trends', trendPeriod, trendsDateRange],
    queryFn: () =>
      getRevenueTrends({
        period: trendPeriod,
        startDate: trendsDateRange.startDate,
        endDate: trendsDateRange.endDate,
      }),
  });

  // Top products query
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['analytics', 'products'],
    queryFn: () => getRevenueByProduct({ limit: 10 }),
  });

  // Top categories query
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['analytics', 'categories'],
    queryFn: () => getRevenueByCategory(),
  });

  // Top customers query
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['analytics', 'customers'],
    queryFn: () => getRevenueByCustomer({ limit: 10 }),
  });

  // Payment methods query
  const { data: paymentMethodsData, isLoading: paymentMethodsLoading } = useQuery({
    queryKey: ['analytics', 'payment-methods'],
    queryFn: () => getRevenueByPaymentMethod(),
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Орлогын шинжилгээ</h1>
        <p className="text-muted-foreground">
          Орлогын нарийвчилсан шинжилгээ ба ойлголтууд
        </p>
      </div>

      {/* Dashboard Summary Cards */}
      {dashboardData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Өнөөдрийн орлого"
            value={formatPrice(dashboardData.periods.today.revenue)}
            description={`${dashboardData.periods.today.orders} захиалга`}
            icon={DollarSign}
            isLoading={dashboardLoading}
            trend={dashboardData.periods.today.comparison}
          />
          <StatCard
            title="Энэ долоо хоног"
            value={formatPrice(dashboardData.periods.thisWeek.revenue)}
            description={`${dashboardData.periods.thisWeek.orders} захиалга`}
            icon={TrendingUp}
            isLoading={dashboardLoading}
            trend={dashboardData.periods.thisWeek.comparison}
          />
          <StatCard
            title="Энэ сар"
            value={formatPrice(dashboardData.periods.thisMonth.revenue)}
            description={`${dashboardData.periods.thisMonth.orders} захиалга`}
            icon={BarChart3}
            isLoading={dashboardLoading}
            trend={dashboardData.periods.thisMonth.comparison}
          />
          <StatCard
            title="Энэ жил"
            value={formatPrice(dashboardData.periods.thisYear.revenue)}
            description={`${dashboardData.periods.thisYear.orders} захиалга`}
            icon={ShoppingCart}
            isLoading={dashboardLoading}
            trend={dashboardData.periods.thisYear.comparison}
          />
        </div>
      )}

      {/* Custom Date Range */}
      <Card>
        <CardHeader>
          <CardTitle>Захиалгат огнооны хүрээний шинжилгээ</CardTitle>
          <CardDescription>Тодорхой хугацааны орлогыг шинжилнэ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="startDate">Эхлэх огноо</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="endDate">Дуусах огноо</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
              />
            </div>
            <Button onClick={handleDateRangeSubmit}>Шинжлэх</Button>
          </div>
          {overviewData && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Хугацааны орлого</p>
                <p className="text-2xl font-bold">
                  {formatPrice(overviewData.period.totalRevenue)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {overviewData.period.totalOrders} захиалга
                </p>
              </div>
              {overviewData.comparison && (
                <div>
                  <p className="text-sm text-muted-foreground">Өсөлт</p>
                  <p
                    className={`text-2xl font-bold ${
                      overviewData.comparison.growth.isPositive
                        ? 'text-green-500'
                        : 'text-red-500'
                    }`}
                  >
                    {overviewData.comparison.growth.isPositive ? '+' : ''}
                    {overviewData.comparison.growth.percentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(Math.abs(overviewData.comparison.growth.absolute))}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Trends */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Орлогын чиг хандлага</CardTitle>
              <CardDescription>Цаг хугацааны явц дахь орлого</CardDescription>
            </div>
            <Select value={trendPeriod} onValueChange={(v) => setTrendPeriod(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Өдөр бүр</SelectItem>
                <SelectItem value="weekly">7 хоног бүр</SelectItem>
                <SelectItem value="monthly">Сар бүр</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : trendsData && trendsData.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Огноо</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Орлого</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Захиалга</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Дундаж захиалгын дүн</p>
                </div>
              </div>
              {trendsData.slice(0, 10).map((point) => (
                <div
                  key={point.date}
                  className="grid grid-cols-4 gap-4 p-2 rounded hover:bg-muted"
                >
                  <div>{new Date(point.date).toLocaleDateString()}</div>
                  <div className="font-medium">{formatPrice(point.revenue)}</div>
                  <div>{point.orderCount}</div>
                  <div>{formatPrice(point.averageOrderValue)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Чиг хандлагын өгөгдөл алга</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Орлогоор тэргүүлэх бүтээгдэхүүнүүд</CardTitle>
            <CardDescription>Хамгийн сайн борлуулалттай бүтээгдэхүүнүүд</CardDescription>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : productsData && productsData.products.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Бүтээгдэхүүн</TableHead>
                    <TableHead className="text-right">Орлого</TableHead>
                    <TableHead className="text-right">Захиалга</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsData.products.map((product) => (
                    <TableRow key={product.productId}>
                      <TableCell className="font-medium">
                        {product.productName}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(product.revenue)}
                      </TableCell>
                      <TableCell className="text-right">{product.orderCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">Бүтээгдэхүүний өгөгдөл алга</p>
            )}
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Ангиллаар орлого</CardTitle>
            <CardDescription>Ангиллын гүйцэтгэлийн задлан</CardDescription>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : categoriesData && categoriesData.categories.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ангилал</TableHead>
                    <TableHead className="text-right">Орлого</TableHead>
                    <TableHead className="text-right">Захиалга</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriesData.categories.map((category) => (
                    <TableRow key={category.categoryId}>
                      <TableCell className="font-medium">
                        {category.categoryName}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(category.revenue)}
                      </TableCell>
                      <TableCell className="text-right">{category.orderCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">Ангиллын өгөгдөл алга</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Тэргүүлэх хэрэглэгчид</CardTitle>
            <CardDescription>Хамгийн өндөр үнэ цэнтэй хэрэглэгчид</CardDescription>
          </CardHeader>
          <CardContent>
            {customersLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : customersData && customersData.customers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Хэрэглэгч</TableHead>
                    <TableHead className="text-right">Орлого</TableHead>
                    <TableHead className="text-right">Захиалга</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customersData.customers.map((customer) => (
                    <TableRow key={customer.userId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.userName}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.phoneNumber}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(customer.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right">{customer.orderCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">Хэрэглэгчийн өгөгдөл алга</p>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Төлбөрийн хэлбэрээр орлого</CardTitle>
            <CardDescription>Төлбөрийн хэлбэрийн бүтэц</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentMethodsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : paymentMethodsData && paymentMethodsData.paymentMethods.length > 0 ? (
              <div className="space-y-4">
                {paymentMethodsData.paymentMethods.map((method) => (
                  <div key={method.paymentMethod} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{method.paymentMethod}</span>
                      <span className="text-sm text-muted-foreground">
                        {method.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {formatPrice(method.revenue)}
                      </span>
                      <span className="text-muted-foreground">
                        {method.orderCount} захиалга
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${method.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Төлбөрийн хэлбэрийн өгөгдөл алга
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
