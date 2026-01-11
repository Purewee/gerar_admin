import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductForm } from '@/components/forms/product-form';
import {
  fetchCategoriesOptions,
} from '@/queries/category/options';
import {
  fetchProductOptions,
  useUpdateProduct,
} from '@/queries/product/options';
import { toast } from 'sonner';

export const Route = createFileRoute('/_dashboard/products/$id/edit')({
  component: EditProductPage,
  loader: ({ params }) => {
    return { productId: Number(params.id) };
  },
});

function EditProductPage() {
  const { productId } = Route.useLoaderData();
  const navigate = useNavigate();
  const { data: categories = [] } = useQuery(fetchCategoriesOptions());
  const { data: product, isLoading } = useQuery(fetchProductOptions(productId));
  const updateProduct = useUpdateProduct();

  const handleSubmit = async (
    values: Parameters<typeof updateProduct.mutateAsync>[0]['data'],
  ) => {
    try {
      await updateProduct.mutateAsync({ id: productId, data: values });
      toast.success('Бараа амжилттай шинэчлэгдлээ');
      navigate({ to: '/products' });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Барааг шинэчлэхэд алдаа гарлаа',
      );
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Барааны мэдээллийг ачааллаж байна...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Бараа олдсонгүй</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Бараа шинэчлэх</h1>
        <p className="text-muted-foreground">Барааны мэдээллийг шинэчлэх</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Барааны мэдээлэл</CardTitle>
          <CardDescription>Барааны дэлгэрэнгүй мэдээллийг шинэчлэх</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm
            categories={categories}
            defaultValues={{
              name: product.name,
              description: product.description,
              price: parseFloat(product.price),
              stock: product.stock,
              categoryId: product.categoryId || undefined,
              categoryIds: product.categories?.map(cat => cat.id) || (product.categoryId ? [product.categoryId] : []),
              images: product.images || [],
            }}
            onSubmit={handleSubmit}
            isLoading={updateProduct.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
