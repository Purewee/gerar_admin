import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BannerForm } from '@/components/forms/banner-form';
import { useCreateBanner } from '@/queries/banner/options';
import { toast } from 'sonner';

const TITLE = 'Шинэ баннер | Gerar';

export const Route = createFileRoute('/_dashboard/banners/new')({
  head: () => ({ meta: [{ title: TITLE }] }),
  component: NewBannerPage,
});

function NewBannerPage() {
  const navigate = useNavigate();
  const createBanner = useCreateBanner();

  const handleSubmit = async (
    values: Parameters<typeof createBanner.mutateAsync>[0],
  ) => {
    try {
      await createBanner.mutateAsync(values);
      toast.success('Баннер амжилттай үүслээ');
      navigate({ to: '/banners' });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Баннер үүсгэхэд алдаа гарлаа',
      );
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Шинэ баннер</h1>
        <p className="text-muted-foreground">
          Нүүр эсвэл хуудсанд харагдах баннер нэмэх. Desktop болон mobile зургийг заавал оруулна.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Баннерын мэдээлэл</CardTitle>
          <CardDescription>
            Гарчиг, зураг (desktop/mobile), холбоос, идэвхжилт зэргийг оруулна уу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BannerForm onSubmit={handleSubmit} isLoading={createBanner.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
