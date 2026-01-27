import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, X, Filter, Image as ImageIcon, Info } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { fetchProductsOptions, useDeleteProduct } from '@/queries/product/options';
import { fetchCategoriesOptions } from '@/queries/category/options';
import { toast } from 'sonner';
import type { Product } from '@/queries/product/type';
import type { ProductSearchParams } from '@/queries/product/query';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const Route = createFileRoute('/_dashboard/products/')({
  component: ProductsPage,
});

function ProductsPage() {
  const navigate = useNavigate();
  const { data: categories = [] } = useQuery(fetchCategoriesOptions());
  const deleteProduct = useDeleteProduct();
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  // Search form state - user inputs (doesn't trigger search)
  const [searchForm, setSearchForm] = useState({
    search: '',
    categoryIds: [] as number[],
    inStock: undefined as boolean | undefined,
    minPrice: '' as string | number,
    maxPrice: '' as string | number,
    minStock: '' as string | number,
    maxStock: '' as string | number,
    createdAfter: '',
    createdBefore: '',
    sortBy: 'createdAt' as 'name' | 'price' | 'stock' | 'createdAt' | 'updatedAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  // Active query params - these trigger the API call
  const [queryParams, setQueryParams] = useState<ProductSearchParams>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Function to apply search (copy form state to query params)
  const applySearch = (formState = searchForm) => {
    const params: ProductSearchParams = {
      sortBy: formState.sortBy || 'createdAt',
      sortOrder: formState.sortOrder || 'desc',
    };
    
    if (formState.search?.trim()) {
      params.search = formState.search.trim();
    }
    
    if (formState.categoryIds && formState.categoryIds.length > 0) {
      params.categoryIds = formState.categoryIds;
    }
    
    if (formState.inStock !== undefined) {
      params.inStock = formState.inStock;
    }
    
    if (formState.minPrice !== '' && formState.minPrice !== undefined) {
      const num = Number(formState.minPrice);
      if (!isNaN(num)) {
        params.minPrice = num;
      }
    }
    
    if (formState.maxPrice !== '' && formState.maxPrice !== undefined) {
      const num = Number(formState.maxPrice);
      if (!isNaN(num)) {
        params.maxPrice = num;
      }
    }
    
    if (formState.minStock !== '' && formState.minStock !== undefined) {
      const num = Number(formState.minStock);
      if (!isNaN(num)) {
        params.minStock = num;
      }
    }
    
    if (formState.maxStock !== '' && formState.maxStock !== undefined) {
      const num = Number(formState.maxStock);
      if (!isNaN(num)) {
        params.maxStock = num;
      }
    }
    
    if (formState.createdAfter?.trim()) {
      params.createdAfter = formState.createdAfter.trim();
    }
    
    if (formState.createdBefore?.trim()) {
      params.createdBefore = formState.createdBefore.trim();
    }
    
    setQueryParams(params);
  };

  const { data: products = [], isLoading } = useQuery(fetchProductsOptions(queryParams));

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteProduct.mutateAsync(deleteTarget.id);
      toast.success('Product deleted successfully');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete product',
      );
    }
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">Дууссан</Badge>;
    }
    if (stock < 10) {
      return <Badge variant="secondary">Дуусаж байгаа</Badge>;
    }
    return <Badge variant="default">Үлдэгдэл</Badge>;
  };

  const handleCategoryToggle = (categoryId: number) => {
    setSearchForm(prev => {
      const currentIds = prev.categoryIds || [];
      const newIds = currentIds.includes(categoryId)
        ? currentIds.filter(id => id !== categoryId)
        : [...currentIds, categoryId];
      return { ...prev, categoryIds: newIds };
    });
  };

  const clearSearch = () => {
    setSearchForm({
      search: '',
      categoryIds: [],
      inStock: undefined,
      minPrice: '',
      maxPrice: '',
      minStock: '',
      maxStock: '',
      createdAfter: '',
      createdBefore: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setQueryParams({
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const hasActiveFilters = useMemo(() => {
    return !!(
      queryParams.search?.trim() ||
      (queryParams.categoryIds && queryParams.categoryIds.length > 0) ||
      queryParams.inStock !== undefined ||
      queryParams.minPrice !== undefined ||
      queryParams.maxPrice !== undefined ||
      queryParams.minStock !== undefined ||
      queryParams.maxStock !== undefined ||
      queryParams.createdAfter?.trim() ||
      queryParams.createdBefore?.trim() ||
      queryParams.sortBy !== 'createdAt' ||
      queryParams.sortOrder !== 'desc'
    );
  }, [queryParams]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Бүтээгдэхүүн</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button onClick={() => navigate({ to: '/products/new' })}>
          <Plus className="mr-2 h-4 w-4" />
          Шинэ Бүтээгдэхүүн
        </Button>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Бараанаас хайх
            </CardTitle>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearSearch}>
                  <X className="mr-2 h-4 w-4" />
                  Цэвэрлэх
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Дэлгэрэнгүй {showAdvancedSearch ? 'Нуух' : 'Харуулах'} 
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Search */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Хайх</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Нэр эсвэл тайлбараар хайх..."
                  value={searchForm.search || ''}
                  onChange={(e) =>
                    setSearchForm(prev => ({ ...prev, search: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applySearch();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={() => applySearch()} type="button">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortBy">Эрэмбэлэх</Label>
              <Select
                value={searchForm.sortBy || 'createdAt'}
                onValueChange={(value: 'name' | 'price' | 'stock' | 'createdAt' | 'updatedAt') => {
                  const updatedForm = { ...searchForm, sortBy: value };
                  setSearchForm(updatedForm);
                  // Sort changes trigger search immediately
                  applySearch(updatedForm);
                }}
              >
                <SelectTrigger id="sortBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Нэр</SelectItem>
                  <SelectItem value="price">Үнэ</SelectItem>
                  <SelectItem value="stock">Үлдэгдэл тоо</SelectItem>
                  <SelectItem value="createdAt">Үүсгэсэн огноо</SelectItem>
                  <SelectItem value="updatedAt">Шинэчилсэн огноо</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Order</Label>
              <Select
                value={searchForm.sortOrder || 'desc'}
                onValueChange={(value: 'asc' | 'desc') => {
                  const updatedForm = { ...searchForm, sortOrder: value };
                  setSearchForm(updatedForm);
                  // Sort changes trigger search immediately
                  applySearch(updatedForm);
                }}
              >
                <SelectTrigger id="sortOrder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Хуучин эхэндээ</SelectItem>
                  <SelectItem value="desc">Шинэ эхэндээ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Search */}
          {showAdvancedSearch && (
            <div className="space-y-4 border-t pt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Categories */}
                <div className="space-y-2">
                  <Label>Ангилал</Label>
                  <div className="max-h-32 space-y-2 overflow-y-auto border rounded-md p-2">
                    {categories.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Ангилал олдсонгүй</p>
                    ) : (
                      categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={searchForm.categoryIds?.includes(category.id) || false}
                            onCheckedChange={() => handleCategoryToggle(category.id)}
                          />
                          <Label
                            htmlFor={`category-${category.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {category.name}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Stock Status */}
                <div className="space-y-2">
                  <Label>Үлдэгдэл төлөв</Label>
                  <Select
                    value={
                      searchForm.inStock === undefined
                        ? 'all'
                        : searchForm.inStock
                        ? 'inStock'
                        : 'outOfStock'
                    }
                    onValueChange={(value) => {
                      const inStock =
                        value === 'all' ? undefined : value === 'inStock';
                      setSearchForm(prev => ({ ...prev, inStock }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Бүгд</SelectItem>
                      <SelectItem value="inStock">Байгаа</SelectItem>
                      <SelectItem value="outOfStock">Дууссан</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <Label>Үнээр шигших</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Багадаа"
                      step="0.01"
                      value={searchForm.minPrice || ''}
                      onChange={(e) =>
                        setSearchForm(prev => ({
                          ...prev,
                          minPrice: e.target.value,
                        }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Ихдээ"
                      step="0.01"
                      value={searchForm.maxPrice || ''}
                      onChange={(e) =>
                        setSearchForm(prev => ({
                          ...prev,
                          maxPrice: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Stock Range */}
                <div className="space-y-2">
                  <Label>Үлдэгдэл тоогоор шигших</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Багадаа"
                      value={searchForm.minStock || ''}
                      onChange={(e) =>
                        setSearchForm(prev => ({
                          ...prev,
                          minStock: e.target.value,
                        }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Ихдээ"
                      value={searchForm.maxStock || ''}
                      onChange={(e) =>
                        setSearchForm(prev => ({
                          ...prev,
                          maxStock: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Created After */}
                <div className="space-y-2">
                  <Label htmlFor="createdAfter">Дараа үүсгэсэн</Label>
                  <Input
                    id="createdAfter"
                    type="date"
                    value={searchForm.createdAfter || ''}
                    onChange={(e) =>
                      setSearchForm(prev => ({ ...prev, createdAfter: e.target.value }))
                    }
                  />
                </div>

                {/* Created Before */}
                <div className="space-y-2">
                  <Label htmlFor="createdBefore">Өмнө үүсгэсэн</Label>
                  <Input
                    id="createdBefore"
                    type="date"
                    value={searchForm.createdBefore || ''}
                    onChange={(e) =>
                      setSearchForm(prev => ({ ...prev, createdBefore: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => applySearch()} type="button">
                  <Search className="mr-2 h-4 w-4" />
                  Хайх
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Бүх бараанууд</CardTitle>
          <CardDescription>
            {products.length} {products.length === 1 ? 'бараа' : 'бараа'} нийт
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Бараа олдсонгүй. Эхлээд бараа нэмээрэй!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Зураг</TableHead>
                  <TableHead>Нэр</TableHead>
                  <TableHead>Тайлбар</TableHead>
                  <TableHead>Ангилал</TableHead>
                  <TableHead>Үнэ</TableHead>
                  <TableHead>Үлдэгдэл тоо</TableHead>
                  <TableHead className="text-right">Үйлдэл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const productImage = product.firstImage || product.images?.[0] || null;
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        {productImage ? (
                          <div className="relative w-16 h-16 border rounded-md overflow-hidden">
                            <img
                              src={productImage}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 border rounded-md flex items-center justify-center bg-muted">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{product.name}</span>
                          {(product.creator || product.updater) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="space-y-1 text-xs">
                                  {product.creator && (
                                    <div>
                                      <div className="font-semibold">Үүсгэсэн:</div>
                                      <div>{product.creator.name}</div>
                                      <div className="text-muted-foreground">{product.creator.phoneNumber}</div>
                                    </div>
                                  )}
                                  {product.updater && (
                                    <div className={product.creator ? 'mt-2 pt-2 border-t' : ''}>
                                      <div className="font-semibold">Шинэчлэсэн:</div>
                                      <div>{product.updater.name}</div>
                                      <div className="text-muted-foreground">{product.updater.phoneNumber}</div>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {product.description}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const categories = product.categories && product.categories.length > 0
                            ? product.categories
                            : product.category
                              ? [product.category]
                              : [];
                          
                          if (categories.length === 0) {
                            return <span className="text-muted-foreground">N/A</span>;
                          }
                          
                          const displayCount = 1; // Show first category
                          const displayCategories = categories.slice(0, displayCount);
                          const remainingCount = categories.length - displayCount;
                          
                          return (
                            <div className="flex items-center gap-1 flex-wrap">
                              {displayCategories.map((cat, idx) => (
                                <span key={cat.id || idx} className="text-sm">
                                  {cat.name}
                                </span>
                              ))}
                              {remainingCount > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="cursor-help text-xs">
                                      +{remainingCount} {remainingCount === 1 ? 'бусад' : 'бусад'}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      <div className="font-semibold text-xs mb-1">Бүх ангилал:</div>
                                      {categories.map((cat, idx) => (
                                        <div key={cat.id || idx} className="text-xs">
                                          {cat.name}
                                        </div>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>{formatPrice(product.price)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{product.stock}</span>
                          {getStockBadge(product.stock)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate({
                                to: '/products/$id/edit',
                                params: { id: String(product.id) },
                              })
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(product)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Бараа устгах</AlertDialogTitle>
            <AlertDialogDescription>
              Энэ барааг устгахдаа итгэлтэй байна уу "<strong>{deleteTarget?.name}</strong>"? Энэ үйлдлийг буцаах боломжгүй.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteProduct.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProduct.isPending ? 'Устгаж байна...' : 'Устгах'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
