import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Save, Image as ImageIcon, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { fetchFeatureOptions } from '@/queries/feature/options';
import { useUpdateProduct } from '@/queries/product/options';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import type { Feature } from '@/queries/feature/type';
import type { Product } from '@/queries/product/type';

const TITLE = 'Онцлох дараалал | Gerar';

export const Route = createFileRoute('/_dashboard/features/$id/order')({
  head: () => ({ meta: [{ title: TITLE }] }),
  component: FeatureOrderPage,
  loader: ({ params }) => ({ featureId: Number(params.id) }),
});

interface SortableProductItemProps {
  product: Product;
  onRemoveFromFeature: (product: Product) => void;
  isRemoving: boolean;
}

function SortableProductItem({
  product,
  onRemoveFromFeature,
  isRemoving,
}: SortableProductItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const productImage = product.firstImage || product.images?.[0] || null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 border rounded-lg bg-card ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {productImage ? (
        <div className="relative w-16 h-16 border rounded-md overflow-hidden flex-shrink-0">
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="w-16 h-16 border rounded-md flex items-center justify-center bg-muted flex-shrink-0">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{product.name}</h3>
        <p className="text-sm text-muted-foreground truncate">
          {product.description}
        </p>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-sm font-medium">{formatPrice(product.price)}</span>
          <span className="text-sm text-muted-foreground">
            Үлдэгдэл: {product.stock}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">ID: {product.id}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromFeature(product);
          }}
          disabled={isRemoving}
          title="Энэ онцлохоос хасах"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function getProductsFromFeature(feature: Feature): Product[] {
  const raw = feature.products;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw as Product[];
}

function sortProductsByFeatureOrder(
  products: Product[],
  featureId: number
): Product[] {
  return [...products].sort((a, b) => {
    const orderA = (a as Product & { featureOrders?: Record<number, number> })
      .featureOrders?.[featureId] ?? 9999;
    const orderB = (b as Product & { featureOrders?: Record<number, number> })
      .featureOrders?.[featureId] ?? 9999;
    return orderA - orderB;
  });
}

function FeatureOrderPage() {
  const { featureId } = Route.useLoaderData();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: feature, isLoading } = useQuery(fetchFeatureOptions(featureId));
  const updateProduct = useUpdateProduct();

  const [products, setProducts] = useState<Product[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Product | null>(null);
  const [removingProductId, setRemovingProductId] = useState<number | null>(null);
  const lastProductIdsRef = useRef<string>('');
  const hasChangesRef = useRef(false);

  useEffect(() => {
    hasChangesRef.current = hasChanges;
  }, [hasChanges]);

  useEffect(() => {
    if (!feature || hasChangesRef.current) return;
    const raw = getProductsFromFeature(feature);
    const sorted = sortProductsByFeatureOrder(raw, featureId);
    const ids = sorted.map((p) => p.id).sort().join(',');
    if (ids !== lastProductIdsRef.current) {
      setProducts([...sorted]);
      lastProductIdsRef.current = ids;
    }
  }, [feature, featureId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setProducts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        setHasChanges(true);
        return newItems;
      });
    }
  };

  const handleSave = async () => {
    if (products.length === 0) {
      toast.error('Бараа байхгүй байна');
      return;
    }
    try {
      await Promise.all(
        products.map((product, index) =>
          updateProduct.mutateAsync({
            id: product.id,
            data: {
              featureOrders: {
                [featureId.toString()]: index,
              },
            },
          })
        )
      );
      toast.success('Онцлох дахь барааны дараалал хадгалагдлаа');
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['features'] });
      queryClient.invalidateQueries({ queryKey: ['features', featureId] });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Дарааллыг хадгалахад алдаа гарлаа'
      );
    }
  };

  const handleRemoveFromFeature = (product: Product) => {
    setRemoveTarget(product);
  };

  const confirmRemoveFromFeature = async () => {
    if (!removeTarget) return;
    const product = removeTarget;
    setRemoveTarget(null);
    setRemovingProductId(product.id);
    try {
      const productWithFeatures = product as Product & {
        features?: { id: number }[];
      };
      const currentFeatureIds =
        productWithFeatures.features?.map((f) => f.id) ?? [featureId];
      const newFeatureIds = currentFeatureIds.filter((id) => id !== featureId);

      await updateProduct.mutateAsync({
        id: product.id,
        data: { featureIds: newFeatureIds },
      });

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      lastProductIdsRef.current = products
        .filter((p) => p.id !== product.id)
        .map((p) => p.id)
        .sort()
        .join(',');
      queryClient.invalidateQueries({ queryKey: ['features'] });
      queryClient.invalidateQueries({ queryKey: ['features', featureId] });
      toast.success('Барааг онцлохоос хаслаа');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Барааг онцлохоос хахад алдаа гарлаа'
      );
    } finally {
      setRemovingProductId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!feature) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Онцлох олдсонгүй
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/features' })}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Буцах
          </Button>
          <h1 className="text-3xl font-bold">
            Онцлох: {feature.name}
          </h1>
          <p className="text-muted-foreground">
            Энэ онцлоход байгаа бараануудын дарааллыг чирж өөрчилнө
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={updateProduct.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateProduct.isPending ? 'Хадгалж байна...' : 'Хадгалах'}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Бараанууд ({products.length})</CardTitle>
          <CardDescription>
            Дээрх дарааллаар онцлох хуудсанд харагдана. Чирж буулгаж дарааллыг
            өөрчилнө үү.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Энэ онцлоход бараа байхгүй. Бүтээгдэхүүн засах хуудаснаас онцлох
              сонгож нэмнэ үү.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={products.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {products.map((product, index) => (
                    <div key={product.id} className="relative">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-8 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {index + 1}
                      </div>
                      <SortableProductItem
                        product={product}
                        onRemoveFromFeature={handleRemoveFromFeature}
                        isRemoving={removingProductId === product.id}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Онцлохоос хасах</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{removeTarget?.name}&quot; барааг энэ онцлохоос хасах уу? Бараа
              устгагдахгүй, зөвхөн энэ онцлогт харагдахаа больно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveFromFeature}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Хасах
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
