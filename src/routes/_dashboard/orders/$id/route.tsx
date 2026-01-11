import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { fetchOrderOptions } from '@/queries/order/options';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/orders/$id')({
  component: OrderDetailPage,
  loader: ({ params }) => {
    return { orderId: Number(params.id) };
  },
});

function OrderDetailPage() {
  const { orderId } = Route.useLoaderData();
  const { data: order, isLoading } = useQuery(fetchOrderOptions(orderId));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: 'secondary',
      COMPLETED: 'default',
      CANCELLED: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Order not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Order #{order.id}</h1>
        <p className="text-muted-foreground">Order details and information</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Name:</span>
              <p className="text-lg">{order.user?.name || "N/A"}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Phone:</span>
              <p className="text-lg">{order.user?.phoneNumber || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              <div className="mt-1">{getStatusBadge(order.status)}</div>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Created:</span>
              <p className="text-lg">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Last Updated:</span>
              <p className="text-lg">{formatDate(order.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>{order.items.length} items in this order</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.product?.name || 'N/A'}
                  </TableCell>
                  <TableCell>{item.product?.category?.name || 'N/A'}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatPrice(item.price)}</TableCell>
                  <TableCell className="text-right">
                    {formatPrice(parseFloat(item.price) * item.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Separator className="my-4" />
          <div className="flex justify-end">
            <div className="space-y-2 text-right">
              <div className="text-lg font-semibold">
                Total: {formatPrice(order.totalAmount)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
