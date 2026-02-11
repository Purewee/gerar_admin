import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureForm } from '@/components/forms/feature-form';
import { useCreateFeature } from '@/queries/feature/options';
import { toast } from 'sonner';

const TITLE = 'Шинэ онцлох | Gerar';

export const Route = createFileRoute('/_dashboard/features/new')({
  head: () => ({ meta: [{ title: TITLE }] }),
  component: NewFeaturePage,
});

function NewFeaturePage() {
  const navigate = useNavigate();
  const createFeature = useCreateFeature();

  const handleSubmit = async (
    values: Parameters<typeof createFeature.mutateAsync>[0],
  ) => {
    try {
      await createFeature.mutateAsync(values);
      toast.success('Онцлох амжилттай үүслээ');
      navigate({ to: '/features' });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Онцлох үүсгэхэд алдаа гарлаа',
      );
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Шинэ онцлох</h1>
        <p className="text-muted-foreground">
          Онцлох (жишээ: Хамгийн их борлуулалттай) нэмэх. Бүтээгдэхүүнийг энэ онцлоход бүтээгдэхүүн
          засах/үүсгэх хуудсаас онооно.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Онцлохын мэдээлэл</CardTitle>
          <CardDescription>Нэр, тайлбар, дараалал оруулна уу</CardDescription>
        </CardHeader>
        <CardContent>
          <FeatureForm onSubmit={handleSubmit} isLoading={createFeature.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
