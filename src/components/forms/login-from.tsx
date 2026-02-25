import { zodResolver } from '@hookform/resolvers/zod';
import { IconAlertCircle, IconLoader2 } from '@tabler/icons-react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import z from 'zod';
import { Button } from '../ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { login } from '@/queries/auth/query';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

const loginSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\d{8}$/, 'Phone number must be exactly 8 digits'),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
});

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login: setAuth } = useAuth();
  const search = useSearch({ from: '/_public/login/' });

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phoneNumber: '',
      pin: '',
    },
  });

  // Show error message if redirected due to admin requirement
  useEffect(() => {
    if (search.error === 'admin_required') {
      const message = 'Admin access required. Please login with an admin account.';
      setSubmitError(message);
      toast.error(message);
    }
  }, [search.error]);

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    setSubmitError(null);
    try {
      const response = await login(values);

      // Check if user has admin or super admin role
      if (response.data.user.role !== 'ADMIN' && response.data.user.role !== 'SUPER_ADMIN') {
        const message = 'You do not have admin privileges to access the dashboard.';
        setSubmitError(message);
        toast.error(message);
        return;
      }

      setAuth(response.data.user, response.data.token);
      toast.success('Login successful!');

      // Redirect to the original destination or dashboard
      const redirectTo = (search.redirect as string) || '/';
      try {
        // Try to navigate to the redirect URL
        const url = new URL(redirectTo, window.location.origin);
        navigate({ to: url.pathname as '/', replace: true });
      } catch {
        // If redirect URL is invalid, go to dashboard
        navigate({ to: '/', replace: true });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Login failed. Please try again.';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem className="grid gap-3">
                <FormLabel htmlFor="phoneNumber">Мэйл хаяг / Утасны дугаар</FormLabel>
                <FormControl>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="12345678"
                    maxLength={8}
                    disabled={isLoading}
                    {...field}
                    onChange={(e) => {
                      // Only allow digits
                      const value = e.target.value.replace(/\D/g, '');
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pin"
            render={({ field }) => (
              <FormItem className="grid gap-3">
                <FormLabel htmlFor="pin">Пин</FormLabel>
                <FormControl>
                  <Input
                    id="pin"
                    type="password"
                    placeholder="1234"
                    maxLength={4}
                    disabled={isLoading}
                    {...field}
                    onChange={(e) => {
                      // Only allow digits
                      const value = e.target.value.replace(/\D/g, '');
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {submitError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <IconAlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <IconLoader2 className="size-4 animate-spin" />
                Нэвтэрч байна...
              </>
            ) : (
              'Нэвтрэх'
            )}
          </Button>
        </div>
        {/* <div className="text-center text-sm">
          Бүртгэлгүй юу?{' '}
          <Link to="/" className="underline underline-offset-4">
            Бүртгэл үүсгэх
          </Link>
        </div> */}
      </form>
    </Form>
  );
}
