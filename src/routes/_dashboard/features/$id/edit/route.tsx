import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureForm } from '@/components/forms/feature-form';
import { fetchFeatureOptions, useUpdateFeature } from '@/queries/feature/options';
import { toast } from 'sonner';

const TITLE = 'Онцлох засах | Gerar';

export const Route = createFileRoute('/_dashboard/features/$id/edit')({
  head: () => ({ meta: [{ title: TITLE }] }),
  component: EditFeaturePage,
  loader: ({ params }) => ({ featureId: Number(params.id) }),
});

function EditFeaturePage() {
  const { featureId } = Route.useLoaderData();
  const navigate = useNavigate();
  const { data: feature, isLoading } = useQuery(fetchFeatureOptions(featureId));
  const updateFeature = useUpdateFeature();

  const handleSubmit = async (
    values: Parameters<typeof updateFeature.mutateAsync>[0]['data'],
  ) => {
    try {
      await updateFeature.mutateAsync({ id: featureId, data: values });
      toast.success('Онцлох амжилттай шинэчлэгдлээ');
      navigate({ to: '/features' });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Онцлох шинэчлэхэд алдаа гарлаа',
      );
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Онцлохыг ачаалж байна...</div>
      </div>
    );
  }

  if (!feature) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Онцлох олдсонгүй</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Онцлох засах</h1>
        <p className="text-muted-foreground">Онцлохын мэдээллийг шинэчлэх</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Онцлохын мэдээлэл</CardTitle>
          <CardDescription>Нэр, тайлбар, дараалал засна уу</CardDescription>
        </CardHeader>
        <CardContent>
          <FeatureForm
            defaultValues={{
              name: feature.name,
              description: feature.description ?? '',
              order: feature.order,
            }}
            onSubmit={handleSubmit}
            isLoading={updateFeature.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
