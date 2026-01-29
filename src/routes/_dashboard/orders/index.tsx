import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Eye, XCircle, Truck, PackageCheck, Loader2, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { fetchOrdersOptions, fetchOrdersSearchOptions, useUpdateOrderStatus } from '@/queries/order/options';
import { Skeleton } from '@/components/ui/skeleton';
import type { Order, OrderSearchFilters } from '@/queries/order/type';
import { STATUS_DELIVERY_STARTED, STATUS_CANCELLED_BY_ADMIN, isOrderCancelled } from '@/queries/order/type';
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

export const Route = createFileRoute('/_dashboard/orders/')({
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
  type PendingAction = 'delivery_started' | 'delivered' | 'cancel' | null;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const hasStatusFilter = statusFilter !== 'all';
  const hasAdvancedFilter = useMemo(() => {
    const a = appliedFilters;
    return (
      (a.orderId ?? '') !== '' ||
      (a.phone ?? '') !== '' ||
      (a.name ?? '') !== '' ||
      (a.dateFrom ?? '') !== '' ||
      (a.dateTo ?? '') !== '' ||
      (a.deliveryDateFrom ?? '') !== '' ||
      (a.deliveryDateTo ?? '') !== '' ||
      a.totalMin != null ||
      a.totalMax != null ||
      (a.deliveryTimeSlot ?? '') !== '' ||
      (a.paymentStatus ?? '') !== ''
    );
  }, [appliedFilters]);
  const hasAnyFilter = hasStatusFilter || hasAdvancedFilter;
  
  // Check if simple search has been applied (is in appliedFilters)
  const hasSimpleSearch = useMemo(() => {
    const a = appliedFilters;
    const searchTerm = (a.orderId ?? '').trim();
    return searchTerm !== '' && 
           a.orderId === a.phone && 
           a.phone === a.name && 
           searchTerm !== '';
  }, [appliedFilters]);

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

  const listQuery = useQuery(fetchOrdersOptions());
  const searchQuery = useQuery({
    ...fetchOrdersSearchOptions(searchFilters),
    enabled: hasAnyFilter,
  });

  const isLoading = hasAnyFilter ? searchQuery.isLoading : listQuery.isLoading;
  const ordersFromList: Order[] = listQuery.data ?? [];
  const searchResult = searchQuery.data;
  const ordersFromSearch: Order[] = searchResult?.orders ?? [];
  const totalFromSearch = searchResult?.total ?? 0;
  const pageFromSearch = searchResult?.page ?? 1;
  const totalPagesFromSearch = searchResult?.totalPages ?? 1;

  const filteredOrdersFromList =
    statusFilter === 'all'
      ? ordersFromList
      : statusFilter === 'CANCELLED'
        ? ordersFromList.filter((order) => isOrderCancelled(order.status))
        : ordersFromList.filter((order) => order.status === statusFilter);

  const displayOrders = hasAnyFilter ? ordersFromSearch : filteredOrdersFromList;
  const displayTotal = hasAnyFilter ? totalFromSearch : filteredOrdersFromList.length;
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

  const statusLabels: Record<string, string> = {
    PENDING: 'Төлбөр хүлээгдэх',
    COMPLETED: 'Төлбөр төлөгдсөн',
    CANCELLED: 'Цуцлагдсан',
    [STATUS_CANCELLED_BY_ADMIN]: 'Цуцлагдсан (админ баталгаажуулсан)',
    DELIVERED: 'Хүргэгдсэн',
    [STATUS_DELIVERY_STARTED]: 'Хүргэлт эхэлсэн',
    'Хүргэгдсэн': 'Хүргэгдсэн', // Handle Mongolian status string from backend
  };

  const getStatusBadge = (status: Order['status']) => {
    const variants = {
      PENDING: 'secondary',
      COMPLETED: 'outline',
      CANCELLED: 'destructive',
      [STATUS_CANCELLED_BY_ADMIN]: 'destructive',
      DELIVERED: 'default',
      [STATUS_DELIVERY_STARTED]: 'outline',
      'Хүргэгдсэн': 'default', // Handle Mongolian status string from backend
    } as const;
    const isCompleted = status === 'COMPLETED';
    const isDeliveredStatus = status === 'DELIVERED' || status === 'Хүргэгдсэн';

    return (
      <Badge
        variant={variants[status as keyof typeof variants] || 'secondary'}
        className={
          isCompleted
            ? 'border-amber-500 bg-amber-400/20 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400'
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

  const openConfirm = (orderId: number, action: PendingAction) => {
    setPendingOrderId(orderId);
    setPendingAction(action);
    setConfirmOpen(true);
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
          params: { id: String(orderId) },
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
      // Update appliedFilters to trigger search
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Захиалга</h1>
            <p className="text-muted-foreground">Бүх захиалгыг харах болон удирдах</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Бүгд
            </Button>
            <Button
              variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('PENDING')}
            >
              Төлбөр хүлээгдэх
            </Button>
            <Button
              variant={statusFilter === 'COMPLETED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('COMPLETED')}
            >
              Төлбөр төлөгдсөн
            </Button>
            <Button
              variant={statusFilter === 'CANCELLED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('CANCELLED')}
            >
              Цуцлагдсан
            </Button>
            <Button
              variant={statusFilter === STATUS_DELIVERY_STARTED ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(STATUS_DELIVERY_STARTED)}
            >
              Хүргэлт эхэлсэн
            </Button>
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
                  {hasAnyFilter && totalPagesFromSearch > 1 && ` · Хуудас ${pageFromSearch} / ${totalPagesFromSearch}`}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Захиалгын ID</TableHead>
                  <TableHead>Хэрэглэгч</TableHead>
                  <TableHead>Утас</TableHead>
                  <TableHead>Бараа</TableHead>
                  <TableHead>Нийт</TableHead>
                  <TableHead className="text-center">Төлөв</TableHead>
                  <TableHead>Огноо</TableHead>
                  <TableHead className="text-right w-0">Үйлдлүүд</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{order.user?.name || 'Байхгүй'}</TableCell>
                    <TableCell>{order.user?.phoneNumber || 'Байхгүй'}</TableCell>
                    <TableCell>{order.items.length}</TableCell>
                    <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell className="text-right w-0">
                      <div className="flex items-center justify-end gap-0.5">
                        {order.status === 'COMPLETED' && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  onClick={() => openConfirm(order.id, 'delivery_started')}
                                  disabled={updateOrderStatusMutation.isPending}
                                >
                                  {updateOrderStatusMutation.isPending ? (
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
                                  onClick={() => openConfirm(order.id, 'delivered')}
                                  disabled={updateOrderStatusMutation.isPending}
                                >
                                  {updateOrderStatusMutation.isPending ? (
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
                                  onClick={() => openConfirm(order.id, 'delivered')}
                                  disabled={updateOrderStatusMutation.isPending}
                                >
                                  {updateOrderStatusMutation.isPending ? (
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
                        {order.status === 'COMPLETED' && order.user?.phoneNumber && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => openConfirm(order.id, 'cancel')}
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
                              className="h-7 w-7"
                              onClick={() =>
                                navigate({
                                  to: '/orders/$id',
                                  params: { id: String(order.id) },
                                })
                              }
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Харах</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {hasAnyFilter && totalPagesFromSearch > 1 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-muted-foreground text-sm">
                Хуудас {pageFromSearch} / {totalPagesFromSearch} (нийт {totalFromSearch} захиалга)
              </p>
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
    </div>
  );
}
