import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Star, ArrowUpDown, Package } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { fetchFeatureOptions, fetchFeaturesOptions, useDeleteFeature } from '@/queries/feature/options';
import { toast } from 'sonner';
import type { Feature } from '@/queries/feature/type';

const TITLE = 'Онцлох | Gerar';

export const Route = createFileRoute('/_dashboard/features/')({
  head: () => ({ meta: [{ title: TITLE }] }),
  component: FeaturesPage,
});

function FeaturesPage() {
  const navigate = useNavigate();
  const { data: features = [], isLoading } = useQuery(fetchFeaturesOptions());
  const deleteFeature = useDeleteFeature();
  const [deleteTarget, setDeleteTarget] = useState<Feature | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFeature.mutateAsync(deleteTarget.id);
      toast.success('Онцлох амжилттай устгагдлаа');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Онцлох устгахад алдаа гарлаа',
      );
    }
  };

  const sortedFeatures = [...features].sort((a, b) => a.order - b.order);

  // Fetch each feature with products to show product count (and ensure we have products for links)
  const featureDetailsQueries = useQueries({
    queries: sortedFeatures.map((f) => fetchFeatureOptions(f.id)),
  });

  const getProductCount = (featureId: number): number | null => {
    const idx = sortedFeatures.findIndex((f) => f.id === featureId);
    if (idx < 0) return null;
    const q = featureDetailsQueries[idx];
    const data = q?.data as Feature | undefined;
    if (!q?.isSuccess || !data) return null;
    const products = data.products;
    return Array.isArray(products) ? products.length : 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Онцлохыг ачаалж байна...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Онцлох</h1>
          <p className="text-muted-foreground">
            Бүтээгдэхүүнийг онцлох (жишээ: Хамгийн их борлуулалттай) болгон бүлэглэх
          </p>
        </div>
        <Button onClick={() => navigate({ to: '/features/new' })}>
          <Plus className="mr-2 h-4 w-4" />
          Шинэ онцлох
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Бүх онцлох</CardTitle>
          <CardDescription>
            Онцлох бүрт бүтээгдэхүүн оноохыг бүтээгдэхүүн засах/үүсгэх хуудсаас хийж болно.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedFeatures.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Онцлох олдсонгүй. Эхлээд шинэ онцлох нэмнэ үү.
            </div>
          ) : (
            <div className="space-y-2">
              {sortedFeatures.map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Star className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{feature.name}</div>
                      {feature.description && (
                        <div className="text-sm text-muted-foreground">
                          {feature.description}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Дараалал: {feature.order}</span>
                        <span className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5" />
                          {(() => {
                            const count = getProductCount(feature.id);
                            return count !== null ? `${count} бараа` : '...';
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate({ to: '/features/$id/order', params: { id: String(feature.id) } })
                      }
                      title="Бараа харах, дараалал өөрчлөх"
                    >
                      <ArrowUpDown className="h-4 w-4 mr-1" />
                      Бараа / Дараалал
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate({ to: '/features/$id/edit', params: { id: String(feature.id) } })
                      }
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(feature)}
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
            <AlertDialogTitle>Онцлох устгах</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.name}&quot; онцлохыг устгахдаа итгэлтэй байна уу? Энэ онцлоход
              бүтээгдэхүүн байвал эхлээд бүтээгдэхүүнээс нь хасах хэрэгтэй. Энэ үйлдлийг буцаах
              боломжгүй.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteFeature.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteFeature.isPending ? 'Устгаж байна...' : 'Устгах'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
