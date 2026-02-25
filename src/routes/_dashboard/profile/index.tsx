import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  Shield,
  Calendar,
  Save,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth-context';
import {
  fetchAdminProfileOptions,
  useUpdateAdminProfile,
  useChangeAdminPin,
} from '@/queries/profile/options';
import { toast } from 'sonner';

const TITLE = 'Профайл | Gerar';

const ROLE_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  SUPER_ADMIN: { label: 'Ерөнхий админ', variant: 'destructive' },
  ADMIN: { label: 'Админ', variant: 'default' },
  USER: { label: 'Хэрэглэгч', variant: 'secondary' },
};

export const Route = createFileRoute('/_dashboard/profile/')(
  {
    head: () => ({ meta: [{ title: TITLE }] }),
    component: ProfilePage,
  },
);

function ProfilePage() {
  const { user: authUser } = useAuth();
  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useQuery(fetchAdminProfileOptions());

  // "Effective profile": if we fetched from API use that, otherwise fallback to auth context
  const effectiveProfile = profile ?? authUser;

  if (isLoading) return <ProfileSkeleton />;

  if (isError && !authUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <User className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">Алдаа гарлаа</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error?.message ?? 'Профайлын мэдээллийг татахад алдаа гарлаа'}
        </p>
      </div>
    );
  }

  if (!effectiveProfile) return <ProfileSkeleton />;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">Профайл</h1>
        <p className="text-muted-foreground">
          Хувийн мэдээлэл болон аюулгүй байдлын тохиргоо
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — Profile overview card */}
        <div className="lg:col-span-1">
          <ProfileOverviewCard
            name={effectiveProfile.name}
            phoneNumber={effectiveProfile.phoneNumber}
            email={'email' in effectiveProfile ? (effectiveProfile as { email?: string | null }).email : undefined}
            role={effectiveProfile.role}
            createdAt={effectiveProfile.createdAt}
          />
        </div>

        {/* Right column — Edit forms */}
        <div className="space-y-6 lg:col-span-2">
          <EditProfileForm
            initialName={effectiveProfile.name}
            initialPhone={effectiveProfile.phoneNumber}
            initialEmail={'email' in effectiveProfile ? (effectiveProfile as { email?: string | null }).email ?? '' : ''}
          />
          <ChangePinForm />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────── Profile Overview Card ──────────────────────────────── */

function ProfileOverviewCard({
  name,
  phoneNumber,
  email,
  role,
  createdAt,
}: {
  name: string;
  phoneNumber: string;
  email?: string | null;
  role: string;
  createdAt: string;
}) {
  const getInitials = (n: string) =>
    n
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const roleInfo = ROLE_LABELS[role] ?? { label: role, variant: 'secondary' as const };

  return (
    <Card className="overflow-hidden">
      {/* Decorative gradient header */}
      <div className="relative h-28 bg-gradient-to-br from-violet-600/80 via-indigo-600/70 to-sky-500/60 dark:from-violet-500/40 dark:via-indigo-500/30 dark:to-sky-400/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
      </div>
      <CardContent className="relative -mt-12 px-6 pb-6">
        <Avatar className="size-20 border-4 border-background shadow-lg">
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl font-bold text-white">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>

        <div className="mt-4 space-y-1">
          <h2 className="text-xl font-bold">{name}</h2>
          <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>
        </div>

        <Separator className="my-4" />

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span>{phoneNumber}</span>
          </div>
          {email && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span>{email}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-muted-foreground">
            <Shield className="h-4 w-4 shrink-0" />
            <span>{roleInfo.label}</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>
              Бүртгүүлсэн:{' '}
              {new Date(createdAt).toLocaleDateString('mn-MN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────── Edit Profile Form ──────────────────────────────── */

function EditProfileForm({
  initialName,
  initialPhone,
  initialEmail,
}: {
  initialName: string;
  initialPhone: string;
  initialEmail: string;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [hasChanges, setHasChanges] = useState(false);
  const updateProfile = useUpdateAdminProfile();
  const { login, token } = useAuth();

  useEffect(() => {
    setName(initialName);
    setPhone(initialPhone);
    setEmail(initialEmail);
  }, [initialName, initialPhone, initialEmail]);

  useEffect(() => {
    const changed =
      name !== initialName || phone !== initialPhone || email !== initialEmail;
    setHasChanges(changed);
  }, [name, phone, email, initialName, initialPhone, initialEmail]);

  const handleSave = async () => {
    try {
      const result = await updateProfile.mutateAsync({
        name: name.trim(),
        email: email.trim() || null,
        phoneNumber: phone.trim() || undefined,
      });
      // Update auth context with new data
      if (token) {
        login(
          {
            id: result.id,
            phoneNumber: result.phoneNumber,
            name: result.name,
            role: result.role,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          },
          token,
        );
      }
      toast.success('Профайл амжилттай шинэчлэгдлээ');
      setHasChanges(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Профайл шинэчлэхэд алдаа гарлаа',
      );
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl">Хувийн мэдээлэл</CardTitle>
            <CardDescription className="mt-0.5">
              Нэр, утас, и-мэйл зэрэг мэдээллийг өөрчилнө
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Нэр</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Нэрээ оруулна уу"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-phone">Утасны дугаар</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profile-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="99887766"
              maxLength={8}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-email">И-мэйл хаяг</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateProfile.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {updateProfile.isPending ? 'Хадгалж байна...' : 'Хадгалах'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────── Change PIN Form ──────────────────────────────── */

function ChangePinForm() {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const changePin = useChangeAdminPin();

  const canSubmit =
    currentPin.length === 4 &&
    newPin.length === 4 &&
    confirmPin.length === 4 &&
    newPin === confirmPin;

  const handleSubmit = async () => {
    if (newPin !== confirmPin) {
      toast.error('Шинэ ПИН код таарахгүй байна');
      return;
    }

    try {
      const res = await changePin.mutateAsync({
        currentPin,
        newPin,
        confirmPin,
      });
      toast.success(res.message || 'ПИН код амжилттай солигдлоо');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'ПИН код солиход алдаа гарлаа',
      );
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl">ПИН код солих</CardTitle>
            <CardDescription className="mt-0.5">
              Аюулгүй байдлын үүднээс ПИН кодоо тогтмол солиж байхыг зөвлөж байна
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="current-pin">Одоогийн ПИН</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="current-pin"
              type={showCurrent ? 'text' : 'password'}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              maxLength={4}
              className="pl-10 pr-10 font-mono tracking-[0.4em]"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-pin">Шинэ ПИН</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="new-pin"
              type={showNew ? 'text' : 'password'}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              maxLength={4}
              className="pl-10 pr-10 font-mono tracking-[0.4em]"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-pin">Шинэ ПИН баталгаажуулах</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirm-pin"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              maxLength={4}
              className="pl-10 pr-10 font-mono tracking-[0.4em]"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPin.length > 0 && newPin !== confirmPin && (
            <p className="text-sm text-destructive">ПИН код таарахгүй байна</p>
          )}
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || changePin.isPending}
            variant="default"
            className="gap-2"
          >
            <KeyRound className="h-4 w-4" />
            {changePin.isPending ? 'Солиж байна...' : 'ПИН солих'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────── Loading Skeleton ──────────────────────────────── */

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-40" />
        <Skeleton className="mt-2 h-5 w-72" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <Skeleton className="h-28 w-full" />
            <CardContent className="relative -mt-12 px-6 pb-6">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="mt-4 h-6 w-40" />
              <Skeleton className="mt-2 h-5 w-24" />
              <Separator className="my-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-52" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
