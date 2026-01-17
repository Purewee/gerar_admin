import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Trash2, ChevronRight, Folder } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { fetchCategoriesOptions, useDeleteCategory, useCreateCategory } from '@/queries/category/options';
import { toast } from 'sonner';
import type { Category } from '@/queries/category/type';
import { CategoryForm } from '@/components/forms/category-form';
import type { CreateCategoryRequest } from '@/queries/category/type';

function CategoryTree({ 
  categories, 
  onEdit, 
  onDelete,
  onAddSubcategory
}: { 
  categories: Category[]; 
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onAddSubcategory: (category: Category) => void;
}) {
  const sortCategories = (items: Category[]) => {
    return [...items].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.id - b.id;
    });
  };

  const rootCategories = sortCategories(
    categories.filter((cat) => cat.parentId === null),
  );
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const getSubcategories = (parentId: number) => {
    return sortCategories(categories.filter((cat) => cat.parentId === parentId));
  };

  const renderCategory = (category: Category, level = 0) => {
    const subcategories = getSubcategories(category.id);
    const hasChildren = subcategories.length > 0;
    const isExpanded = expanded.has(category.id);

    return (
      <div key={category.id} className="mb-2">
        <div
          className={`flex items-center gap-2 p-2 rounded-lg hover:bg-muted ${
            level > 0 ? 'ml-6' : ''
          }`}
        >
          {hasChildren && (
            <button
              onClick={() => toggleExpand(category.id)}
              className="p-1 hover:bg-background rounded"
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            </button>
          )}
          {!hasChildren && (
            <Folder className="h-4 w-4 text-muted-foreground ml-1" />
          )}
          <div className="flex-1">
            <div className="font-medium">{category.name}</div>
            {category.description && (
              <div className="text-sm text-muted-foreground">
                {category.description}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {category.parentId && (
              <Badge variant="secondary">Subcategory</Badge>
            )}
            {!category.parentId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddSubcategory(category)}
                title="Дэд ангилал нэмэх"
                className="bg-primary/5 hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(category)}
              className="bg-blue-500/5 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(category)}
              className="bg-destructive/5 hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {subcategories.map((sub) => renderCategory(sub, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {rootCategories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Ангилал олдсонгүй. Эхлээд ангилал үүсгээрэй!
        </div>
      ) : (
        rootCategories.map((category) => renderCategory(category))
      )}
    </div>
  );
}

export const Route = createFileRoute('/_dashboard/categories/')({
  component: CategoriesPage,
});

function CategoriesPage() {
  const navigate = useNavigate();
  const { data: categories = [], isLoading } = useQuery(fetchCategoriesOptions());
  const deleteCategory = useDeleteCategory();
  const createCategory = useCreateCategory();
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [subcategoryParent, setSubcategoryParent] = useState<Category | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteCategory.mutateAsync(deleteTarget.id);
      toast.success('Ангилал амжилттай устгагдлаа');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Ангилал устгахад алдаа гарлаа',
      );
    }
  };

  const handleCreateSubcategory = async (values: CreateCategoryRequest) => {
    if (!subcategoryParent) return;

    try {
      await createCategory.mutateAsync({
        ...values,
        parentId: subcategoryParent.id,
      });
      toast.success('Дэд ангилал амжилттай үүслээ');
      setSubcategoryParent(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Дэд ангилал үүсгэхэд алдаа гарлаа',
      );
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Ангиллуудыг ачаалж байна...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ангиллууд</h1>
          <p className="text-muted-foreground">
          Барааны ангилал болон дэд ангиллууд
          </p>
        </div>
        <Button onClick={() => navigate({ to: '/categories/new' })}>
          <Plus className="mr-2 h-4 w-4" />
          Шинэ ангилал
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Бүх ангиллууд</CardTitle>
          <CardDescription>
            Ангилал дээр дарж дэд ангиллуудыг харах боломжтой
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryTree
            categories={categories}
            onEdit={(category) =>
              navigate({ to: '/categories/$id/edit', params: { id: String(category.id) } })
            }
            onDelete={setDeleteTarget}
            onAddSubcategory={setSubcategoryParent}
          />
        </CardContent>
      </Card>

      <Sheet open={!!subcategoryParent} onOpenChange={(open) => !open && setSubcategoryParent(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pl-4">
            <SheetTitle>Дэд ангилал нэмэх</SheetTitle>
            <SheetDescription>
              "{subcategoryParent?.name}" ангиллын доор дэд ангилал үүсгэх
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 pl-4">
            {subcategoryParent && (
              <CategoryForm
                key={subcategoryParent.id}
                categories={categories}
                defaultValues={{
                  parentId: subcategoryParent.id,
                }}
                onSubmit={handleCreateSubcategory}
                isLoading={createCategory.isPending}
                disableParentSelect={true}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ангилал устгах</AlertDialogTitle>
            <AlertDialogDescription>
              Дараах ангиллыг устгахдаа итгэлтэй байна уу? "{deleteTarget?.name}" Энэ үйлдлийг буцаах боломжгүй.
              Тухайн ангилал дотор бараа эсвэл дэд ангилал байвал устгах боломжгүй.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteCategory.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCategory.isPending ? 'Устгаж байна...' : 'Устгах'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
