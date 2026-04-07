import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Eye, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { fetchSimpleOrdersOptions } from '@/queries/simple-order/options';
import { Skeleton } from '@/components/ui/skeleton';
import type { SimpleOrder } from '@/queries/simple-order/type';
import { formatPrice } from '@/lib/utils';

const TITLE = 'Simple захиалга | Gerar';

export const Route = createFileRoute('/_dashboard/simple-orders/')({
  head: () => ({ meta: [{ title: TITLE }] }),
  component: SimpleOrdersPage,
});

function SimpleOrdersPage() {
  const navigate = useNavigate();
  const { data: orders, isLoading, isError } = useQuery(fetchSimpleOrdersOptions());

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Шинэ',
    PROCESSING: 'Боловсруулж буй',
    DELIVERING: 'Хүргэлтэд гарсан',
    DELIVERED: 'Хүргэгдсэн',
    CANCELLED: 'Цуцлагдсан',
  };

  const getStatusBadge = (status: SimpleOrder['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">{statusLabels[status]}</Badge>;
      case 'PROCESSING':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">{statusLabels[status]}</Badge>;
      case 'DELIVERING':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">{statusLabels[status]}</Badge>;
      case 'DELIVERED':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">{statusLabels[status]}</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">{statusLabels[status]}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4 text-destructive">
          <XCircle className="h-12 w-12" />
        </div>
        <h2 className="text-xl font-semibold">Алдаа гарлаа</h2>
        <p className="text-muted-foreground">Захиалгын жагсаалтыг ачаалж чадсангүй.</p>
        <Button onClick={() => window.location.reload()}>Дахин оролдох</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Simple захиалга</h1>
          <p className="text-muted-foreground">Утасны дугаараар баталгаажсан шууд захиалгууд</p>
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-md">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Захиалгын жагсаалт</CardTitle>
              <CardDescription>Нийт {orders?.length ?? 0} захиалга олдлоо</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[80px] font-semibold">ID</TableHead>
                <TableHead className="font-semibold">Утас</TableHead>
                <TableHead className="font-semibold">Хаяг</TableHead>
                <TableHead className="font-semibold">Нийт дүн</TableHead>
                <TableHead className="font-semibold">Төлөв</TableHead>
                <TableHead className="font-semibold">Огноо</TableHead>
                <TableHead className="text-right font-semibold">Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-lg">
                    Захиалга байхгүй байна.
                  </TableCell>
                </TableRow>
              ) : (
                orders?.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-primary">#{order.id}</TableCell>
                    <TableCell className="font-semibold">{order.phoneNumber}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={order.address}>
                        {order.address}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-green-600 dark:text-green-400">
                      {formatPrice(order.totalAmount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-primary/10 hover:text-primary"
                        onClick={() => navigate({ to: '/simple-orders/$id', params: { id: order.id.toString() } })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
