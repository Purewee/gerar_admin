import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, X, Image as ImageIcon, Coins, Upload, Loader2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow, 
} from '@/components/ui/table';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchPointProductsOptions, useDeletePointProduct, useCreatePointProduct, useUpdatePointProduct } from '@/queries/point-product/options';
import { uploadFile } from '@/lib/file-upload';
import { toast } from 'sonner';
import type { PointProduct, CreatePointProductRequest } from '@/queries/point-product/type';
import type { PointProductSearchParams } from '@/queries/point-product/query';
import { Skeleton } from '@/components/ui/skeleton';

const TITLE = 'Лояалти дэлгүүр | Gerar';

export const Route = createFileRoute('/_dashboard/point-products/')({
  head: () => ({ meta: [{ title: TITLE }] }),
  component: PointProductsPage,
});

function PointProductsPage() {
  const deletePointProduct = useDeletePointProduct();
  const createPointProduct = useCreatePointProduct();
  const updatePointProduct = useUpdatePointProduct();
  const [deleteTarget, setDeleteTarget] = useState<PointProduct | null>(null);
  const [editTarget, setEditTarget] = useState<PointProduct | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Image management state
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Search state
  const [searchForm, setSearchForm] = useState<PointProductSearchParams>({
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
  });

  const { data, isLoading, error } = useQuery({
    ...fetchPointProductsOptions(searchForm),
    placeholderData: (prev) => prev,
  });
  
  const products = data?.products ?? [];
  const pagination = data?.pagination;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-medium">Мэдээлэл авахад алдаа гарлаа</h3>
        <p className="text-muted-foreground">{error instanceof Error ? error.message : 'Unknown error'}</p>
        <Button onClick={() => window.location.reload()}>Дахин оролдох</Button>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePointProduct.mutateAsync(deleteTarget.id);
      toast.success('Reward item removed successfully');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove reward item');
    }
  };

  const handleOpenForm = (product?: PointProduct) => {
    if (product) {
      setEditTarget(product);
      setImages(product.images || []);
    } else {
      setEditTarget(null);
      setImages([]);
    }
    setIsFormOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadFile(file, '/admin/upload', 'product');
      setImages(prev => [...prev, url]);
      toast.success('Зураг амжилттай ачааллаа');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Зураг ачаалахад алдаа гарлаа');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload: CreatePointProductRequest = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      pointsPrice: parseInt(formData.get('pointsPrice') as string),
      stock: parseInt(formData.get('stock') as string),
      images: images,
    };

    try {
      if (editTarget) {
        await updatePointProduct.mutateAsync({ id: editTarget.id, updates: payload });
        toast.success('Reward item updated successfully');
      } else {
        await createPointProduct.mutateAsync(payload);
        toast.success('Reward item created successfully');
      }
      setIsFormOpen(false);
      setEditTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save reward item');
    }
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl flex items-center gap-2">
            <Coins className="h-8 w-8 text-yellow-500" />
            Лояалти дэлгүүр
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">Manage your loyalty reward products</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Шинэ урамшуулал
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Бүх урамшууллууд</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Хайх..."
                className="pl-8"
                value={searchForm.search}
                onChange={(e) => setSearchForm(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              />
            </div>
          </div>
          <CardDescription>
            {pagination ? `Нийт: ${pagination.total} урамшуулал` : 'Ачаалж байна...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Зураг</TableHead>
                  <TableHead>Нэр</TableHead>
                  <TableHead>Оноо</TableHead>
                  <TableHead>Нөөц</TableHead>
                  <TableHead>Үүсгэсэн</TableHead>
                  <TableHead className="text-right">Үйлдэл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Урамшуулал олдсонгүй.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.firstImage || product.images?.[0] ? (
                          <img src={product.firstImage || product.images?.[0]} alt={product.name} className="w-10 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-10 bg-muted flex items-center justify-center rounded"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 border-yellow-500/20">
                          <Coins className="mr-1 h-3 w-3" />
                          {product.pointsPrice} оноо
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={cn("font-medium", (Number(product.stock) || 0) <= 5 ? "text-red-500" : "text-green-600")}>
                          {product.stock ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenForm(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(product)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>{editTarget ? 'Урамшуулал засах' : 'Шинэ урамшуулал нэмэх'}</DialogTitle>
              <DialogDescription>
                Лояалти дэлгүүрт орох барааны мэдээллийг оруулна уу.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Нэр</Label>
                <Input id="name" name="name" defaultValue={editTarget?.name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Тайлбар</Label>
                <Input id="description" name="description" defaultValue={editTarget?.description ?? ''} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="pointsPrice">Онооны үнэ</Label>
                  <Input id="pointsPrice" name="pointsPrice" type="number" defaultValue={editTarget?.pointsPrice ?? ''} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Нөөц</Label>
                  <Input id="stock" name="stock" type="number" defaultValue={editTarget?.stock ?? ''} required />
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-4">
                <Label>Зургууд</Label>
                <div className="grid grid-cols-4 gap-2">
                  {images.map((url, i) => (
                    <div key={url} className="relative aspect-square rounded-md overflow-hidden border bg-muted">
                      <img src={url} alt="" className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <label className="flex flex-col items-center justify-center aspect-square rounded-md border border-dashed hover:bg-muted/50 cursor-pointer transition-colors relative overflow-hidden">
                      {isUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-muted-foreground" />
                          <span className="text-[10px] mt-1 text-muted-foreground">Нэмэх</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Цуцлах</Button>
              <Button type="submit" disabled={createPointProduct.isPending || updatePointProduct.isPending}>
                {editTarget ? 'Хадгалах' : 'Үүсгэх'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Та итгэлтэй байна уу?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" урамшууллыг бүрмөсөн устгах уу? Энэ үйлдлийг буцаах боломжгүй.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Үгүй</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Устгах
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
