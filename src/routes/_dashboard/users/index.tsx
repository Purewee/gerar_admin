import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Search, Eye, User as UserIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { fetchUsersOptions } from '@/queries/user/options';
import type { UserSearchParams } from '@/queries/user/query';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_dashboard/users/')({
  component: UsersPage,
});

function UsersPage() {
  const navigate = useNavigate();
  
  // Search form state - user inputs (doesn't trigger search)
  const [searchForm, setSearchForm] = useState({
    search: '',
    role: undefined as 'USER' | 'ADMIN' | undefined,
    page: 1,
    limit: 50,
  });

  // Active query params - these trigger the API call
  const [queryParams, setQueryParams] = useState<UserSearchParams>({
    page: 1,
    limit: 50,
  });

  // Function to apply search (copy form state to query params)
  const applySearch = (formState = searchForm) => {
    const params: UserSearchParams = {
      page: formState.page || 1,
      limit: formState.limit || 50,
    };
    
    if (formState.search?.trim()) {
      params.search = formState.search.trim();
    }
    
    if (formState.role) {
      params.role = formState.role;
    }
    
    setQueryParams(params);
  };

  const { data, isLoading } = useQuery(fetchUsersOptions(queryParams));
  const users = data?.users || [];
  const pagination = data?.pagination;

  const handleSearch = () => {
    applySearch();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchForm({
      search: '',
      role: undefined,
      page: 1,
      limit: 50,
    });
    setQueryParams({
      page: 1,
      limit: 50,
    });
  };

  const hasActiveFilters = useMemo(() => {
    return !!(
      queryParams.search?.trim() ||
      queryParams.role
    );
  }, [queryParams]);

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') {
      return <Badge variant="default">Админ</Badge>;
    }
    return <Badge variant="secondary">Хэрэглэгч</Badge>;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('mn-MN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Хэрэглэгчид</h1>
        <p className="text-muted-foreground">Бүх хэрэглэгчдийн мэдээлэл</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Хайлт ба шүүлт</CardTitle>
          <CardDescription>Хэрэглэгчдийг нэр, утас, имэйл эсвэл эрхээр хайх</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Search Input */}
              <div className="space-y-2">
                <label htmlFor="search" className="text-sm font-medium">
                  Хайх
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Нэр, утас, имэйл..."
                    value={searchForm.search}
                    onChange={(e) =>
                      setSearchForm((prev) => ({ ...prev, search: e.target.value }))
                    }
                    onKeyPress={handleKeyPress}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  Эрх
                </label>
                <Select
                  value={searchForm.role || 'all'}
                  onValueChange={(value) =>
                    setSearchForm((prev) => ({
                      ...prev,
                      role: value === 'all' ? undefined : (value as 'USER' | 'ADMIN'),
                    }))
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Бүх эрх" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Бүх эрх</SelectItem>
                    <SelectItem value="USER">Хэрэглэгч</SelectItem>
                    <SelectItem value="ADMIN">Админ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex items-end gap-2">
                <Button onClick={handleSearch} className="flex-1">
                  <Search className="mr-2 h-4 w-4" />
                  Хайх
                </Button>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearSearch}>
                    Цэвэрлэх
                  </Button>
                )}
              </div>
            </div>

            {/* Results Summary */}
            {pagination && (
              <div className="text-sm text-muted-foreground">
                Нийт: {pagination.total} хэрэглэгч (Хуудас: {pagination.page}/{pagination.totalPages})
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Хэрэглэгчийн жагсаалт</CardTitle>
          <CardDescription>
            {pagination ? `${pagination.total} хэрэглэгч олдлоо` : 'Хэрэглэгчдийг хайж байна...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Хэрэглэгч олдсонгүй</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Хайлтын нөхцөлөөр хэрэглэгч олдсонгүй
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearSearch}>
                  Бүх хэрэглэгчийг харуулах
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Нэр</TableHead>
                    <TableHead>Утас</TableHead>
                    <TableHead>Имэйл</TableHead>
                    <TableHead>Эрх</TableHead>
                    <TableHead>Захиалга</TableHead>
                    <TableHead>Хаяг</TableHead>
                    <TableHead>Бүртгэсэн огноо</TableHead>
                    <TableHead className="text-right">Үйлдэл</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-sm">{user.id}</TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.phoneNumber}</TableCell>
                      <TableCell>
                        {user.email ? (
                          <span>{user.email}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {user._count?.orders ?? 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {user._count?.addresses ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate({
                              to: '/users/$id',
                              params: { id: String(user.id) },
                            })
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Дэлгэрэнгүй
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Хуудас {pagination.page} / {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => {
                    const newPage = pagination.page - 1;
                    setSearchForm((prev) => ({ ...prev, page: newPage }));
                    setQueryParams((prev) => ({ ...prev, page: newPage }));
                  }}
                >
                  Өмнөх
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => {
                    const newPage = pagination.page + 1;
                    setSearchForm((prev) => ({ ...prev, page: newPage }));
                    setQueryParams((prev) => ({ ...prev, page: newPage }));
                  }}
                >
                  Дараах
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
