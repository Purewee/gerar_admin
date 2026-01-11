import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryForm } from '@/components/forms/category-form';
import {
  fetchCategoriesOptions,
  fetchCategoryOptions,
  useUpdateCategory,
} from '@/queries/category/options';
import { toast } from 'sonner';

export const Route = createFileRoute('/_dashboard/categories/$id/edit')({
  component: EditCategoryPage,
  loader: ({ params }) => {
    return { categoryId: Number(params.id) };
  },
});

function EditCategoryPage() {
  const { categoryId } = Route.useLoaderData();
  const navigate = useNavigate();
  const { data: categories = [] } = useQuery(fetchCategoriesOptions());
  const { data: category, isLoading } = useQuery(fetchCategoryOptions(categoryId));
  const updateCategory = useUpdateCategory();

  const handleSubmit = async (
    values: Parameters<typeof updateCategory.mutateAsync>[0]['data'],
  ) => {
    try {
      await updateCategory.mutateAsync({ id: categoryId, data: values });
      toast.success('Ангилал амжилттай шинэчлэгдлээ');
      navigate({ to: '/categories' });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Ангилал шинэчлэхэд алдаа гарлаа',
      );
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Ангилалын мэдээллийг ачааллаж байна...</div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Ангилал олдсонгүй</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Ангилал шинэчлэх</h1>
        <p className="text-muted-foreground">Ангилалын мэдээллийг шинэчлэх</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ангилалын мэдээлэл</CardTitle>
          <CardDescription>Шинэчлэх гэж буй ангиллын мэдээллийг дор оруулна уу</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryForm
            categories={categories}
            defaultValues={{
              id: category.id,
              name: category.name,
              description: category.description || '',
              parentId: category.parentId,
            }}
            onSubmit={handleSubmit}
            isLoading={updateCategory.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
