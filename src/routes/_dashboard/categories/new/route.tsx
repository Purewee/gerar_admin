import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryForm } from '@/components/forms/category-form';
import { fetchCategoriesOptions, useCreateCategory } from '@/queries/category/options';
import { toast } from 'sonner';

export const Route = createFileRoute('/_dashboard/categories/new')({
  component: NewCategoryPage,
});

function NewCategoryPage() {
  const navigate = useNavigate();
  const { data: categories = [] } = useQuery(fetchCategoriesOptions());
  const createCategory = useCreateCategory();

  const handleSubmit = async (
    values: Parameters<typeof createCategory.mutateAsync>[0],
  ) => {
    try {
      await createCategory.mutateAsync(values);
      toast.success('Ангилал амжилттай үүслээ');
      navigate({ to: '/categories' });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Ангилал үүсгэхэд алдаа гарлаа',
      );
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Шинэ ангилал</h1>
        <p className="text-muted-foreground">Шинэ ангилал эсвэл дэд ангилал үүсгэх</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ангилалын мэдээлэл</CardTitle>
          <CardDescription>Үүсгэх гэж буй ангиллын мэдээллийг дор оруулна уу</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryForm
            categories={categories}
            onSubmit={handleSubmit}
            isLoading={createCategory.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
