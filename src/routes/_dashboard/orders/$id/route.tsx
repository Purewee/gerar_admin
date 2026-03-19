import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { fetchOrderOptions, fetchOrderTimelineOptions, useRequestCancellation, useConfirmCancellation, useUpdateOrderStatus } from '@/queries/order/options';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  XCircle, 
  ShieldCheck, 
  Truck, 
  PackageCheck, 
  Clock, 
  Mail, 
  MessageSquare, 
  CreditCard, 
  ShoppingCart, 
  ArrowRightCircle, 
  MapPin, 
  Printer, 
  Calendar, 
  User, 
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { STATUS_DELIVERY_STARTED } from '@/queries/order/type';
import type { OrderTimelineEvent } from '@/queries/order/type';
import { EbarimtReceiptDialog } from '@/components/ebarimt-receipt-dialog';
import { fetchOrderEbarimtOptions } from '@/queries/order/options';
import { useNavigate } from '@tanstack/react-router';

const DELIVERY_TIME_SLOTS = [
  { value: '10-14', label: '10:00 - 14:00' },
  { value: '14-18', label: '14:00 - 18:00' },
  { value: '18-21', label: '18:00 - 21:00' },
  { value: '21-00', label: '21:00 - 00:00' },
];

/** Map API timeline titles (EN) to Mongolian. */
const TIMELINE_TITLE_MN: Record<string, string> = {
  'Order placed': 'Захиалга үүсгэсэн',
  'Payment confirmed': 'Төлбөр баталгаажсан',
  'Payment receipt email sent': 'Төлбөрийн баримт имэйл илгээсэн',
  'Status updated': 'Төлөв шинэчлэгдсэн',
  'Delivery started SMS sent': 'Хүргэлт эхэлсэн мэдэгдэл SMS илгээсэн',
  'Order delivered SMS sent': 'Хүргэгдсэн мэдэгдэл SMS илгээсэн',
  'Cancellation code sent to user': 'Цуцлах код хэрэглэгч рүү илгээсэн',
};
/** Map API timeline descriptions (EN) to Mongolian. */
const TIMELINE_DESC_MN: Record<string, string> = {
  'User notified that delivery has started': 'Хэрэглэгчид хүргэлт эхэлсэн мэдэгдэл өгсөн',
  'User notified that order has been delivered': 'Хэрэглэгчид захиалга хүргэгдсэн мэдэгдэл өгсөн',
};

/** Deduplicate: keep only the first ORDER_CREATED (API may return synthetic + DB row). */
function deduplicateOrderCreated(events: OrderTimelineEvent[]): OrderTimelineEvent[] {
  let seenOrderCreated = false;
  return events.filter((e) => {
    if (e.type === 'ORDER_CREATED') {
      if (seenOrderCreated) return false;
      seenOrderCreated = true;
    }
    return true;
  });
}

function OrderTimeline({
  events,
  formatDate,
  getStatusLabel,
}: {
  events: OrderTimelineEvent[];
  formatDate: (date: string) => string;
  getStatusLabel: (value: string | null | undefined) => string | null;
}) {
  const displayEvents = deduplicateOrderCreated(events);

  const getEventIcon = (event: OrderTimelineEvent) => {
    switch (event.type) {
      case 'ORDER_CREATED':
        return <ShoppingCart className="h-4 w-4 text-muted-foreground" />;
      case 'PAYMENT_STATUS_CHANGED':
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'MESSAGE_SENT':
        return event.channel === 'email' ? (
          <Mail className="h-4 w-4 text-blue-600" />
        ) : (
          <MessageSquare className="h-4 w-4 text-amber-600" />
        );
      case 'STATUS_CHANGED':
        return <ArrowRightCircle className="h-4 w-4 text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTitle = (event: OrderTimelineEvent) =>
    TIMELINE_TITLE_MN[event.title] ?? event.title;
  const getDescription = (event: OrderTimelineEvent) =>
    (event.description && TIMELINE_DESC_MN[event.description]) ?? event.description;

  return (
    <ul className="relative space-y-0">
      {displayEvents.map((event, index) => (
        <li key={`${event.id}-${index}`} className="relative flex gap-3 pb-6 last:pb-0">
          {index < displayEvents.length - 1 && (
            <span
              className="absolute left-[11px] top-6 bottom-0 w-px bg-border"
              aria-hidden
            />
          )}
          <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted">
            {getEventIcon(event)}
          </span>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm font-medium">{getTitle(event)}</p>
            {(event.type === 'STATUS_CHANGED' || event.type === 'PAYMENT_STATUS_CHANGED') &&
              (event.fromValue != null || event.toValue != null) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {getStatusLabel(event.fromValue) ?? event.fromValue} → {getStatusLabel(event.toValue) ?? event.toValue}
              </p>
            )}
            {getDescription(event) && (
              <p className="text-xs text-muted-foreground mt-0.5">{getDescription(event)}</p>
            )}
            {event.performer?.name && (
              <p className="text-xs text-muted-foreground mt-0.5">Хийсэн: {event.performer.name}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{formatDate(event.createdAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export const Route = createFileRoute('/_dashboard/orders/$id')({
  head: ({ params }) => ({
    meta: [{ title: `Захиалга #${params.id} | Gerar` }],
  }),
  component: OrderDetailPage,
  loader: ({ params }): { orderId: string } => {
    return { orderId: params.id };
  },
});

function OrderDetailPage() {
  const { orderId } = Route.useLoaderData() as { orderId: string };
  
  // Fetch order by ID via GET /api/admin/orders/:id (admin can view any order)
  const { data: order, isLoading } = useQuery(fetchOrderOptions(orderId));
  const { data: timelineEvents = [], isLoading: timelineLoading } = useQuery({
    ...fetchOrderTimelineOptions(orderId),
    enabled: !!orderId,
  });
  
  const requestCancellationMutation = useRequestCancellation();
  const confirmCancellationMutation = useConfirmCancellation();
  const updateOrderStatusMutation = useUpdateOrderStatus();
  
  const [showConfirmRequestDialog, setShowConfirmRequestDialog] = useState(false);
  const [showCancellationDialog, setShowCancellationDialog] = useState(false);
  const [showEbarimtDialog, setShowEbarimtDialog] = useState(false);
  const [cancellationCode, setCancellationCode] = useState('');

  const navigate = useNavigate();

  const { data: ebarimtData } = useQuery({
    ...fetchOrderEbarimtOptions(orderId),
    enabled: !!orderId && order?.status !== 'PENDING' && !order?.status?.startsWith('CANCEL'),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('mn-MN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDeliveryDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDeliveryTimeSlotLabel = (slot: string | null | undefined) => {
    if (!slot) return null;
    const found = DELIVERY_TIME_SLOTS.find((s) => s.value === slot);
    return found ? found.label : slot;
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Төлбөр хүлээгдэх',
    PAID: 'Төлбөр төлөгдсөн',
    COMPLETED: 'Төлбөр төлөгдсөн',
    CANCELLED: 'Цуцлагдсан',
    CANCELLED_BY_ADMIN: 'Цуцлагдсан (админ баталгаажуулсан)',
    DELIVERED: 'Хүргэгдсэн',
    [STATUS_DELIVERY_STARTED]: 'Хүргэлт эхэлсэн',
    'Хүргэгдсэн': 'Хүргэгдсэн', // Handle Mongolian status string from backend
  };

  /** Resolve status label for timeline fromValue/toValue. */
  const getStatusLabel = (value: string | null | undefined) => {
    if (value == null || value === '') return null;
    return statusLabels[value] ?? value;
  };

  const formatAddress = (address: any) => {
    if (!address) return 'Байхгүй';
    const parts = [
      address.provinceOrDistrict,
      address.khorooOrSoum,
      address.neighborhood,
      address.street,
      address.residentialComplex,
      address.building && `Барилга ${address.building}`,
      address.entrance && `Орц ${address.entrance}`,
      address.apartmentNumber && `Апартамент ${address.apartmentNumber}`,
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'Байхгүй';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: 'secondary',
      PAID: 'default',
      COMPLETED: 'default',
      CANCELLED: 'destructive',
      CANCELLED_BY_ADMIN: 'destructive',
      DELIVERED: 'default',
      [STATUS_DELIVERY_STARTED]: 'outline',
      'Хүргэгдсэн': 'default', // Handle Mongolian status string from backend
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {statusLabels[status] ?? status}
      </Badge>
    );
  };

  // Check if order can be cancelled (paid/completed orders only; must have phone for SMS – user or guest contact)
  const canCancelOrder =
    order &&
    (order.status === 'PAID' || order.status === 'COMPLETED') &&
    (order.user?.phoneNumber ?? order.contactPhoneNumber);

  const handleRequestCancellation = async () => {
    if (!order) return;

    try {
      await requestCancellationMutation.mutateAsync(orderId);
      toast.success('Цуцлах код SMS-аар илгээгдлээ. Хэрэглэгчээс кодыг авч баталгаажуулна уу.');
      setShowConfirmRequestDialog(false);
      setShowCancellationDialog(true);
    } catch (error) {
      // Check if error message suggests SMS was sent despite the error
      const errorMessage = error instanceof Error ? error.message : 'Цуцлах код илгээхэд алдаа гарлаа';
      
      // If the error mentions "sms result" or similar, the SMS might have been sent
      // but there was a backend error in the response handling
      if (errorMessage.toLowerCase().includes('sms') || errorMessage.toLowerCase().includes('result')) {
        console.warn('SMS may have been sent despite error:', errorMessage);
        // Still proceed with the cancellation flow since SMS was likely sent
        toast.warning('Код илгээгдсэн байж магадгүй. Хэрэв хэрэглэгч SMS хүлээн авсан бол үргэлжлүүлнэ үү.');
        setShowConfirmRequestDialog(false);
        setShowCancellationDialog(true);
      } else {
        toast.error(errorMessage);
        setShowConfirmRequestDialog(false);
      }
    }
  };

  const handleConfirmCancellation = async () => {
    if (!cancellationCode.trim() || cancellationCode.length !== 4) {
      toast.error('4 оронтой кодыг оруулна уу');
      return;
    }

    try {
      await confirmCancellationMutation.mutateAsync({
        orderId,
        code: cancellationCode.trim(),
      });
      toast.success('Захиалга амжилттай цуцлагдлаа');
      setShowCancellationDialog(false);
      setCancellationCode('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Цуцлах баталгаажуулахад алдаа гарлаа';
      toast.error(errorMessage);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!order) return;

    try {
      await updateOrderStatusMutation.mutateAsync({
        orderId,
        status,
      });
      const isSmsSentStatus = status === 'Хүргэгдсэн' || status === 'DELIVERED' || status === STATUS_DELIVERY_STARTED;
      toast.success(
        `Захиалгын төлөв "${statusLabels[status] ?? status}" болгож шинэчлэгдлээ${isSmsSentStatus ? ". Хэрэглэгчид SMS илгээгдсэн." : ""}`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Төлөв шинэчлэхэд алдаа гарлаа';
      toast.error(errorMessage);
    }
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
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-muted-foreground text-lg">Захиалга олдсонгүй</div>
        <p className="text-sm text-muted-foreground">
          Захиалгын ID: {orderId}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Dynamic Breadcrumbs / Back button */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/orders' })} className="h-8 px-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Захиалгууд
        </Button>
        <ChevronRight className="h-4 w-4 opacity-50" />
        <span className="font-medium text-foreground">Захиалга #{order.id}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight">#{order.id}</h1>
            <div className="animate-in fade-in slide-in-from-left-2 duration-500">
              {getStatusBadge(order.status)}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(order.createdAt)}
            </div>
            {order.paymentStatus && (
              <div className="flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5" />
                {order.paymentStatus}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {ebarimtData && (
            <Button variant="outline" size="sm" onClick={() => setShowEbarimtDialog(true)}>
              <Printer className="h-4 w-4 mr-2" />
              Ебаримт харах
            </Button>
          )}
          {canCancelOrder && (
            <Button variant="destructive" size="sm" onClick={() => setShowConfirmRequestDialog(true)} disabled={requestCancellationMutation.isPending}>
              <XCircle className="h-4 w-4 mr-2" />
              Цуцлах
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Захиалгын бараанууд
                </CardTitle>
                <Badge variant="outline" className="font-mono">
                  {order.items.length} бараа
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10 hover:bg-muted/10">
                    <TableHead className="w-[45%]">Бараа</TableHead>
                    <TableHead className="text-center">Тоо</TableHead>
                    <TableHead>Нэгж үнэ</TableHead>
                    <TableHead className="text-right">Нийт</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id} className="group transition-colors hover:bg-muted/5">
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {item.product?.name || 'Байхгүй'}
                          </span>
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {item.product?.categories?.[0]?.name ?? item.product?.category?.name ?? 'Ангилалгүй'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{formatPrice(item.price)}</TableCell>
                      <TableCell className="text-right font-bold whitespace-nowrap">
                        {formatPrice(parseFloat(item.price) * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-6 bg-muted/20 border-t flex flex-col items-end gap-2">
                <div className="flex justify-between w-full max-w-[240px] text-sm text-muted-foreground">
                  <span>Дэд дүн:</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between w-full max-w-[240px] text-lg font-bold border-t pt-2 mt-1">
                  <span className="text-foreground">Нийт төлөх:</span>
                  <span className="text-primary">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Төлөв өөрчлөлтийн түүх
              </CardTitle>
              <CardDescription>Захиалгын явцын дэлгэрэнгүй түүх</CardDescription>
            </CardHeader>
            <CardContent>
              {timelineLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <div className="space-y-2 flex-1 pt-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : timelineEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground italic">
                   Мэдээлэл байхгүй байна
                </div>
              ) : (
                <div className="pl-2 pt-2">
                  <OrderTimeline events={timelineEvents} formatDate={formatDate} getStatusLabel={getStatusLabel} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (Right) */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Хэрэглэгч
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {(order.user?.name || order.contactFullName || '?').charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{order.user?.name ?? order.contactFullName ?? "Байхгүй"}</p>
                  <p className="text-xs text-muted-foreground">{order.user?.phoneNumber ?? (order.contactPhoneNumber || "Байхгүй")}</p>
                </div>
              </div>
              
              <Separator className="opacity-50" />
              
              <div className="space-y-3">
                <div className="grid gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Имэйл</span>
                  <p className="text-sm break-all font-medium">{order.contactEmail || 'Мэдээлэлгүй'}</p>
                </div>
                {order.userId && (
                  <Button variant="outline" size="sm" className="w-full h-8 text-[11px]" onClick={() => navigate({ to: `/users/${order.userId}` })}>
                    Хэрэглэгчийн профайл
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {ebarimtData && (
            <Card className="border-none shadow-sm overflow-hidden bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-widest">
                  <Printer className="h-4 w-4" />
                  Ебаримт
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="flex flex-col items-center justify-center py-4 bg-white rounded-lg border border-primary/20 shadow-inner">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Cугалааны дугаар</span>
                  <span className="text-3xl font-black text-primary font-mono tracking-tighter">
                    {(ebarimtData as any).ebarimt_lottery || (ebarimtData as any).ebarimtLottery || '—'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[11px] px-1">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground font-medium">Төлөв:</span>
                    <span className="font-bold flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-green-600" />
                      {(ebarimtData as any).ebarimt_status || (ebarimtData as any).barimt_status || 'Олгосон'}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-muted-foreground font-medium">ДДТД:</span>
                    <span className="font-mono truncate" title={(ebarimtData as any).ebarimt_receipt_id || (ebarimtData as any).ebarimtReceiptId}>
                      {((ebarimtData as any).ebarimt_receipt_id || (ebarimtData as any).ebarimtReceiptId || '—').slice(-8)}
                    </span>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full h-8 text-xs font-bold border-primary/30 hover:bg-primary/10" onClick={() => setShowEbarimtDialog(true)}>
                  Дэлгэрэнгүй харах
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Хүргэлт
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold font-mono">Төлөв</span>
                <div>{getStatusBadge(order.status)}</div>
              </div>

              <div className="grid gap-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold font-mono">Цаг хугацаа</span>
                <p className="text-sm font-medium">
                  {order.deliveryDate ? (
                    [formatDeliveryDate(order.deliveryDate), getDeliveryTimeSlotLabel(order.deliveryTimeSlot)].filter(Boolean).join(' · ')
                  ) : (
                    <span className="text-muted-foreground italic">Ороогүй</span>
                  )}
                </p>
              </div>

              {order.address ? (
                <div className="grid gap-1 pt-2 border-t">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold font-mono">Хаяг</span>
                  <p className="text-sm leading-relaxed">{formatAddress(order.address)}</p>
                  {(order.address as any).addressNote && (
                    <div className="bg-muted/50 p-2 rounded text-xs italic text-muted-foreground mt-2 border-l-2 border-primary/30">
                      "{(order.address as any).addressNote}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-2 border-t text-xs text-muted-foreground italic">Хаягийн мэдээлэл байхгүй</div>
              )}

              {/* Status Update Actions */}
              {(order.status === 'PAID' || order.status === 'COMPLETED' || order.status === STATUS_DELIVERY_STARTED) && (
                <div className="pt-4 border-t space-y-2">
                  {(order.status === 'PAID' || order.status === 'COMPLETED') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(STATUS_DELIVERY_STARTED)}
                      disabled={updateOrderStatusMutation.isPending}
                      className="w-full justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    >
                      <Truck className="mr-2 h-4 w-4" />
                      {updateOrderStatusMutation.isPending ? 'Түр хүлээ...' : 'Хүргэлтэд гаргах'}
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleUpdateStatus('Хүргэгдсэн')}
                    disabled={updateOrderStatusMutation.isPending}
                    className="w-full justify-start bg-green-600 hover:bg-green-700"
                  >
                    <PackageCheck className="mr-2 h-4 w-4" />
                    {updateOrderStatusMutation.isPending ? 'Түр хүлээ...' : 'Хүргэлт дуусгах'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ebarimt Dialog with normalized props */}
      {ebarimtData && (
        <EbarimtReceiptDialog 
          open={showEbarimtDialog} 
          onOpenChange={setShowEbarimtDialog} 
          data={ebarimtData} 
          orderId={order.id} 
          items={order.items}
          orderTotalAmount={order.totalAmount}
          receiverName={(order.address as any)?.fullName || order.user?.name || order.contactFullName}
          receiverPhone={(order.address as any)?.phoneNumber || order.user?.phoneNumber || order.contactPhoneNumber}
          address={order.address}
        />
      )}

      {/* Request Cancellation Confirmation Dialog */}
      <Dialog open={showConfirmRequestDialog} onOpenChange={setShowConfirmRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Захиалга цуцлах эсэхийг баталгаажуулах
            </DialogTitle>
            <DialogDescription>
              Та энэ захиалгыг цуцлахдаа итгэлтэй байна уу? Цуцлах код хэрэглэгчийн утас руу SMS-аар илгээгдэх болно.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Захиалгын дугаар:</strong> #{order.id}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Хэрэглэгч:</strong> {order.user?.name ?? order.contactFullName ?? 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Утас:</strong> {order.user?.phoneNumber ?? order.contactPhoneNumber ?? 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Нийт дүн:</strong> {formatPrice(order.totalAmount)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmRequestDialog(false)}
              disabled={requestCancellationMutation.isPending}
            >
              Буцах
            </Button>
            <Button
              variant="destructive"
              onClick={handleRequestCancellation}
              disabled={requestCancellationMutation.isPending}
            >
              {requestCancellationMutation.isPending
                ? 'Код илгээж байна...'
                : 'Тийм, цуцлах'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancellation Code Confirmation Dialog */}
      <Dialog open={showCancellationDialog} onOpenChange={setShowCancellationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Захиалга цуцлах баталгаажуулалт
            </DialogTitle>
            <DialogDescription>
              Хэрэглэгчид SMS-аар илгээсэн 4 оронтой кодыг оруулна уу.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="cancellation-code" className="text-sm font-medium">
                Баталгаажуулах код
              </label>
              <Input
                id="cancellation-code"
                type="text"
                placeholder="1234"
                value={cancellationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setCancellationCode(value);
                }}
                maxLength={4}
                className="mt-2 text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Код 10 минутын дотор хүчинтэй
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancellationDialog(false);
                  setCancellationCode('');
                }}
              >
                Хаах
              </Button>
              <Button
                onClick={handleConfirmCancellation}
                disabled={
                  cancellationCode.length !== 4 || confirmCancellationMutation.isPending
                }
                variant="destructive"
              >
                {confirmCancellationMutation.isPending
                  ? 'Баталгаажуулж байна...'
                  : 'Цуцлах'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
