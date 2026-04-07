import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Calendar, 
  Phone, 
  MapPin, 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle,
  ShoppingCart,
  User,
  CreditCard,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fetchSimpleOrderOptions, useUpdateSimpleOrderStatus } from '@/queries/simple-order/options';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import type { SimpleOrder } from '@/queries/simple-order/type';

export const Route = createFileRoute('/_dashboard/simple-orders/$id')({
  head: ({ params }) => ({
    meta: [{ title: `Simple захиалга #${params.id} | Gerar` }],
  }),
  component: SimpleOrderDetailPage,
  loader: ({ params }): { id: string } => {
    return { id: params.id };
  },
});

function SimpleOrderDetailPage() {
  const { id } = Route.useLoaderData() as { id: string };
  const navigate = useNavigate();
  
  const { data: order, isLoading, isError } = useQuery(fetchSimpleOrderOptions(id));
  const updateStatusMutation = useUpdateSimpleOrderStatus();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('mn-MN', {
      year: 'numeric',
      month: 'long',
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

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
      toast.success(`Төлөв "${statusLabels[newStatus] || newStatus}" болж шинэчлэгдлээ`);
    } catch (error) {
      toast.error('Төлөв шинэчлэхэд алдаа гарлаа');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[400px] w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[150px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-12 w-12" />
        </div>
        <h2 className="text-xl font-semibold">Захиалга олдсонгүй</h2>
        <p className="text-muted-foreground">Захиалгын ID буруу эсвэл устгагдсан байж магадгүй.</p>
        <Button onClick={() => navigate({ to: '/simple-orders' })}>Буцах</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 fade-in">
      {/* Navigation and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate({ to: '/simple-orders' })} 
            className="group -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Simple захиалгууд руу буцах
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black tracking-tight">Захиалга #{order.id}</h1>
            {getStatusBadge(order.status)}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(order.createdAt)}
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-4 w-4" />
              {order.phoneNumber}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
            <>
              {order.status === 'PENDING' && (
                <Button 
                  onClick={() => handleStatusUpdate('PROCESSING')}
                  className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Боловсруулах
                </Button>
              )}
              {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                <Button 
                  onClick={() => handleStatusUpdate('DELIVERING')}
                  className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20"
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Хүргэлт эхлүүлэх
                </Button>
              )}
              {order.status === 'DELIVERING' && (
                <Button 
                  onClick={() => handleStatusUpdate('DELIVERED')}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Хүргэгдсэн гэж тэмдэглэх
                </Button>
              )}
              <Button 
                variant="destructive" 
                onClick={() => handleStatusUpdate('CANCELLED')}
                className="shadow-lg shadow-red-600/20"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Цуцлах
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Items Table */}
          <Card className="border-none shadow-xl overflow-hidden glassmorphism">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2 font-bold">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                  Захиалгын бараанууд
                </CardTitle>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {order.items.length} бараа
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="w-[50%] font-bold">Бараа</TableHead>
                    <TableHead className="text-center font-bold">Тоо ширхэг</TableHead>
                    <TableHead className="text-right font-bold">Үнэ</TableHead>
                    <TableHead className="text-right font-bold">Нийт</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, index) => (
                    <TableRow key={index} className="hover:bg-muted/5 transition-colors border-b last:border-0">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-xl border bg-card overflow-hidden flex-shrink-0 shadow-sm flex items-center justify-center">
                            {item.product?.firstImage ? (
                              <img src={item.product.firstImage} alt={item.product?.name} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-8 w-8 text-muted-foreground/30" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-lg leading-tight">{item.product?.name || 'Нэр байхгүй'}</p>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{item.product?.description || 'Тайлбар байхгүй'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-black text-lg">{item.quantity}</TableCell>
                      <TableCell className="text-right font-medium">{formatPrice(item.price)}</TableCell>
                      <TableCell className="text-right font-black text-primary text-lg">
                        {formatPrice(parseFloat(item.price) * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-8 bg-muted/20 flex flex-col items-end gap-3">
                <div className="flex justify-between w-full max-w-[300px] text-muted-foreground font-medium">
                  <span>Дэд дүн:</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between w-full max-w-[300px] text-2xl font-black border-t-2 border-primary/20 pt-4 mt-2">
                  <span className="text-foreground">Нийт төлөх:</span>
                  <span className="text-primary">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          {/* Customer Info */}
          <Card className="border-none shadow-xl overflow-hidden glassmorphism">
            <CardHeader className="bg-blue-600 text-white pb-6">
              <CardTitle className="text-lg flex items-center gap-2 font-bold">
                <User className="h-5 w-5" />
                Хэрэглэгчийн мэдээлэл
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-black shadow-inner">
                  {order.phoneNumber.slice(-1)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-0.5">Утасны дугаар</p>
                  <p className="text-2xl font-black tracking-tighter">{order.phoneNumber}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-6">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2 text-primary">
                    <MapPin className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Хүргэлтийн хаяг</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed bg-muted/30 p-3 rounded-lg border">
                    {order.address}
                  </p>
                </div>
                
                {order.addressNote && (
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2 text-amber-600">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Нэмэлт тэмдэглэл</span>
                    </div>
                    <p className="text-sm italic text-amber-700 bg-amber-50 p-4 rounded-lg border border-amber-200">
                      "{order.addressNote}"
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card className="border-none shadow-xl overflow-hidden glassmorphism">
            <CardHeader className="bg-emerald-600 text-white pb-6">
              <CardTitle className="text-lg flex items-center gap-2 font-bold">
                <CreditCard className="h-5 w-5" />
                Төлбөр
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-6 bg-emerald-50 rounded-2xl border border-emerald-100 mb-4">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">Төлбөрийн хэлбэр</span>
                <span className="text-xl font-black text-emerald-700 italic">BELASH (БЭЛЭН)</span>
              </div>
              <div className="flex justify-between items-center px-2">
                <span className="text-sm font-bold text-muted-foreground uppercase">Төлөв:</span>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 font-black">
                  ТӨЛБӨР БЭЛНЭЭР
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
