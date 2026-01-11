import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchCategoriesOptions } from '@/queries/category/options';
import { fetchProductsOptions } from '@/queries/product/options';
import { fetchOrdersOptions } from '@/queries/order/options';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, ShoppingCart, FolderTree, TrendingUp } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/')({
  component: DashboardHome,
});

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  isLoading?: boolean;
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
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardHome() {
  const { data: categories = [], isLoading: categoriesLoading } = useQuery(
    fetchCategoriesOptions(),
  );
  const { data: products = [], isLoading: productsLoading } = useQuery(
    fetchProductsOptions(),
  );
  const { data: orders = [], isLoading: ordersLoading } = useQuery(
    fetchOrdersOptions(),
  );

  const totalCategories = categories.length;
  const totalProducts = products.length;
  const totalOrders = orders.length;

  // Calculate statistics
  const totalRevenue = orders
    .filter((order) => order.status === 'COMPLETED')
    .reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

  const completedOrders = orders.filter((order) => order.status === 'COMPLETED').length;
  const pendingOrders = orders.filter((order) => order.status === 'PENDING').length;

  // Low stock products (stock < 10)
  const lowStockProducts = products.filter((product) => product.stock < 10).length;

  // Out of stock products
  const outOfStockProducts = products.filter((product) => product.stock === 0).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Самбар</h1>
        <p className="text-muted-foreground">
          Админ самбарын тойм
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Нийт бараа"
          value={totalProducts}
          description={`${lowStockProducts} үлдэгдэл бага, ${outOfStockProducts} дууссан`}
          icon={Package}
          isLoading={productsLoading}
        />
        <StatCard
          title="Нийт ангилал"
          value={totalCategories}
          icon={FolderTree}
          isLoading={categoriesLoading}
        />
        <StatCard
          title="Нийт захиалга"
          value={totalOrders}
          description={`${completedOrders} хүргэгдсэн, ${pendingOrders} хүлээгдэж буй`}
          icon={ShoppingCart}
          isLoading={ordersLoading}
        />
        <StatCard
          title="Нийт орлого"
          value={formatPrice(totalRevenue)}
          description="Хүргэгдсэн захиалгуудаас"
          icon={TrendingUp}
          isLoading={ordersLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Сүүлийн захиалгууд</CardTitle>
            <CardDescription>Сүүлийн 5 захиалга</CardDescription>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Одоогоор захиалга байхгүй байна</p>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">Захиалгын дугаар #{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.user?.name || 'Unknown'} •{' '}
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatPrice(order.totalAmount)}
                      </p>
                      <p className="text-sm text-muted-foreground">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Нөөц багатай бараанууд</CardTitle>
            <CardDescription>Дахин нөхөх шаардлагатай бараанууд</CardDescription>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : lowStockProducts === 0 && outOfStockProducts === 0 ? (
              <p className="text-sm text-muted-foreground">
                Бүх бараа нөөцтэй байна
              </p>
            ) : (
              <div className="space-y-4">
                {products
                  .filter((product) => product.stock < 10)
                  .slice(0, 5)
                  .map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.category?.name || 'Ангилалгүй'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-medium ${
                            product.stock === 0 ? 'text-destructive' : ''
                          }`}
                        >
                          {product.stock} нөөцтэй
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
