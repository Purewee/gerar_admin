import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Save, Plus, Trash2, Clock, MapPin, GripVertical, CalendarOff, X } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import 'react-day-picker/style.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  fetchDeliveryTimeSlotsOptions,
  fetchDistrictsOptions,
  fetchOffDeliveryDatesOptions,
  useUpdateDeliveryTimeSlots,
  useUpdateDistricts,
  useUpdateOffDeliveryDates,
} from '@/queries/constants/options';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
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
import { cn } from '@/lib/utils';

const TITLE = 'Тогтмол утгууд | Gerar';

export const Route = createFileRoute('/_dashboard/constants')({
  head: () => ({ meta: [{ title: TITLE }] }),
  component: ConstantsPage,
});

function DeliveryTimeSlotsForm() {
  const { data, isLoading } = useQuery(fetchDeliveryTimeSlotsOptions());
  const updateSlots = useUpdateDeliveryTimeSlots();
  
  // Use array with stable IDs for local state to prevent focus loss and reordering
  const [slots, setSlots] = useState<{ id: string; name: string; value: string }[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (data?.slots && !initializedRef.current) {
      // Convert object to array with stable IDs
      const slotsArray = Object.entries(data.slots).map(([name, value]) => ({
        id: Math.random().toString(36).slice(2),
        name,
        value,
      }));
      setSlots(slotsArray);
      setHasChanges(false);
      initializedRef.current = true;
    }
  }, [data]);

  const handleSlotChange = (id: string, newValue: string) => {
    setSlots((prev) => prev.map((slot) => (slot.id === id ? { ...slot, value: newValue } : slot)));
    setHasChanges(true);
  };

  const handleSlotNameChange = (id: string, newName: string) => {
    setSlots((prev) => prev.map((slot) => (slot.id === id ? { ...slot, name: newName } : slot)));
    setHasChanges(true);
  };

  const handleAddSlot = () => {
    setSlots((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        name: `SLOT_${prev.length + 1}`,
        value: '00-00',
      },
    ]);
    setHasChanges(true);
  };

  const handleRemoveSlot = (id: string) => setDeleteTarget(id);

  const confirmDeleteSlot = () => {
    if (deleteTarget) {
      setSlots((prev) => prev.filter((slot) => slot.id !== deleteTarget));
      setHasChanges(true);
      setDeleteTarget(null);
    }
  };

  const handleSave = async () => {
    try {
      // Convert array back to object Record<string, string>
      const slotsRecord: Record<string, string> = {};
      slots.forEach((slot) => {
        const key = slot.name.trim();
        if (key) {
          slotsRecord[key] = slot.value;
        }
      });

      await updateSlots.mutateAsync({ slots: slotsRecord });
      toast.success('Хүргэлтийн цагийн хуваарь амжилттай шинэчлэгдлээ');
      setHasChanges(false);
      initializedRef.current = false;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Хүргэлтийн цагийн хуваарийг шинэчлэхэд алдаа гарлаа',
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Хүргэлтийн цагийн хуваарь</CardTitle>
                <CardDescription className="mt-0.5">
                  Өглөө, өдөр, орой гэх мэт нэр болон цагийн хуваарийг тохируулна. Формат: HH-HH (жишээ: 10-14)
                </CardDescription>
              </div>
            </div>
            {slots.length > 0 && (
              <Badge variant="secondary" className="shrink-0 font-normal">
                {slots.length} хуваарь
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {slots.length === 0 ? (
            <div
              className={cn(
                'flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 px-6 py-12 text-center',
              )}
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Хуваарь байхгүй байна</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Хүргэлтийн цагийн хуваарь нэмж тохируулна уу
              </p>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleAddSlot}
                className="mt-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                Хуваарь нэмэх
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm transition-colors hover:bg-muted/30"
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
                  <Input
                    id={`slot-name-${slot.id}`}
                    value={slot.name}
                    onChange={(e) => handleSlotNameChange(slot.id, e.target.value)}
                    placeholder="Өглөө"
                    className="h-9 flex-1 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                  <span className="shrink-0 text-muted-foreground">→</span>
                  <Input
                    id={`slot-time-${slot.id}`}
                    value={slot.value}
                    onChange={(e) => handleSlotChange(slot.id, e.target.value)}
                    placeholder="10-14"
                    className="h-9 w-24 shrink-0 font-mono text-center"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSlot(slot.id)}
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Устгах"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSlot}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Хуваарь нэмэх
            </Button>
            {hasChanges && (
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={updateSlots.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {updateSlots.isPending ? 'Хадгалж байна...' : 'Хадгалах'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Хуваарь устгах</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && slots.find((s) => s.id === deleteTarget) ? (
                <>
                  &quot;{slots.find((s) => s.id === deleteTarget)?.name}&quot; хуваарийг устгахдаа
                  итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
                </>
              ) : (
                'Хуваарийг устгахдаа итгэлтэй байна уу?'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSlot}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Устгах
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type DistrictEntry = { name: string; khorooCount: number };

function DistrictsForm() {
  const { data, isLoading } = useQuery(fetchDistrictsOptions());
  const updateDistricts = useUpdateDistricts();
  const [districts, setDistricts] = useState<DistrictEntry[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (data?.districts && !initializedRef.current) {
      setDistricts(
        Object.entries(data.districts).map(([name, khorooCount]) => ({ name, khorooCount })),
      );
      setHasChanges(false);
      initializedRef.current = true;
    }
  }, [data]);

  const handleDistrictChange = (index: number, value: number) => {
    setDistricts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, khorooCount: value } : d)),
    );
    setHasChanges(true);
  };

  const handleDistrictNameChange = (index: number, newName: string) => {
    setDistricts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, name: newName } : d)),
    );
    setHasChanges(true);
  };

  const handleAddDistrict = () => {
    setDistricts((prev) => [...prev, { name: `Дүүрэг ${prev.length + 1}`, khorooCount: 1 }]);
    setHasChanges(true);
  };

  const handleRemoveDistrict = (index: number) => setDeleteTarget(index);

  const confirmDelete = () => {
    if (deleteTarget !== null) {
      setDistricts((prev) => prev.filter((_, i) => i !== deleteTarget));
      setHasChanges(true);
      setDeleteTarget(null);
    }
  };

  const handleSave = async () => {
    try {
      const districtsRecord: Record<string, number> = {};
      for (const d of districts) {
        const key = d.name.trim() || `Дүүрэг`;
        districtsRecord[key] = d.khorooCount;
      }
      await updateDistricts.mutateAsync({ districts: districtsRecord });
      toast.success('Дүүргүүд амжилттай шинэчлэгдлээ');
      setHasChanges(false);
      initializedRef.current = false;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Дүүргүүдийг шинэчлэхэд алдаа гарлаа',
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Дүүргүүд</CardTitle>
                <CardDescription className="mt-0.5">
                  Дүүргийн нэр болон хорооны тоог тохируулна
                </CardDescription>
              </div>
            </div>
            {districts.length > 0 && (
              <Badge variant="secondary" className="shrink-0 font-normal">
                {districts.length} дүүрэг
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {districts.length === 0 ? (
            <div
              className={cn(
                'flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 px-6 py-12 text-center',
              )}
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <MapPin className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Дүүрэг байхгүй байна</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Дүүрэг нэмж хорооны тоогоо тохируулна уу
              </p>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleAddDistrict}
                className="mt-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                Дүүрэг нэмэх
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {districts.map((district, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm transition-colors hover:bg-muted/30"
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
                  <Input
                    id={`district-name-${index}`}
                    value={district.name}
                    onChange={(e) => handleDistrictNameChange(index, e.target.value)}
                    placeholder="Дүүргийн нэр"
                    className="h-9 flex-1 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                  <span className="shrink-0 text-sm text-muted-foreground">хороо</span>
                  <Input
                    id={`district-${index}`}
                    type="number"
                    min={1}
                    value={district.khorooCount}
                    onChange={(e) =>
                      handleDistrictChange(index, Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="h-9 w-16 shrink-0 text-center font-medium"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveDistrict(index)}
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Устгах"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddDistrict}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Дүүрэг нэмэх
            </Button>
            {hasChanges && (
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={updateDistricts.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {updateDistricts.isPending ? 'Хадгалж байна...' : 'Хадгалах'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Дүүрэг устгах</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget !== null ? districts[deleteTarget]?.name : ''}&quot; дүүргийг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Устгах
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const WEEKDAY_LABELS: Record<number, string> = {
  0: 'Ням',
  1: 'Даваа',
  2: 'Мягмар',
  3: 'Лхагва',
  4: 'Пүрэв',
  5: 'Баасан',
  6: 'Бямба',
};

function toDateOrNull(iso: string): Date | null {
  try {
    const d = parseISO(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/** One calendar: each selected date is either full-day off or has specific slots off. */
type DateEntry = { date: string; fullDay: boolean; slots: string[] };

/** Slot option from delivery time slots: label (e.g. "Өглөө") and value ("10-14"). */
function getSlotOptions(slotsRecord: Record<string, string> | undefined): { label: string; value: string }[] {
  if (!slotsRecord) return [];
  return Object.entries(slotsRecord).map(([name, value]) => ({ label: name, value }));
}

function OffDeliveryDatesForm() {
  const { data, isLoading } = useQuery(fetchOffDeliveryDatesOptions());
  const { data: deliverySlotsData } = useQuery(fetchDeliveryTimeSlotsOptions());
  const updateOffDelivery = useUpdateOffDeliveryDates();
  const [offWeekdays, setOffWeekdays] = useState<number[]>([]);
  const [offTimeSlots, setOffTimeSlots] = useState<string[]>([]);
  const [dateEntries, setDateEntries] = useState<DateEntry[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const initializedRef = useRef(false);

  const slotOptions = useMemo(
    () => getSlotOptions(deliverySlotsData?.slots),
    [deliverySlotsData],
  );

  const selectedDates = useMemo(
    () =>
      dateEntries
        .map((e) => toDateOrNull(e.date))
        .filter((d): d is Date => d !== null),
    [dateEntries],
  );

  useEffect(() => {
    if (data && !initializedRef.current) {
      setOffWeekdays(data.offWeekdays ?? []);
      setOffTimeSlots(data.offTimeSlots ?? []);
      const offDatesList = data.offDates ?? [];
      const byDate = data.offTimeSlotsByDate ?? {};
      const dateSet = new Set<string>([...offDatesList, ...Object.keys(byDate)]);
      const entries: DateEntry[] = [...dateSet].sort().map((date) => {
        if (byDate[date]?.length) {
          return { date, fullDay: false, slots: [...byDate[date]] };
        }
        return { date, fullDay: true, slots: [] };
      });
      setDateEntries(entries);
      setHasChanges(false);
      initializedRef.current = true;
    }
  }, [data]);

  const toggleWeekday = (day: number) => {
    setOffWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
    setHasChanges(true);
  };

  const handleCalendarSelect = (dates: Date[] | undefined) => {
    const newDateStrings = (dates ?? []).map((d) => format(d, 'yyyy-MM-dd')).sort();
    const newSet = new Set(newDateStrings);
    setDateEntries((prev) => {
      const kept = prev.filter((e) => newSet.has(e.date));
      const added = newDateStrings.filter((d) => !prev.some((e) => e.date === d));
      const newEntries = [
        ...kept,
        ...added.map((date) => ({ date, fullDay: true, slots: [] as string[] })),
      ].sort((a, b) => a.date.localeCompare(b.date));
      return newEntries;
    });
    setHasChanges(true);
  };

  const removeDate = (date: string) => {
    setDateEntries((prev) => prev.filter((e) => e.date !== date));
    setHasChanges(true);
  };

  const setDateEntryFullDay = (date: string, fullDay: boolean) => {
    setDateEntries((prev) =>
      prev.map((e) => (e.date === date ? { ...e, fullDay, slots: fullDay ? [] : e.slots } : e)),
    );
    setHasChanges(true);
  };

  const setDateEntrySlot = (date: string, slotValue: string, checked: boolean) => {
    setDateEntries((prev) =>
      prev.map((e) => {
        if (e.date !== date) return e;
        const next = checked
          ? [...e.slots, slotValue]
          : e.slots.filter((s) => s !== slotValue);
        return { ...e, slots: next };
      }),
    );
    setHasChanges(true);
  };

  const toggleGlobalOffSlot = (slotValue: string, checked: boolean) => {
    setOffTimeSlots((prev) =>
      checked ? [...prev, slotValue] : prev.filter((s) => s !== slotValue),
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      const offDatesToSend = dateEntries.filter((e) => e.fullDay).map((e) => e.date);
      const byDateToSend: Record<string, string[]> = {};
      dateEntries.forEach((e) => {
        if (!e.fullDay && e.slots.length > 0) byDateToSend[e.date] = e.slots;
      });
      await updateOffDelivery.mutateAsync({
        offWeekdays,
        offDates: offDatesToSend,
        offTimeSlots: offTimeSlots.length > 0 ? offTimeSlots : undefined,
        offTimeSlotsByDate:
          Object.keys(byDateToSend).length > 0 ? byDateToSend : undefined,
      });
      toast.success('Хүргэлтийн амралтын өдрүүд амжилттай шинэчлэгдлээ');
      setHasChanges(false);
      initializedRef.current = false;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Хүргэлтийн амралтын өдрүүдийг шинэчлэхэд алдаа гарлаа',
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:bg-rose-400/15 dark:text-rose-400">
              <CalendarOff className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Хүргэлт хийхгүй өдрүүд</CardTitle>
              <CardDescription className="mt-0.5">
                Долоо хоногийн болон тусгай өдрүүд (баяр, амралтын өдөр) дээр хүргэлт идэвхгүй болно
              </CardDescription>
            </div>
          </div>
          {(offWeekdays.length > 0 ||
            dateEntries.length > 0 ||
            offTimeSlots.length > 0) && (
            <Badge variant="secondary" className="shrink-0 font-normal">
              {offWeekdays.length} долоо хоног, {dateEntries.length} өдөр
              {offTimeSlots.length > 0 && `, ${offTimeSlots.length} цаг (үндсэн)`}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Долоо хоногийн амралтын өдрүүд</p>
          <div className="flex flex-wrap gap-4">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <label
                key={day}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/50',
                  offWeekdays.includes(day) && 'border-rose-500/50 bg-rose-500/10',
                )}
              >
                <Checkbox
                  checked={offWeekdays.includes(day)}
                  onCheckedChange={() => toggleWeekday(day)}
                  aria-label={WEEKDAY_LABELS[day]}
                />
                <span>{WEEKDAY_LABELS[day]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Тусгай амралтын өдрүүд (баяр, амралт) — календараас өдөр сонгоод, бүтэн өдөр эсвэл тодорхой цагийн хуваарьгүй болгоно
          </p>
          <div
            className="rdp-root rounded-xl border bg-muted/20 p-4 [--rdp-day_button-height:48px] [--rdp-day_button-width:48px] [--rdp-day-height:50px] [--rdp-day-width:50px] [--rdp-accent-color:#e11d48] [--rdp-accent-background-color:rgba(225,29,72,0.15)]"
            style={{ width: 'fit-content' }}
          >
            <DayPicker
              mode="multiple"
              selected={selectedDates}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
              defaultMonth={selectedDates[0] ?? new Date()}
              showOutsideDays
              classNames={{
                months: 'flex flex-wrap justify-center gap-10',
                month: 'flex flex-col gap-4',
              }}
            />
          </div>
          {dateEntries.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Сонгосон өдрүүд — бүтэн өдөр эсвэл зөвхөн тодорхой цагийн хуваарьгүй
              </p>
              <div className="flex flex-col gap-2">
                {dateEntries.map((entry) => (
                  <div
                    key={entry.date}
                    className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3"
                  >
                    <span className="font-mono text-sm font-medium">{entry.date}</span>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={entry.fullDay}
                        onCheckedChange={(c) =>
                          setDateEntryFullDay(entry.date, c === true)
                        }
                        aria-label="Бүтэн өдөр"
                      />
                      <span>Бүтэн өдөр</span>
                    </label>
                    {!entry.fullDay && slotOptions.length > 0 && (
                      <div className="flex flex-wrap gap-3 border-l pl-3">
                        <span className="text-muted-foreground text-xs">
                          Хүргэлт хийхгүй цаг:
                        </span>
                        {slotOptions.map((opt) => (
                          <label
                            key={opt.value}
                            className="flex cursor-pointer items-center gap-1.5 text-sm"
                          >
                            <Checkbox
                              checked={entry.slots.includes(opt.value)}
                              onCheckedChange={(c) =>
                                setDateEntrySlot(entry.date, opt.value, c === true)
                              }
                              aria-label={opt.label}
                            />
                            <span>
                              {opt.label} ({opt.value})
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDate(entry.date)}
                      className="ml-auto h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`${entry.date} устгах`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {slotOptions.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Үндсэн хүргэлт хийхгүй цагийн хуваарь
            </p>
            <p className="text-xs text-muted-foreground">
              Эдгээр цагийн хуваарьт өдөр бүр хүргэлт идэвхгүй (календараас үл хамааран)
            </p>
            <div className="flex flex-wrap gap-4">
              {slotOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/50',
                    offTimeSlots.includes(opt.value) &&
                      'border-rose-500/50 bg-rose-500/10',
                  )}
                >
                  <Checkbox
                    checked={offTimeSlots.includes(opt.value)}
                    onCheckedChange={(c) =>
                      toggleGlobalOffSlot(opt.value, c === true)
                    }
                    aria-label={opt.label}
                  />
                  <span>
                    {opt.label} ({opt.value})
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {hasChanges && (
          <div className="flex justify-end border-t pt-4">
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={updateOffDelivery.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {updateOffDelivery.isPending ? 'Хадгалж байна...' : 'Хадгалах'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const CONSTANT_TABS = [
  { id: 'slots' as const, label: 'Цагийн хуваарь', icon: Clock },
  { id: 'districts' as const, label: 'Дүүргүүд', icon: MapPin },
  { id: 'off-dates' as const, label: 'Амралтын өдрүүд', icon: CalendarOff },
] as const;

function ConstantsPage() {
  const [activeTab, setActiveTab] = useState<(typeof CONSTANT_TABS)[number]['id']>('slots');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Тогтмол утгууд</h1>
        <p className="mt-1 text-muted-foreground">
          Хүргэлтийн цагийн хуваарь, дүүргүүд болон амралтын өдрүүдийг тохируулна
        </p>
      </header>

      <div className="border-b border-border">
        <nav className="-mb-px flex gap-1" aria-label="Тогтмол утгуудын цэс">
          {CONSTANT_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground',
              )}
              aria-current={activeTab === id ? 'page' : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[320px]">
        {activeTab === 'slots' && <DeliveryTimeSlotsForm />}
        {activeTab === 'districts' && <DistrictsForm />}
        {activeTab === 'off-dates' && <OffDeliveryDatesForm />}
      </div>
    </div>
  );
}
