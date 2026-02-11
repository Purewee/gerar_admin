import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Trash2, ImageIcon } from 'lucide-react';
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
import { fetchBannersOptions, useDeleteBanner } from '@/queries/banner/options';
import { toast } from 'sonner';
import type { Banner } from '@/queries/banner/type';

const TITLE = 'Баннерууд | Gerar';

export const Route = createFileRoute('/_dashboard/banners/')({
  head: () => ({ meta: [{ title: TITLE }] }),
  component: BannersPage,
});

function BannersPage() {
  const navigate = useNavigate();
  const { data: banners = [], isLoading } = useQuery(fetchBannersOptions());
  const deleteBanner = useDeleteBanner();
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBanner.mutateAsync(deleteTarget.id);
      toast.success('Баннер амжилттай устгагдлаа');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Баннер устгахад алдаа гарлаа',
      );
    }
  };

  const sortedBanners = [...banners].sort((a, b) => a.order - b.order);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Баннеруудыг ачаалж байна...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Баннерууд</h1>
          <p className="text-muted-foreground">
            Нүүр хуудас болон хуудсууд дээр харагдах баннерууд
          </p>
        </div>
        <Button onClick={() => navigate({ to: '/banners/new' })}>
          <Plus className="mr-2 h-4 w-4" />
          Шинэ баннер
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Бүх баннерууд</CardTitle>
          <CardDescription>Дарааллаар нь жагсаасан. Засах эсвэл устгах боломжтой.</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedBanners.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Баннер олдсонгүй. Эхлээд шинэ баннер нэмнэ үү.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedBanners.map((banner) => (
                <div
                  key={banner.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg border bg-card"
                >
                  <div className="relative w-full sm:w-48 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                    {banner.imageDesktop ? (
                      <img
                        src={banner.imageDesktop}
                        alt={banner.title || 'Banner'}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{banner.title || '(Гарчиггүй)'}</div>
                    {banner.description && (
                      <div className="text-sm text-muted-foreground truncate">
                        {banner.description}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="outline">Дараалал: {banner.order}</Badge>
                      {banner.isActive ? (
                        <Badge variant="default">Идэвхтэй</Badge>
                      ) : (
                        <Badge variant="secondary">Идэвхгүй</Badge>
                      )}
                      {banner.linkUrl && (
                        <Badge variant="secondary">Холбоостой</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate({ to: '/banners/$id/edit', params: { id: String(banner.id) } })
                      }
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(banner)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Баннер устгах</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.title || '(Гарчиггүй)'}&quot; баннерыг устгахдаа итгэлтэй байна уу?
              Энэ үйлдлийг буцаах боломжгүй.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteBanner.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBanner.isPending ? 'Устгаж байна...' : 'Устгах'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
