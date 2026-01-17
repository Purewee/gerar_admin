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
import { GripVertical, Save, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchCategoriesOptions, useUpdateCategory } from '@/queries/category/options';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import type { Category } from '@/queries/category/type';

export const Route = createFileRoute('/_dashboard/categories/order')({
  component: CategoryOrderPage,
});

interface SortableCategoryItemProps {
  category: Category;
}

function SortableCategoryItem({ category }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

      <div className="flex items-center gap-3 flex-shrink-0">
        <Folder className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{category.name}</h3>
        {category.description && (
          <p className="text-sm text-muted-foreground truncate">
            {category.description}
          </p>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        ID: {category.id}
      </div>
    </div>
  );
}

function CategoryOrderPage() {
  const queryClient = useQueryClient();
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const lastSyncedParentId = useRef<number | null>(null);
  const lastSyncedCategoryIds = useRef<string>('');
  const hasChangesRef = useRef(false);
  
  // Keep ref in sync with state (so we can check it in useEffect without dependency)
  useEffect(() => {
    hasChangesRef.current = hasChanges;
  }, [hasChanges]);

  const { data: allCategories = [], isLoading } = useQuery(fetchCategoriesOptions());
  const updateCategory = useUpdateCategory();

  // Filter categories based on selected parent
  const filteredCategories = selectedParentId === null
    ? allCategories.filter((cat) => cat.parentId === null)
    : allCategories.filter((cat) => cat.parentId === selectedParentId);

  // Create a stable string of category IDs for dependency tracking
  const categoryIdsString = filteredCategories.map(c => c.id).sort().join(',');

  // Update local categories when filtered categories change or parent changes
  useEffect(() => {
    if (selectedParentId === null && lastSyncedParentId.current !== null) {
      // Switching to root categories
      setCategories([...filteredCategories]);
      setHasChanges(false);
      lastSyncedParentId.current = null;
      lastSyncedCategoryIds.current = categoryIdsString;
      return;
    }

    // Check if parent changed
    const parentChanged = lastSyncedParentId.current !== selectedParentId;
    
    // Check if category list actually changed (by IDs)
    const categoryListChanged = categoryIdsString !== lastSyncedCategoryIds.current;

    // Only sync if parent changed (always sync on parent change)
    // Don't sync if we have local changes unless parent changed
    if (parentChanged) {
      if (filteredCategories.length > 0) {
        // Sort by order if available, otherwise by id
        const sorted = [...filteredCategories].sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          return a.id - b.id;
        });
        setCategories(sorted);
      } else {
        setCategories([]);
      }
      setHasChanges(false);
      lastSyncedParentId.current = selectedParentId;
      lastSyncedCategoryIds.current = categoryIdsString;
    } else if (categoryListChanged && !hasChangesRef.current) {
      // Only sync if category list changed from server AND no local changes
      if (filteredCategories.length > 0) {
        const sorted = [...filteredCategories].sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          return a.id - b.id;
        });
        setCategories(sorted);
      } else {
        setCategories([]);
      }
      lastSyncedCategoryIds.current = categoryIdsString;
    }
    // If hasChangesRef.current is true, don't sync (user is dragging)
  }, [categoryIdsString, selectedParentId, filteredCategories.length]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        setHasChanges(true);
        return newItems;
      });
    }
  };

  const handleSave = async () => {
    if (categories.length === 0) {
      toast.error('Ангилал байхгүй байна');
      return;
    }

    try {
      // Update each category with its new order
      const updatePromises = categories.map((category, index) => {
        return updateCategory.mutateAsync({
          id: category.id,
          data: {
            name: category.name,
            description: category.description ?? null,
            parentId: category.parentId,
            order: index,
          },
        });
      });

      await Promise.all(updatePromises);
      
      toast.success('Ангиллын дараалал амжилттай хадгалагдлаа');
      setHasChanges(false);
      
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Ангиллын дарааллыг хадгалахад алдаа гарлаа'
      );
    }
  };

  const rootCategories = allCategories.filter((cat) => cat.parentId === null);
  const selectedParent = selectedParentId !== null
    ? allCategories.find((cat) => cat.id === selectedParentId)
    : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Ангиллын дараалал</h1>
        <p className="text-muted-foreground">
          Ангиллуудын дарааллыг зохицуулах
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ангилал сонгох</CardTitle>
          <CardDescription>
            Үндсэн ангиллууд эсвэл дэд ангиллуудын дарааллыг өөрчлөх ангиллыг сонгоно уу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select
              value={selectedParentId?.toString() ?? 'root'}
              onValueChange={(value) => {
                if (value === 'root') {
                  setSelectedParentId(null);
                } else {
                  setSelectedParentId(Number(value));
                }
                setHasChanges(false);
              }}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Ангилал сонгох" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Үндсэн ангиллууд</SelectItem>
                {rootCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name} - Дэд ангиллууд
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasChanges && (
              <Button onClick={handleSave} disabled={updateCategory.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateCategory.isPending ? 'Хадгалж байна...' : 'Хадгалах'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedParentId === null
              ? 'Үндсэн ангиллууд - Дараалал'
              : `${selectedParent?.name || 'Ангилал'} - Дэд ангиллуудын дараалал`}
          </CardTitle>
          <CardDescription>
            Ангиллуудыг чирж буулгах замаар дарааллыг өөрчилнө үү. Дээрх
            ангиллууд эхлээд харагдана.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {selectedParentId === null
                ? 'Үндсэн ангилал байхгүй байна.'
                : 'Энэ ангилалд дэд ангилал байхгүй байна.'}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={categories.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {categories.map((category, index) => (
                    <div key={category.id} className="relative">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-8 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {index + 1}
                      </div>
                      <SortableCategoryItem category={category} />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
