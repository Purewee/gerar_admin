import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductForm } from '@/components/forms/product-form';
import { fetchCategoriesOptions } from '@/queries/category/options';
import { useCreateProduct } from '@/queries/product/options';
import { toast } from 'sonner';

export const Route = createFileRoute('/_dashboard/products/new')({
  component: NewProductPage,
});

function NewProductPage() {
  const navigate = useNavigate();
  const { data: categories = [] } = useQuery(fetchCategoriesOptions());
  const createProduct = useCreateProduct();

  const handleSubmit = async (values: Parameters<typeof createProduct.mutateAsync>[0]) => {
    try {
      await createProduct.mutateAsync(values);
      toast.success('Product created successfully');
      navigate({ to: '/products' });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create product',
      );
      throw error;
    }
  };

  if (categories.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Бараа нэмэх</h1>
          <p className="text-muted-foreground">Шинэ бараа нэмэх</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Шинэ бараа нэмэхийн тулд эхлээд багадаа нэг ангилал үүсгээрэй.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Бараа нэмэх</h1>
        <p className="text-muted-foreground">Шинэ бараа нэмэх</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Барааны мэдээлэл</CardTitle>
          <CardDescription>Барааны дэлгэрэнгүй мэдээллийг оруулна уу</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm
            categories={categories}
            onSubmit={handleSubmit}
            isLoading={createProduct.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
