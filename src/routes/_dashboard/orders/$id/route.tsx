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
import { XCircle, ShieldCheck, Truck, PackageCheck, Clock, Mail, MessageSquare, CreditCard, ShoppingCart, ArrowRightCircle } from 'lucide-react';
import { STATUS_DELIVERY_STARTED } from '@/queries/order/type';
import type { OrderTimelineEvent } from '@/queries/order/type';

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
  const [cancellationCode, setCancellationCode] = useState('');

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
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Захиалга #{order.id}</h1>
        <p className="text-muted-foreground">Захиалгын дэлгэрэнгүй мэдээлэл</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Хэрэглэгчийн мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Нэр:</span>
              <p className="text-lg">{order.user?.name ?? order.contactFullName ?? "Байхгүй"}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Утас:</span>
              <p className="text-lg">{order.user?.phoneNumber ?? order.contactPhoneNumber ?? "Байхгүй"}</p>
            </div>
            {(order.contactEmail ?? undefined) && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Имэйл:</span>
                <p className="text-lg">{order.contactEmail}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Захиалгын мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Төлөв:</span>
              <div className="mt-1">{getStatusBadge(order.status)}</div>
            </div>
            {(order.status === 'PAID' || order.status === 'COMPLETED' || order.status === STATUS_DELIVERY_STARTED) && (
              <div className="pt-4 border-t space-y-2">
                {(order.status === 'PAID' || order.status === 'COMPLETED') && (
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus(STATUS_DELIVERY_STARTED)}
                    disabled={updateOrderStatusMutation.isPending}
                    className="w-full text-amber-600 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-200"
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    {updateOrderStatusMutation.isPending
                      ? 'Шинэчлэж байна...'
                      : 'Хүргэлтэд гарсан'}
                  </Button>
                )}
                <Button
                  variant="default"
                  onClick={() => handleUpdateStatus('Хүргэгдсэн')}
                  disabled={updateOrderStatusMutation.isPending}
                  className="w-full bg-green-600 text-white hover:bg-green-700 hover:text-white"
                >
                  <PackageCheck className="mr-2 h-4 w-4" />
                  {updateOrderStatusMutation.isPending
                    ? 'Шинэчлэж байна...'
                    : 'Хүргэгдсэн болгох'}
                </Button>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-muted-foreground">Хүргэлтийн огноо, цаг:</span>
              <p className="text-lg">
                {order.deliveryDate ? (
                  [formatDeliveryDate(order.deliveryDate), getDeliveryTimeSlotLabel(order.deliveryTimeSlot)].filter(Boolean).join(' · ') || '—'
                ) : (
                  '—'
                )}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Үүсгэсэн:</span>
              <p className="text-lg">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Сүүлд шинэчлэгдсэн:</span>
              <p className="text-lg">{formatDate(order.updatedAt)}</p>
            </div>
            {canCancelOrder && (
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => setShowConfirmRequestDialog(true)}
                  disabled={requestCancellationMutation.isPending}
                  className="w-full"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Захиалга цуцлах
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Төлөв өөрчлөлтийн түүх
          </CardTitle>
          <CardDescription>
            Захиалга үүсгэсэн, төлбөр баталгаажсан, мессеж илгээсэн, төлөв өөрчлөлт
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timelineLoading ? (
            <ul className="space-y-4">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex gap-3">
                  <Skeleton className="h-3 w-3 shrink-0 mt-1.5 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </li>
              ))}
            </ul>
          ) : timelineEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Түүх байхгүй байна.</p>
          ) : (
            <OrderTimeline events={timelineEvents} formatDate={formatDate} getStatusLabel={getStatusLabel} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Захиалгын бараанууд</CardTitle>
          <CardDescription>Энэ захиалгад {order.items.length} бараа</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Бараа</TableHead>
                <TableHead>Ангилал</TableHead>
                <TableHead>Тоо ширхэг</TableHead>
                <TableHead>Нэгжийн үнэ</TableHead>
                <TableHead className="text-right">Дэд дүн</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.product?.name || 'Байхгүй'}
                  </TableCell>
                  <TableCell>
                    {item.product?.categories?.[0]?.name ?? item.product?.category?.name ?? 'Байхгүй'}
                  </TableCell>
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
                Нийт: {formatPrice(order.totalAmount)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
              Цуцлах
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
