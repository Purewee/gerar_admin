import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { Save, Plus, Trash2, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  fetchDeliveryTimeSlotsOptions,
  fetchDistrictsOptions,
  useUpdateDeliveryTimeSlots,
  useUpdateDistricts,
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

export const Route = createFileRoute('/_dashboard/constants')({
  component: ConstantsPage,
});

function DeliveryTimeSlotsForm() {
  const { data, isLoading } = useQuery(fetchDeliveryTimeSlotsOptions());
  const updateSlots = useUpdateDeliveryTimeSlots();
  const [slots, setSlots] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // Initialize slots from data (only once)
  useEffect(() => {
    if (data?.slots && !initializedRef.current) {
      setSlots({ ...data.slots });
      setHasChanges(false);
      initializedRef.current = true;
    }
  }, [data]);

  const handleSlotChange = (key: string, value: string) => {
    setSlots((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleAddSlot = () => {
    const newKey = `SLOT_${Object.keys(slots).length + 1}`;
    setSlots((prev) => ({ ...prev, [newKey]: '00-00' }));
    setHasChanges(true);
  };

  const handleRemoveSlot = (key: string) => {
    setDeleteTarget(key);
  };

  const confirmDeleteSlot = () => {
    if (deleteTarget) {
      setSlots((prev) => {
        const newSlots = { ...prev };
        delete newSlots[deleteTarget];
        return newSlots;
      });
      setHasChanges(true);
      setDeleteTarget(null);
    }
  };

  const handleSave = async () => {
    try {
      await updateSlots.mutateAsync({ slots });
      toast.success('Хүргэлтийн цагийн хуваарь амжилттай шинэчлэгдлээ');
      setHasChanges(false);
      initializedRef.current = false; // Allow syncing with new server data
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
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const slotEntries = Object.entries(slots);

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <CardTitle>Хүргэлтийн цагийн хуваарь</CardTitle>
        </div>
        <CardDescription>
          Хүргэлтийн цагийн хуваарийг тохируулах. Формат: HH-HH (жишээ: 10-14)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {slotEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Хуваарь байхгүй байна. Дээрх товч дээр дарж нэмнэ үү.
          </div>
        ) : (
          <div className="space-y-3">
            {slotEntries.map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <div className="flex-1">
                  <Label htmlFor={`slot-${key}`} className="text-sm font-medium">
                    {key}
                  </Label>
                  <Input
                    id={`slot-${key}`}
                    value={value}
                    onChange={(e) => handleSlotChange(key, e.target.value)}
                    placeholder="10-14"
                    pattern="\d{2}-\d{2}"
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveSlot(key)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddSlot}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Хуваарь нэмэх
          </Button>
          {hasChanges && (
            <Button
              type="button"
              onClick={handleSave}
              disabled={updateSlots.isPending}
              className="flex items-center gap-2"
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
            Дараах хуваарийг устгахдаа итгэлтэй байна уу? "{deleteTarget}" Энэ үйлдлийг буцаах
            боломжгүй.
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

function DistrictsForm() {
  const { data, isLoading } = useQuery(fetchDistrictsOptions());
  const updateDistricts = useUpdateDistricts();
  const [districts, setDistricts] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // Initialize districts from data (only once)
  useEffect(() => {
    if (data?.districts && !initializedRef.current) {
      setDistricts({ ...data.districts });
      setHasChanges(false);
      initializedRef.current = true;
    }
  }, [data]);

  const handleDistrictChange = (key: string, value: number) => {
    setDistricts((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleAddDistrict = () => {
    const newKey = `Дүүрэг ${Object.keys(districts).length + 1}`;
    setDistricts((prev) => ({ ...prev, [newKey]: 1 }));
    setHasChanges(true);
  };

  const handleRemoveDistrict = (key: string) => {
    setDeleteTarget(key);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      setDistricts((prev) => {
        const newDistricts = { ...prev };
        delete newDistricts[deleteTarget];
        return newDistricts;
      });
      setHasChanges(true);
      setDeleteTarget(null);
    }
  };

  const handleSave = async () => {
    try {
      await updateDistricts.mutateAsync({ districts });
      toast.success('Дүүргүүд амжилттай шинэчлэгдлээ');
      setHasChanges(false);
      initializedRef.current = false; // Allow syncing with new server data
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Дүүргүүдийг шинэчлэхэд алдаа гарлаа',
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const districtEntries = Object.entries(districts);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <CardTitle>Дүүргүүд</CardTitle>
          </div>
          <CardDescription>
            Дүүргүүд болон тэдгээрийн хорооны тоог тохируулах
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {districtEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Дүүрэг байхгүй байна. Дээрх товч дээр дарж нэмнэ үү.
            </div>
          ) : (
            <div className="space-y-3">
              {districtEntries.map(([name, khorooCount]) => (
                <div key={name} className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label htmlFor={`district-${name}`} className="text-sm font-medium">
                      {name}
                    </Label>
                    <Input
                      id={`district-${name}`}
                      type="number"
                      min="1"
                      value={khorooCount}
                      onChange={(e) =>
                        handleDistrictChange(name, parseInt(e.target.value) || 1)
                      }
                      placeholder="Хорооны тоо"
                      className="mt-1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDistrict(name)}
                    className="text-destructive hover:text-destructive mt-6"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddDistrict}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Дүүрэг нэмэх
            </Button>
            {hasChanges && (
              <Button
                type="button"
                onClick={handleSave}
                disabled={updateDistricts.isPending}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {updateDistricts.isPending ? 'Хадгалж байна...' : 'Хадгалах'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Дүүрэг устгах</AlertDialogTitle>
            <AlertDialogDescription>
              Дараах дүүргийг устгахдаа итгэлтэй байна уу? "{deleteTarget}" Энэ үйлдлийг буцаах
              боломжгүй.
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

function ConstantsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Тогтмол утгууд</h1>
        <p className="text-muted-foreground">
          Хүргэлтийн цагийн хуваарь болон дүүргүүдийг удирдах
        </p>
      </div>

      <DeliveryTimeSlotsForm />
      <DistrictsForm />
    </div>
  );
}
