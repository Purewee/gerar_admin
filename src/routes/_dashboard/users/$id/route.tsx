import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { fetchUserOptions } from '@/queries/user/options';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, MapPin, ShoppingCart, Package, Heart } from 'lucide-react';

export const Route = createFileRoute('/_dashboard/users/$id')({
  component: UserDetailPage,
  loader: ({ params }) => {
    return { userId: Number(params.id) };
  },
});

function UserDetailPage() {
  const { userId } = Route.useLoaderData();
  const navigate = useNavigate();
  const { data: user, isLoading } = useQuery(fetchUserOptions(userId));

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('mn-MN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: 'Хүлээгдэж байна', variant: 'secondary' },
      COMPLETED: { label: 'Дууссан', variant: 'default' },
      CANCELLED: { label: 'Цуцлагдсан', variant: 'destructive' },
      PROCESSING: { label: 'Боловсруулж байна', variant: 'outline' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' as const };
    
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') {
      return <Badge variant="default">Админ</Badge>;
    }
    return <Badge variant="secondary">Хэрэглэгч</Badge>;
  };

  const formatAddress = (address: any) => {
    const parts = [
      address.provinceOrDistrict,
      address.khorooOrSoum,
      address.neighborhood,
      address.street,
      address.residentialComplex,
      address.building && `Барилга ${address.building}`,
      address.entrance && `Орц ${address.entrance}`,
      address.apartmentNumber && `Апартамент ${address.apartmentNumber}`,
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-muted-foreground mb-4">Хэрэглэгч олдсонгүй</div>
        <Button variant="outline" onClick={() => navigate({ to: '/users' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Буцах
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/users' })}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Буцах
            </Button>
          </div>
          <h1 className="text-3xl font-bold mt-2">{user.name}</h1>
          <p className="text-muted-foreground">Хэрэглэгчийн дэлгэрэнгүй мэдээлэл</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Захиалга</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count?.orders ?? 0}</div>
            <p className="text-xs text-muted-foreground">Нийт захиалга</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Хаяг</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count?.addresses ?? 0}</div>
            <p className="text-xs text-muted-foreground">Бүртгэсэн хаяг</p>
          </CardContent>
        </Card>

        {user._count?.favorites !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Дуртай</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user._count.favorites}</div>
              <p className="text-xs text-muted-foreground">Дуртай бараа</p>
            </CardContent>
          </Card>
        )}

        {user._count?.cartItems !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Сагс</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user._count.cartItems}</div>
              <p className="text-xs text-muted-foreground">Сагсанд байгаа</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Хэрэглэгчийн мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Нэр:</span>
              <p className="text-lg font-medium">{user.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Утас:</span>
              <p className="text-lg">{user.phoneNumber}</p>
            </div>
            {user.email && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Имэйл:</span>
                <p className="text-lg">{user.email}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-muted-foreground">Эрх:</span>
              <div className="mt-1">{getRoleBadge(user.role)}</div>
            </div>
            <Separator />
            <div>
              <span className="text-sm font-medium text-muted-foreground">Бүртгэсэн огноо:</span>
              <p className="text-sm">{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Сүүлд шинэчлэгдсэн:</span>
              <p className="text-sm">{formatDate(user.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Статистик</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Нийт захиалга:</span>
              <span className="font-medium">{user._count?.orders ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Хаягийн тоо:</span>
              <span className="font-medium">{user._count?.addresses ?? 0}</span>
            </div>
            {user._count?.favorites !== undefined && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Дуртай бараа:</span>
                <span className="font-medium">{user._count.favorites}</span>
              </div>
            )}
            {user._count?.cartItems !== undefined && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Сагсанд байгаа:</span>
                <span className="font-medium">{user._count.cartItems}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Addresses */}
      {user.addresses && user.addresses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Хаягууд</CardTitle>
            <CardDescription>{user.addresses.length} хаяг бүртгэгдсэн</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.addresses.map((address) => (
                <div
                  key={address.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {address.label || 'Хаяг'}
                      </span>
                      {address.isDefault && (
                        <Badge variant="outline" className="text-xs">
                          Үндсэн
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{address.fullName}</p>
                    <p>{address.phoneNumber}</p>
                    <p>{formatAddress(address)}</p>
                    {address.addressNote && (
                      <p className="italic mt-2">Тэмдэглэл: {address.addressNote}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders */}
      {user.orders && user.orders.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Захиалгууд</CardTitle>
            <CardDescription>{user.orders.length} захиалга олдлоо</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {user.orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">Захиалга #{order.id}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(order.status)}
                      <p className="text-lg font-semibold mt-2">
                        {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {order.deliveryTimeSlot && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Хүргэлтийн цаг:</span>{' '}
                      {order.deliveryTimeSlot}
                    </div>
                  )}

                  {order.address && (
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">Хаяг:</span>
                      <p className="mt-1">{formatAddress(order.address)}</p>
                    </div>
                  )}

                  {order.items && order.items.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Захиалгын бараанууд:</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Бараа</TableHead>
                              <TableHead>Ангилал</TableHead>
                              <TableHead>Тоо ширхэг</TableHead>
                              <TableHead>Үнэ</TableHead>
                              <TableHead className="text-right">Дүн</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {order.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                  {item.product?.name || 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {item.product?.categories
                                    ? item.product.categories.map((c: any) => c.name).join(', ')
                                    : 'N/A'}
                                </TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{formatPrice(item.price)}</TableCell>
                                <TableCell className="text-right">
                                  {formatPrice(parseFloat(item.price) * item.quantity)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          onClick={() => navigate({ to: `/orders/${order.id}` })}
                        >
                          Дэлгэрэнгүй харах
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Захиалгууд</CardTitle>
            <CardDescription>Захиалга байхгүй</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              Энэ хэрэглэгч одоогоор захиалга хийгээгүй байна.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
