import { createFileRoute } from '@tanstack/react-router';
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
import { GripVertical, Save, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchCategoriesOptions } from '@/queries/category/options';
import { fetchProductsOptions, useUpdateProduct } from '@/queries/product/options';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/queries/product/type';

export const Route = createFileRoute('/_dashboard/products/order')({
  component: ProductOrderPage,
});

interface SortableProductItemProps {
  product: Product;
}

function SortableProductItem({ product }: SortableProductItemProps) {
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

      <div className="text-sm text-muted-foreground">
        ID: {product.id}
      </div>
    </div>
  );
}

function ProductOrderPage() {
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const lastSyncedCategoryId = useRef<number | null>(null);
  const lastSyncedProductIds = useRef<string>('');
  const hasChangesRef = useRef(false);
  
  // Keep ref in sync with state (so we can check it in useEffect without dependency)
  useEffect(() => {
    hasChangesRef.current = hasChanges;
  }, [hasChanges]);

  const { data: categories = [] } = useQuery(fetchCategoriesOptions());
  const updateProduct = useUpdateProduct();

  // Fetch products for selected category (without sortBy to get natural order)
  const { data: fetchedProducts = [], isLoading } = useQuery({
    ...fetchProductsOptions({
      categoryId: selectedCategoryId || undefined,
      limit: 1000, // Get all products in category
    }),
    enabled: !!selectedCategoryId,
  });

  // Create a stable string of product IDs for dependency tracking (outside useEffect)
  const productIdsString = fetchedProducts.map(p => p.id).sort().join(',');

  // Update local products when fetched products change or category changes
  useEffect(() => {
    if (!selectedCategoryId) {
      setProducts([]);
      setHasChanges(false);
      lastSyncedCategoryId.current = null;
      lastSyncedProductIds.current = '';
      return;
    }

    // Check if category changed
    const categoryChanged = lastSyncedCategoryId.current !== selectedCategoryId;
    
    // Check if product list actually changed (by IDs)
    const productListChanged = productIdsString !== lastSyncedProductIds.current;

    // Only sync if category changed (always sync on category change)
    // Don't sync if we have local changes unless category changed
    if (categoryChanged) {
      if (fetchedProducts.length > 0) {
        setProducts([...fetchedProducts]);
      } else {
        setProducts([]);
      }
      setHasChanges(false);
      lastSyncedCategoryId.current = selectedCategoryId;
      lastSyncedProductIds.current = productIdsString;
    } else if (productListChanged && !hasChangesRef.current) {
      // Only sync if product list changed from server AND no local changes
      if (fetchedProducts.length > 0) {
        setProducts([...fetchedProducts]);
      } else {
        setProducts([]);
      }
      lastSyncedProductIds.current = productIdsString;
    }
    // If hasChangesRef.current is true, don't sync (user is dragging)
  }, [productIdsString, selectedCategoryId, fetchedProducts.length]); // Use stable string + length, check hasChanges via ref

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
    if (!selectedCategoryId || products.length === 0) {
      toast.error('Ангилал эсвэл бараа сонгоогүй байна');
      return;
    }

    try {
      // Update each product with its new order
      const updatePromises = products.map((product, index) => {
        const currentCategoryIds = product.categories?.map((c) => c.id) || 
                                  (product.categoryId ? [product.categoryId] : []);
        
        const hasSelectedCategory = currentCategoryIds.includes(selectedCategoryId);

        // Option 1: Update orders only (without changing categories)
        // This is more efficient when just reordering within existing categories
        if (hasSelectedCategory) {
          // Product already has the selected category, just update its order
          const categoryOrders: Record<string, number> = {
            [selectedCategoryId.toString()]: index,
          };

          return updateProduct.mutateAsync({
            id: product.id,
            data: {
              categoryOrders: categoryOrders,
            },
          });
        } else {
          // Option 2: Add category and set its order
          const categoryIdsToUpdate = [...currentCategoryIds, selectedCategoryId];
          const categoryOrders: Record<string, number> = {
            [selectedCategoryId.toString()]: index,
          };

          return updateProduct.mutateAsync({
            id: product.id,
            data: {
              categoryIds: categoryIdsToUpdate,
              categoryOrders: categoryOrders,
            },
          });
        }
      });

      await Promise.all(updatePromises);
      
      toast.success('Барааны дараалал амжилттай хадгалагдлаа');
      setHasChanges(false);
      
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Барааны дарааллыг хадгалахад алдаа гарлаа'
      );
    }
  };

  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Барааны дараалал</h1>
        <p className="text-muted-foreground">
          Ангиллын доторх барааны дарааллыг зохицуулах
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ангилал сонгох</CardTitle>
          <CardDescription>
            Барааны дарааллыг өөрчлөх ангиллыг сонгоно уу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select
              value={selectedCategoryId?.toString() || ''}
              onValueChange={(value) => {
                setSelectedCategoryId(value ? Number(value) : null);
                setHasChanges(false);
              }}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Ангилал сонгох" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCategory && hasChanges && (
              <Button onClick={handleSave} disabled={updateProduct.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateProduct.isPending ? 'Хадгалж байна...' : 'Хадгалах'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedCategoryId && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedCategory?.name || 'Ангилал'} - Барааны дараалал
            </CardTitle>
            <CardDescription>
              Бараануудыг чирж буулгах замаар дарааллыг өөрчилнө үү. Дээрх
              бараанууд эхлээд харагдана.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Энэ ангилалд бараа байхгүй байна.
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
                        <SortableProductItem product={product} />
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedCategoryId && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Ангилал сонгоод барааны дарааллыг өөрчлөх
          </CardContent>
        </Card>
      )}
    </div>
  );
}
