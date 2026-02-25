import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, X, Filter, Image as ImageIcon, Info, Eye, EyeOff, RotateCcw, ChevronLeft, ChevronRight, AlertTriangle, PackageX, ArrowUp, ArrowDown, ArrowUpDown, Copy } from 'lucide-react';
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
import { fetchProductsOptions, useDeleteProduct, useHideProduct, useUnhideProduct, useRestoreProduct, useCreateProduct } from '@/queries/product/options';
import { getProduct } from '@/queries/product/query';
import { fetchCategoriesOptions } from '@/queries/category/options';
import { toast } from 'sonner';
import type { Product, CreateProductRequest } from '@/queries/product/type';
import type { ProductSearchParams } from '@/queries/product/query';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const TITLE = 'Бүтээгдэхүүн | Gerar';

export const Route = createFileRoute('/_dashboard/products/')({
  head: () => ({ meta: [{ title: TITLE }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const navigate = useNavigate();
  const { data: categories = [] } = useQuery(fetchCategoriesOptions());
  const deleteProduct = useDeleteProduct();
  const createProduct = useCreateProduct();
  const hideProduct = useHideProduct();
  const unhideProduct = useUnhideProduct();
  const restoreProduct = useRestoreProduct();
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
    includeHidden: true as boolean,
    includeDeleted: false as boolean,
    page: 1,
    limit: 20,
  });

  // Active query params - these trigger the API call
  const [queryParams, setQueryParams] = useState<ProductSearchParams>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    includeHidden: true,
    includeDeleted: false,
    page: 1,
    limit: 20,
  });

  // Function to apply search (copy form state to query params, reset to page 1)
  const applySearch = (formState = searchForm) => {
    const params: ProductSearchParams = {
      sortBy: formState.sortBy || 'createdAt',
      sortOrder: formState.sortOrder || 'desc',
      page: 1,
      limit: formState.limit ?? 20,
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

    if (formState.includeHidden !== undefined) {
      params.includeHidden = formState.includeHidden;
    }

    if (formState.includeDeleted !== undefined) {
      params.includeDeleted = formState.includeDeleted;
    }

    setSearchForm((prev) => ({ ...prev, page: 1 }));
    setQueryParams(params);
  };

  const { data, isLoading, isFetching } = useQuery({
    ...fetchProductsOptions(queryParams),
    placeholderData: (prev) => prev,
  });
  const products = data?.products ?? [];
  const pagination = data?.pagination;

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

  const handleHide = async (product: Product) => {
    try {
      await hideProduct.mutateAsync(product.id);
      toast.success('Product hidden successfully');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to hide product',
      );
    }
  };

  const handleUnhide = async (product: Product) => {
    try {
      await unhideProduct.mutateAsync(product.id);
      toast.success('Product unhidden successfully');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to unhide product',
      );
    }
  };

  const handleRestore = async (product: Product) => {
    try {
      await restoreProduct.mutateAsync(product.id);
      toast.success('Product restored successfully');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to restore product',
      );
    }
  };

  const handleDuplicate = async (product: Product) => {
    try {
      const fullProduct = await getProduct(product.id);
      const categories = fullProduct.categories?.length
        ? fullProduct.categories
        : fullProduct.category
          ? [fullProduct.category]
          : [];
      const categoryIds = categories.map((c) => c.id).filter(Boolean);
      if (categoryIds.length === 0 && fullProduct.categoryId) {
        categoryIds.push(fullProduct.categoryId);
      }
      if (categoryIds.length === 0) {
        toast.error('Барааны ангилал олдсонгүй. Хуулбарлах боломжгүй.');
        return;
      }
      const payload: CreateProductRequest = {
        name: `${fullProduct.name} (хуулбар)`,
        description: (fullProduct.description || '').trim() || 'Тайлбаргүй',
        price: parseFloat(fullProduct.price) || 0,
        originalPrice: fullProduct.originalPrice ? parseFloat(fullProduct.originalPrice) : null,
        stock: fullProduct.stock ?? 0,
        categoryIds,
        images: fullProduct.images?.length ? fullProduct.images : undefined,
        classificationCode: fullProduct.classificationCode ?? undefined,
        vatAmount: fullProduct.vatAmount != null ? Number(fullProduct.vatAmount) : undefined,
        featureIds: (fullProduct as { features?: { id: number }[] }).features?.map((f) => f.id),
        featureOrders: (fullProduct as { featureOrders?: Record<string, number> }).featureOrders,
      };
      await createProduct.mutateAsync(payload);
      toast.success('Бараа амжилттай хуулбарлагдлаа');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Барааг хуулбарлахад алдаа гарлаа',
      );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('mn-MN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
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
      includeHidden: true,
      includeDeleted: false,
      page: 1,
      limit: 20,
    });
    setQueryParams({
      sortBy: 'createdAt',
      sortOrder: 'desc',
      includeHidden: true,
      includeDeleted: false,
      page: 1,
      limit: 20,
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchForm((prev) => ({ ...prev, page: newPage }));
    setQueryParams((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setSearchForm((prev) => ({ ...prev, limit: newLimit, page: 1 }));
    setQueryParams((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  type SortColumn = 'name' | 'price' | 'stock' | 'createdAt' | 'updatedAt';
  const handleSort = (column: SortColumn) => {
    const newOrder: 'asc' | 'desc' =
      queryParams.sortBy === column
        ? (queryParams.sortOrder === 'desc' ? 'asc' : 'desc')
        : 'desc';
    const nextForm = { ...searchForm, page: 1, sortBy: column, sortOrder: newOrder };
    const nextParams = { ...queryParams, page: 1, sortBy: column, sortOrder: newOrder };
    setSearchForm(nextForm);
    setQueryParams(nextParams);
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
      queryParams.sortOrder !== 'desc' ||
      queryParams.includeHidden !== true ||
      queryParams.includeDeleted !== false
    );
  }, [queryParams]);

  // Full-page skeleton only on initial load when we have no data
  if (isLoading && !data) {
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Бүтээгдэхүүн</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Manage your product catalog</p>
        </div>
        <Button onClick={() => navigate({ to: '/products/new' })} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Шинэ Бүтээгдэхүүн
        </Button>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Search className="h-5 w-5 shrink-0" />
              Бараанаас хайх
            </CardTitle>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearSearch}>
                  <X className="mr-2 h-4 w-4" />
                  <span className="hidden xs:inline">Цэвэрлэх</span>
                  <span className="xs:hidden">X</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              >
                <Filter className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Дэлгэрэнгүй {showAdvancedSearch ? 'Нуух' : 'Харуулах'}</span>
                <span className="sm:hidden">{showAdvancedSearch ? 'Нуух' : 'Шүүлт'}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Search */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
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
                  <SelectItem value="stock">Нөөц</SelectItem>
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
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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

                {/* Include Hidden Products */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeHidden"
                      checked={searchForm.includeHidden ?? true}
                      onCheckedChange={(checked) =>
                        setSearchForm(prev => ({ ...prev, includeHidden: checked === true }))
                      }
                    />
                    <Label
                      htmlFor="includeHidden"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Нуусан бараа харуулах
                    </Label>
                  </div>
                </div>

                {/* Include Deleted Products */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeDeleted"
                      checked={searchForm.includeDeleted ?? false}
                      onCheckedChange={(checked) =>
                        setSearchForm(prev => ({ ...prev, includeDeleted: checked === true }))
                      }
                    />
                    <Label
                      htmlFor="includeDeleted"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Устгасан бараа харуулах
                    </Label>
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
                  <Label>Нөөцөөр шигших</Label>
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
            {pagination
              ? `Нийт: ${pagination.total} бараа (Хуудас: ${pagination.page}/${pagination.totalPages})`
              : 'Бараануудыг ачаалж байна...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Бараа олдсонгүй. Эхлээд бараа нэмээрэй!
            </div>
          ) : (
            <div className="relative">
              {isFetching && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-[1px]" aria-hidden>
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}

              {/* ===== MOBILE CARD VIEW (< md) ===== */}
              <div className="md:hidden divide-y">
                {products.map((product) => {
                  const productImage = product.firstImage || product.images?.[0] || null;
                  const productCategories = product.categories && product.categories.length > 0
                    ? product.categories
                    : product.category
                      ? [product.category]
                      : [];
                  return (
                    <div
                      key={product.id}
                      className="flex gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      {/* Image */}
                      <div className="shrink-0">
                        {productImage ? (
                          <div className="relative w-14 h-14 border rounded-md overflow-hidden">
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
                          <div className="w-14 h-14 border rounded-md flex items-center justify-center bg-muted">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Name + badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium text-sm leading-tight break-words">{product.name}</span>
                          {product.deletedAt && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              Устгасан
                            </Badge>
                          )}
                          {product.isHidden && !product.deletedAt && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              <EyeOff className="mr-0.5 h-2.5 w-2.5" />
                              Нуусан
                            </Badge>
                          )}
                        </div>

                        {/* Category */}
                        {productCategories.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {productCategories.map(c => c.name).join(', ')}
                          </p>
                        )}

                        {/* Price + Stock row */}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
                          {product.stock === 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive ring-1 ring-destructive/30">
                              <PackageX className="h-3 w-3 shrink-0" />
                              0
                            </span>
                          ) : product.stock < 10 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              {product.stock}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2 py-0.5 text-xs tabular-nums">
                              Нөөц: {product.stock}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 mt-2 -ml-2">
                          {product.deletedAt ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRestore(product)}
                              disabled={restoreProduct.isPending}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
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
                                className="h-8 w-8 p-0"
                                onClick={() => handleDuplicate(product)}
                                disabled={createProduct.isPending}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              {product.isHidden ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleUnhide(product)}
                                  disabled={unhideProduct.isPending}
                                >
                                  <EyeOff className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleHide(product)}
                                  disabled={hideProduct.isPending}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setDeleteTarget(product)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ===== DESKTOP TABLE VIEW (md+) ===== */}
              <div className="hidden md:block">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Зураг</TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => handleSort('name')}
                      className="inline-flex items-center gap-1.5 font-medium rounded px-2 py-1 -ml-1 cursor-pointer hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    >
                      Нэр
                      {queryParams.sortBy === 'name' ? (
                        queryParams.sortOrder === 'desc' ? (
                          <ArrowDown className="h-4 w-4 shrink-0" />
                        ) : (
                          <ArrowUp className="h-4 w-4 shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>Ангилал</TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => handleSort('price')}
                      className="inline-flex items-center gap-1.5 font-medium rounded px-2 py-1 -ml-1 cursor-pointer hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    >
                      Үнэ
                      {queryParams.sortBy === 'price' ? (
                        queryParams.sortOrder === 'desc' ? (
                          <ArrowDown className="h-4 w-4 shrink-0" />
                        ) : (
                          <ArrowUp className="h-4 w-4 shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-center">
                    <button
                      type="button"
                      onClick={() => handleSort('stock')}
                      className="inline-flex items-center gap-1.5 font-medium rounded px-2 py-1 cursor-pointer hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    >
                      Нөөц
                      {queryParams.sortBy === 'stock' ? (
                        queryParams.sortOrder === 'desc' ? (
                          <ArrowDown className="h-4 w-4 shrink-0" />
                        ) : (
                          <ArrowUp className="h-4 w-4 shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                      )}
                    </button>
                  </TableHead>
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
                          {product.deletedAt && (
                            <Badge variant="destructive" className="text-xs">
                              Устгасан
                            </Badge>
                          )}
                          {product.isHidden && !product.deletedAt && (
                            <Badge variant="secondary" className="text-xs">
                              <EyeOff className="mr-1 h-3 w-3" />
                              Нуусан
                            </Badge>
                          )}
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
                                      <div className="text-muted-foreground">{formatDate(product.createdAt)}</div>
                                    </div>
                                  )}
                                  {product.updater && (
                                    <div className={product.creator ? 'mt-2 pt-2 border-t' : ''}>
                                      <div className="font-semibold">Шинэчлэсэн:</div>
                                      <div>{product.updater.name}</div>
                                      <div className="text-muted-foreground">{formatDate(product.updatedAt)}</div>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
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
                          
                          const displayCount = 1;
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
                      <TableCell className="text-center">
                        {product.stock === 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-2.5 py-0.5 text-sm font-medium text-destructive ring-1 ring-destructive/30">
                            <PackageX className="h-3.5 w-3.5 shrink-0" />
                            <span>0</span>
                          </span>
                        ) : product.stock < 10 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-sm font-medium text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span>{product.stock}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-2.5 py-0.5 text-sm tabular-nums">
                            {product.stock}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {product.deletedAt ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRestore(product)}
                              disabled={restoreProduct.isPending}
                              title="Restore product"
                              className="text-green-600 hover:text-green-700"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          ) : (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
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
                                </TooltipTrigger>
                                <TooltipContent>Засах</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDuplicate(product)}
                                    disabled={createProduct.isPending}
                                    title="Хуулбарлах"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Хуулбарлах</TooltipContent>
                              </Tooltip>
                              {product.isHidden ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUnhide(product)}
                                  disabled={unhideProduct.isPending}
                                  title="Unhide product"
                                >
                                  <EyeOff className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleHide(product)}
                                  disabled={hideProduct.isPending}
                                  title="Hide product"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(product)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              </Table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Хуудас {pagination.page} / {pagination.totalPages} (нийт {pagination.total} бараа)
                </p>
                <div className="flex items-center gap-1.5">
                  <Select
                    value={String(pagination.limit)}
                    onValueChange={(v) => handleLimitChange(Number(v))}
                  >
                    <SelectTrigger className="w-16 sm:w-20 h-8 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground text-xs sm:text-sm">/ хуудас</span>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Өмнөх
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Дараах
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Бараа устгах</AlertDialogTitle>
            <AlertDialogDescription>
              Энэ барааг устгахдаа итгэлтэй байна уу "<strong>{deleteTarget?.name}</strong>"? 
              <br />
              <br />
              Бараа нь soft delete хийгдэж, захиалгын түүхэд хадгалагдана. Дараа нь сэргээх боломжтой.
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
