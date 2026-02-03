import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Eye, XCircle, Truck, PackageCheck, Loader2, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, LayoutList, Clock, CreditCard, Printer } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { fetchOrdersSearchOptions, useUpdateOrderStatus } from '@/queries/order/options';
import { getOrderEbarimt } from '@/queries/order/query';
import { USE_MOCK_EBARIMT, MOCK_EBARIMT } from '@/queries/order/mock-ebarimt';
import { Skeleton } from '@/components/ui/skeleton';
import { EbarimtReceiptDialog } from '@/components/ebarimt-receipt-dialog';
import type { Order, OrderSearchFilters, OrderEbarimt, OrderItem } from '@/queries/order/type';
import { STATUS_DELIVERY_STARTED, STATUS_CANCELLED_BY_ADMIN } from '@/queries/order/type';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

const DELIVERY_TIME_SLOTS = [
  { value: '10-14', label: '10:00 - 14:00' },
  { value: '14-18', label: '14:00 - 18:00' },
  { value: '18-21', label: '18:00 - 21:00' },
  { value: '21-00', label: '21:00 - 00:00' },
];

const SORT_OPTIONS: { value: OrderSearchFilters['sortBy']; label: string }[] = [
  { value: 'createdAt', label: 'Үүсгэсэн огноо' },
  { value: 'updatedAt', label: 'Шинэчлэгдсэн огноо' },
  { value: 'totalAmount', label: 'Нийт дүн' },
  { value: 'status', label: 'Төлөв' },
  { value: 'paymentStatus', label: 'Төлбөрийн төлөв' },
  { value: 'deliveryDate', label: 'Хүргэлтийн огноо' },
];

const TITLE = 'Захиалга | Gerar';

type PendingAction = 'delivery_started' | 'delivered' | 'cancel' | null;

function OrderRowActions({
  order,
  onOpenConfirm,
  isMutationPending,
  isDelivered,
  onView,
  onPrint,
  isPrintPending,
}: {
  order: Order;
  onOpenConfirm: (orderId: string, action: PendingAction) => void;
  isMutationPending: boolean;
  isDelivered: (status: Order['status']) => boolean;
  onView: (orderId: string) => void;
  onPrint: (orderId: string) => void;
  isPrintPending: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1 md:flex-nowrap">
      {order.status === 'PAID' && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                onClick={() => onOpenConfirm(order.id, 'delivery_started')}
                disabled={isMutationPending}
              >
                {isMutationPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Truck className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Хүргэлтэд гарсан</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => onOpenConfirm(order.id, 'delivered')}
                disabled={isMutationPending}
              >
                {isMutationPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <PackageCheck className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Хүргэгдсэн</TooltipContent>
          </Tooltip>
        </>
      )}
      {order.status === STATUS_DELIVERY_STARTED && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-amber-600 cursor-default"
                disabled
              >
                <Truck className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Хүргэлтэд гарсан</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => onOpenConfirm(order.id, 'delivered')}
                disabled={isMutationPending}
              >
                {isMutationPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <PackageCheck className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Хүргэгдсэн</TooltipContent>
          </Tooltip>
        </>
      )}
      {isDelivered(order.status) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-green-600 cursor-default"
              disabled
            >
              <PackageCheck className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Хүргэгдсэн</TooltipContent>
        </Tooltip>
      )}
      {order.status === 'PAID' && (order.user?.phoneNumber ?? order.contactPhoneNumber) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onOpenConfirm(order.id, 'cancel')}
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Цуцлах</TooltipContent>
        </Tooltip>
      )}
      {order.status === STATUS_CANCELLED_BY_ADMIN && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive cursor-default"
              disabled
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Цуцлагдсан (админ баталгаажуулсан)</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => onPrint(order.id)}
            disabled={isPrintPending}
          >
            {isPrintPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Printer className="h-3.5 w-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Ебаримт хэвлэх</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onView(order.id)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Харах</TooltipContent>
      </Tooltip>
    </div>
  );
}

export const Route = createFileRoute('/_dashboard/orders/')({
  head: () => ({ meta: [{ title: TITLE }] }),
  component: OrdersPage,
});

const defaultAdvancedFilters: OrderSearchFilters = {
  orderId: '',
  phone: '',
  name: '',
  dateFrom: '',
  dateTo: '',
  deliveryDateFrom: '',
  deliveryDateTo: '',
  totalMin: undefined,
  totalMax: undefined,
  deliveryTimeSlot: '',
  paymentStatus: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
};

function OrdersPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [simpleSearch, setSimpleSearch] = useState<string>('');
  const [advancedFilters, setAdvancedFilters] = useState<OrderSearchFilters>(defaultAdvancedFilters);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<OrderSearchFilters>(defaultAdvancedFilters);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
  const [ebarimtDialogOpen, setEbarimtDialogOpen] = useState(false);
  const [ebarimtDialogData, setEbarimtDialogData] = useState<OrderEbarimt | null>(null);
  const [ebarimtDialogItems, setEbarimtDialogItems] = useState<OrderItem[]>([]);
  const [ebarimtDialogOrderId, setEbarimtDialogOrderId] = useState<string | null>(null);
  const [ebarimtReceiverName, setEbarimtReceiverName] = useState<string | null>(null);
  const [ebarimtReceiverPhone, setEbarimtReceiverPhone] = useState<string | null>(null);
  const [ebarimtAddress, setEbarimtAddress] = useState<any>(null);

  const hasStatusFilter = statusFilter !== 'all';

  const searchFilters: OrderSearchFilters = useMemo(() => {
    return {
      ...appliedFilters,
      status: hasStatusFilter ? statusFilter : undefined,
      page: appliedFilters.page ?? 1,
      limit: Math.min(100, Math.max(1, appliedFilters.limit ?? 20)),
      sortBy: appliedFilters.sortBy ?? 'createdAt',
      sortOrder: (appliedFilters.sortOrder === 'asc' || appliedFilters.sortOrder === 'desc') ? appliedFilters.sortOrder : 'desc',
    };
  }, [hasStatusFilter, statusFilter, appliedFilters]);

  const searchQuery = useQuery(fetchOrdersSearchOptions(searchFilters));

  const countFiltersPaid = useMemo(
    () => ({
      ...appliedFilters,
      status: 'PAID',
      page: 1,
      limit: 1,
    }),
    [appliedFilters],
  );
  const countFiltersDeliveryStarted = useMemo(
    () => ({
      ...appliedFilters,
      status: STATUS_DELIVERY_STARTED,
      page: 1,
      limit: 1,
    }),
    [appliedFilters],
  );
  const paidCountQuery = useQuery(fetchOrdersSearchOptions(countFiltersPaid));
  const deliveryStartedCountQuery = useQuery(fetchOrdersSearchOptions(countFiltersDeliveryStarted));
  const paidCount = paidCountQuery.data?.total ?? null;
  const deliveryStartedCount = deliveryStartedCountQuery.data?.total ?? null;

  const isLoading = searchQuery.isLoading;
  const searchResult = searchQuery.data;
  const ordersFromSearch: Order[] = searchResult?.orders ?? [];
  const totalFromSearch = searchResult?.total ?? 0;
  const pageFromSearch = searchResult?.page ?? 1;
  const totalPagesFromSearch = searchResult?.totalPages ?? 1;

  const displayOrders = ordersFromSearch;
  const displayTotal = totalFromSearch;
  const updateOrderStatusMutation = useUpdateOrderStatus();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDeliveryDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDeliveryTimeSlotLabel = (slot: string | null | undefined) => {
    if (!slot) return '';
    const found = DELIVERY_TIME_SLOTS.find((s) => s.value === slot);
    return found ? found.label : slot;
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Төлбөр хүлээгдэх',
    PAID: 'Төлөгдсөн',
    CANCELLED: 'Цуцлагдсан',
    [STATUS_CANCELLED_BY_ADMIN]: 'Цуцлагдсан (админ баталгаажуулсан)',
    DELIVERED: 'Хүргэгдсэн',
    [STATUS_DELIVERY_STARTED]: 'Хүргэлт эхэлсэн',
    'Хүргэгдсэн': 'Хүргэгдсэн', // Handle Mongolian status string from backend
  };

  const getStatusBadge = (status: Order['status']) => {
    const variants = {
      PENDING: 'secondary',
      PAID: 'outline',
      CANCELLED: 'destructive',
      [STATUS_CANCELLED_BY_ADMIN]: 'destructive',
      DELIVERED: 'default',
      [STATUS_DELIVERY_STARTED]: 'outline',
      'Хүргэгдсэн': 'default', // Handle Mongolian status string from backend
    } as const;
    const isPaid = status === 'PAID';
    const isDeliveryStarted = status === STATUS_DELIVERY_STARTED;
    const isDeliveredStatus = status === 'DELIVERED' || status === 'Хүргэгдсэн';

    return (
      <Badge
        variant={variants[status as keyof typeof variants] || 'secondary'}
        className={
          isPaid
            ? 'border-amber-500 bg-amber-400/20 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400'
            : isDeliveryStarted
              ? 'border-lime-500 bg-lime-400/25 text-lime-800 dark:bg-lime-500/25 dark:text-lime-200 dark:border-lime-400'
              : isDeliveredStatus
                ? 'border-green-500 bg-green-500/20 text-green-800 dark:bg-green-500/20 dark:text-green-200 dark:border-green-400'
                : undefined
        }
      >
        {statusLabels[status] ?? status}
      </Badge>
    );
  };

  const isDelivered = (status: Order['status']) => {
    return status === 'DELIVERED' || status === 'Хүргэгдсэн';
  };

  const openConfirm = (orderId: string, action: PendingAction) => {
    setPendingOrderId(orderId);
    setPendingAction(action);
    setConfirmOpen(true);
  };

  const hasEbarimtReceiptContent = (d: OrderEbarimt) => {
    const any = d as Record<string, unknown>;
    return !!(
      any.receipt_url ||
      any.receiptUrl ||
      any.ebarimt_qr_data ||
      any.ebarimtQrData ||
      any.ebarimt_receipt_id ||
      any.ebarimtReceiptId ||
      any.ebarimt_lottery ||
      any.ebarimtLottery ||
      any.amount ||
      any.ebarimtId ||
      any.ebarimt_id
    );
  };

  const handlePrint = async (orderId: string) => {
    setPrintingOrderId(orderId);
    try {
      const order = ordersFromSearch.find((o) => o.id === orderId);
      if (order) {
        setEbarimtDialogItems(order.items);
        setEbarimtReceiverName(order.user?.name ?? order.contactFullName ?? null);
        setEbarimtReceiverPhone(order.user?.phoneNumber ?? order.contactPhoneNumber ?? null);
        setEbarimtAddress(order.address ?? null);
      } else {
        setEbarimtDialogItems([]);
        setEbarimtReceiverName(null);
        setEbarimtReceiverPhone(null);
        setEbarimtAddress(null);
      }

      // Testing: use mock ebarimt data on every print (toggle in src/queries/order/mock-ebarimt.ts)
      if (USE_MOCK_EBARIMT) {
        setEbarimtDialogData(MOCK_EBARIMT);
        setEbarimtDialogOrderId(orderId);
        setEbarimtDialogOpen(true);
        setPrintingOrderId(null);
        return;
      }
      const data = await getOrderEbarimt(orderId);
      const rawUrl = data.receiptUrl ?? (data as Record<string, unknown>).receipt_url;
      const receiptUrl = typeof rawUrl === 'string' ? rawUrl : null;
      if (receiptUrl) {
        window.open(receiptUrl, '_blank', 'noopener,noreferrer');
        toast.success('Ебаримтын хуудас нээгдлээ. Хэвлэх цонхноос хэвлэнэ үү.');
      } else if (hasEbarimtReceiptContent(data)) {
        setEbarimtDialogData(data);
        setEbarimtDialogOrderId(orderId);
        setEbarimtDialogOpen(true);
      } else {
        toast.info(
          data.ebarimtId ?? (data as Record<string, unknown>).ebarimt_id
            ? 'Энэ захиалгын ебаримтын хэвлэх холбоос байхгүй байна.'
            : 'Энэ захиалгад ебаримт байхгүй байна.',
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ебаримт татахад алдаа гарлаа.');
    } finally {
      setPrintingOrderId(null);
    }
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setPendingOrderId(null);
    setPendingAction(null);
  };

  const handleConfirmAction = async () => {
    if (pendingOrderId == null || pendingAction == null) return;
    const orderId = pendingOrderId;
    const action = pendingAction;
    closeConfirm();
    try {
      if (action === 'delivery_started') {
        await updateOrderStatusMutation.mutateAsync({
          orderId,
          status: STATUS_DELIVERY_STARTED,
        });
        toast.success('Захиалга "Хүргэлт эхэлсэн" төлөвт шилжлээ. Хэрэглэгчид SMS илгээгдсэн.');
      } else if (action === 'delivered') {
        await updateOrderStatusMutation.mutateAsync({
          orderId,
          status: 'Хүргэгдсэн',
        });
        toast.success('Захиалга амжилттай "Хүргэгдсэн" төлөвт шилжлээ');
      } else if (action === 'cancel') {
        navigate({
          to: '/orders/$id',
          params: { id: orderId },
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Төлөв шинэчлэхэд алдаа гарлаа';
      toast.error(errorMessage);
    }
  };

  const confirmTitle =
    pendingAction === 'delivery_started'
      ? 'Хүргэлтэд гаргах уу?'
      : pendingAction === 'delivered'
        ? 'Хүргэгдсэн гэж тэмдэглэх уу?'
        : pendingAction === 'cancel'
          ? 'Цуцлах хуудас руу шилжих уу?'
          : '';

  const confirmDescription =
    pendingAction === 'delivery_started'
      ? `Захиалга #${pendingOrderId} хүргэлтэд гарсан гэж тэмдэглэгдэж, хэрэглэгчид SMS илгээгдэнэ.`
      : pendingAction === 'delivered'
        ? `Захиалга #${pendingOrderId} хүргэгдсэн төлөвт шилжүүлнэ.`
        : pendingAction === 'cancel'
          ? `Захиалга #${pendingOrderId}-ын дэлгэрэнгүй хуудас руу очоод цуцлах үйлдлийг хийж болно.`
          : '';

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
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleApplySearch = () => {
    setSimpleSearch(''); // Clear simple search when applying advanced
    setAppliedFilters({
      ...advancedFilters,
      page: 1,
    });
  };

  const handleClearSearch = () => {
    setSimpleSearch('');
    setAdvancedFilters(defaultAdvancedFilters);
    setAppliedFilters(defaultAdvancedFilters);
  };

  const handleSimpleSearchApply = () => {
    const searchTerm = simpleSearch.trim();
    if (searchTerm === '') {
      setAppliedFilters(defaultAdvancedFilters);
    } else {
      // Simple search: one term searches order ID, phone, and name at once
      setAppliedFilters((prev) => ({
        ...prev,
        orderId: searchTerm,
        phone: searchTerm,
        name: searchTerm,
        page: 1,
      }));
    }
  };

  const handlePageChange = (newPage: number) => {
    setAppliedFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Захиалга</h1>
            <p className="text-muted-foreground">Бүх захиалгыг харах болон удирдах</p>
          </div>
          <div className="flex flex-nowrap gap-3 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
            {[
              { value: 'all', label: 'Бүгд', icon: LayoutList, count: null },
              { value: 'PAID', label: 'Төлөгдсөн', icon: CreditCard, count: paidCount },
              { value: STATUS_DELIVERY_STARTED, label: 'Хүргэлт эхэлсэн', icon: Truck, count: deliveryStartedCount },
              { value: 'PENDING', label: 'Төлбөр хүлээгдэх', icon: Clock, count: null },
              { value: 'CANCELLED', label: 'Цуцлагдсан', icon: XCircle, count: null },
            ].map(({ value, label, icon: Icon, count }) => {
              const isActive = statusFilter === value;
              const showBadge = count != null && count > 0;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={`
                    relative flex shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-4 py-3 text-center transition-colors
                    min-w-[100px] max-w-[120px]
                    ${isActive
                      ? 'border-green-600 bg-green-50 text-green-800 dark:border-green-500 dark:bg-green-950/40 dark:text-green-200'
                      : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50 dark:bg-card dark:hover:bg-muted/30'
                    }
                  `}
                >
                  <span className="relative inline-flex shrink-0">
                    <Icon className="h-6 w-6 shrink-0" strokeWidth={1.5} />
                    {showBadge && (
                      <span
                        className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums text-white shadow-sm ring-2 ring-background
                          bg-amber-500 dark:bg-amber-500 dark:ring-background
                          animate-in zoom-in-50 duration-200"
                        aria-label={`${count} захиалга`}
                      >
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-medium leading-tight">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            {!advancedOpen && (
              <div className="mb-4 flex items-center gap-2">
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Захиалгын ID, утас, эсвэл нэрээр хайх..."
                    value={simpleSearch}
                    onChange={(e) => setSimpleSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSimpleSearchApply();
                      }
                    }}
                    className="w-full"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleSimpleSearchApply}
                  className="gap-1"
                >
                  <Search className="h-4 w-4" />
                  Хайх
                </Button>
                {simpleSearch.trim() !== '' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSimpleSearch('');
                      setAppliedFilters(defaultAdvancedFilters);
                    }}
                  >
                    Цэвэрлэх
                  </Button>
                )}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Бүх захиалга</CardTitle>
                <CardDescription>
                  Нийт {displayTotal} захиалга
                  {totalPagesFromSearch > 1 && ` · Хуудас ${pageFromSearch} / ${totalPagesFromSearch}`}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!advancedOpen) {
                    // Clear simple search when opening advanced
                    setSimpleSearch('');
                    setAppliedFilters(defaultAdvancedFilters);
                  }
                  setAdvancedOpen((o) => !o);
                }}
                className="gap-1"
              >
                Дэлгэрэнгүй хайлт
                {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {advancedOpen && (
            <CardContent className="border-b pb-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Захиалгын ID</Label>
                  <Input
                    placeholder="Жишээ: 260126"
                    value={advancedFilters.orderId ?? ''}
                    onChange={(e) => setAdvancedFilters((f) => ({ ...f, orderId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Утас</Label>
                  <Input
                    placeholder="Утасны дугаар"
                    value={advancedFilters.phone ?? ''}
                    onChange={(e) => setAdvancedFilters((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Нэр</Label>
                  <Input
                    placeholder="Хэрэглэгчийн нэр"
                    value={advancedFilters.name ?? ''}
                    onChange={(e) => setAdvancedFilters((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Үүсгэсэн огноо (эхлэх)</Label>
                  <Input
                    type="date"
                    value={advancedFilters.dateFrom ?? ''}
                    onChange={(e) => setAdvancedFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Үүсгэсэн огноо (дуусах)</Label>
                  <Input
                    type="date"
                    value={advancedFilters.dateTo ?? ''}
                    onChange={(e) => setAdvancedFilters((f) => ({ ...f, dateTo: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Хүргэлтийн огноо (эхлэх)</Label>
                  <Input
                    type="date"
                    value={advancedFilters.deliveryDateFrom ?? ''}
                    onChange={(e) => setAdvancedFilters((f) => ({ ...f, deliveryDateFrom: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Хүргэлтийн огноо (дуусах)</Label>
                  <Input
                    type="date"
                    value={advancedFilters.deliveryDateTo ?? ''}
                    onChange={(e) => setAdvancedFilters((f) => ({ ...f, deliveryDateTo: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Нийт дүн (мин)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={advancedFilters.totalMin ?? ''}
                    onChange={(e) => setAdvancedFilters((f) => ({ ...f, totalMin: e.target.value === '' ? undefined : Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Нийт дүн (макс)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={advancedFilters.totalMax ?? ''}
                    onChange={(e) => setAdvancedFilters((f) => ({ ...f, totalMax: e.target.value === '' ? undefined : Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Хүргэлтийн цаг</Label>
                  <Select
                    value={advancedFilters.deliveryTimeSlot && advancedFilters.deliveryTimeSlot !== '' ? advancedFilters.deliveryTimeSlot : '_all'}
                    onValueChange={(v) => setAdvancedFilters((f) => ({ ...f, deliveryTimeSlot: v === '_all' ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Бүгд" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Бүгд</SelectItem>
                      {DELIVERY_TIME_SLOTS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Эрэмбэлэх</Label>
                  <Select
                    value={advancedFilters.sortBy ?? 'createdAt'}
                    onValueChange={(v) => setAdvancedFilters((f) => ({ ...f, sortBy: v as OrderSearchFilters['sortBy'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((s) => (
                        <SelectItem key={s.value!} value={s.value!}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Эрэмбэ</Label>
                  <Select
                    value={advancedFilters.sortOrder ?? 'desc'}
                    onValueChange={(v) => setAdvancedFilters((f) => ({ ...f, sortOrder: v as 'asc' | 'desc' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Шинэ эхэнд</SelectItem>
                      <SelectItem value="asc">Хуучин эхэнд</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Хуудасны хэмжээ</Label>
                  <Select
                    value={String(advancedFilters.limit ?? 20)}
                    onValueChange={(v) => setAdvancedFilters((f) => ({ ...f, limit: Number(v), page: 1 }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50, 100].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={handleApplySearch} className="gap-1">
                  <Search className="h-4 w-4" />
                  Хайх
                </Button>
                <Button size="sm" variant="outline" onClick={handleClearSearch}>
                  Цэвэрлэх
                </Button>
              </div>
            </CardContent>
          )}
          <CardContent>
          {displayOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Захиалга олдсонгүй.
            </div>
          ) : (
            <>
              {/* Mobile: card list – all content and actions visible without horizontal scroll */}
              <div className="space-y-3 md:hidden">
                {displayOrders.map((order) => (
                  <Card key={order.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <span className="font-medium">#{order.id}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="grid gap-1.5 text-sm">
                        <div>
                          <span className="text-muted-foreground">Хэрэглэгч:</span>{' '}
                          {order.user?.name ?? order.contactFullName ?? 'Байхгүй'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Утас:</span>{' '}
                          {order.user?.phoneNumber ?? order.contactPhoneNumber ?? 'Байхгүй'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Бараа:</span> {order.items.length}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Нийт:</span> {formatPrice(order.totalAmount)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Захиалга үүссэн:</span> {formatDate(order.createdAt)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Хүргэлтийн огноо, цаг:</span>{' '}
                          {order.deliveryDate
                            ? [formatDeliveryDate(order.deliveryDate), getDeliveryTimeSlotLabel(order.deliveryTimeSlot)].filter(Boolean).join(' · ')
                            : '—'}
                        </div>
                      </div>
                      <div className="border-t pt-3">
                        <OrderRowActions
                          order={order}
                          onOpenConfirm={openConfirm}
                          isMutationPending={updateOrderStatusMutation.isPending}
                          isDelivered={isDelivered}
                          onView={(id) => navigate({ to: '/orders/$id', params: { id } })}
                          onPrint={handlePrint}
                          isPrintPending={printingOrderId === order.id}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Захиалгын ID</TableHead>
                    <TableHead>Хэрэглэгч</TableHead>
                    <TableHead>Утас</TableHead>
                    <TableHead>Бараа</TableHead>
                    <TableHead>Нийт</TableHead>
                    <TableHead className="text-center">Төлөв</TableHead>
                    <TableHead>Захиалга үүссэн</TableHead>
                    <TableHead>Хүргэлтийн огноо, цаг</TableHead>
                    <TableHead className="text-right w-0">Үйлдлүүд</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {displayOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onDoubleClick={(e) => {
                      if ((e.target as HTMLElement).closest('button')) return;
                      navigate({ to: '/orders/$id', params: { id: order.id } });
                    }}
                  >
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{order.user?.name ?? order.contactFullName ?? 'Байхгүй'}</TableCell>
                    <TableCell>{order.user?.phoneNumber ?? order.contactPhoneNumber ?? 'Байхгүй'}</TableCell>
                    <TableCell>{order.items.length}</TableCell>
                    <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {order.deliveryDate
                        ? [formatDeliveryDate(order.deliveryDate), getDeliveryTimeSlotLabel(order.deliveryTimeSlot)].filter(Boolean).join(' · ')
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right w-0">
                      <OrderRowActions
                        order={order}
                        onOpenConfirm={openConfirm}
                        isMutationPending={updateOrderStatusMutation.isPending}
                        isDelivered={isDelivered}
                        onView={(id) => navigate({ to: '/orders/$id', params: { id } })}
                        onPrint={handlePrint}
                        isPrintPending={printingOrderId === order.id}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
              </div>
            </>
          )}
          {totalPagesFromSearch > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t pt-4">
              <div className="flex items-center gap-4">
                <p className="text-muted-foreground text-sm">
                  Хуудас {pageFromSearch} / {totalPagesFromSearch} (нийт {totalFromSearch} захиалга)
                </p>
                <Select
                  value={String(appliedFilters.limit ?? 20)}
                  onValueChange={(v) => setAppliedFilters((prev) => ({ ...prev, limit: Number(v), page: 1 }))}
                >
                  <SelectTrigger className="w-20 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground text-sm">/ хуудас</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, pageFromSearch - 1))}
                  disabled={pageFromSearch <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Өмнөх
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.min(totalPagesFromSearch, pageFromSearch + 1))}
                  disabled={pageFromSearch >= totalPagesFromSearch}
                >
                  Дараах
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) {
            setPendingOrderId(null);
            setPendingAction(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirm}>Болих</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmAction();
              }}
            >
              Тийм
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <EbarimtReceiptDialog
        open={ebarimtDialogOpen}
        onOpenChange={setEbarimtDialogOpen}
        data={ebarimtDialogData}
        items={ebarimtDialogItems}
        orderId={ebarimtDialogOrderId ?? undefined}
        receiverName={ebarimtReceiverName}
        receiverPhone={ebarimtReceiverPhone}
        address={ebarimtAddress}
      />
    </div>
  );
}
