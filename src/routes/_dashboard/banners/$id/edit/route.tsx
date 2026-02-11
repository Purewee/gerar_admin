import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BannerForm } from '@/components/forms/banner-form';
import { fetchBannerOptions, useUpdateBanner } from '@/queries/banner/options';
import { toast } from 'sonner';

const TITLE = 'Баннер засах | Gerar';

export const Route = createFileRoute('/_dashboard/banners/$id/edit')({
  head: () => ({ meta: [{ title: TITLE }] }),
  component: EditBannerPage,
  loader: ({ params }) => ({ bannerId: Number(params.id) }),
});

function EditBannerPage() {
  const { bannerId } = Route.useLoaderData();
  const navigate = useNavigate();
  const { data: banner, isLoading } = useQuery(fetchBannerOptions(bannerId));
  const updateBanner = useUpdateBanner();

  const handleSubmit = async (
    values: Parameters<typeof updateBanner.mutateAsync>[0]['data'],
  ) => {
    try {
      await updateBanner.mutateAsync({ id: bannerId, data: values });
      toast.success('Баннер амжилттай шинэчлэгдлээ');
      navigate({ to: '/banners' });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Баннер шинэчлэхэд алдаа гарлаа',
      );
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Баннерыг ачаалж байна...</div>
      </div>
    );
  }

  if (!banner) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Баннер олдсонгүй</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Баннер засах</h1>
        <p className="text-muted-foreground">Баннерын мэдээллийг шинэчлэх</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Баннерын мэдээлэл</CardTitle>
          <CardDescription>
            Гарчиг, зураг, холбоос, идэвхжилт зэргийг засна уу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BannerForm
            defaultValues={{
              title: banner.title ?? '',
              description: banner.description ?? '',
              imageDesktop: banner.imageDesktop,
              imageMobile: banner.imageMobile,
              linkUrl: banner.linkUrl ?? '',
              order: banner.order,
              isActive: banner.isActive,
              startDate: banner.startDate ?? null,
              endDate: banner.endDate ?? null,
            }}
            onSubmit={handleSubmit}
            isLoading={updateBanner.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
