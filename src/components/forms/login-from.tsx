import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
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
      toast.error('Admin access required. Please login with an admin account.');
    }
  }, [search.error]);

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      const response = await login(values);

      // Check if user has admin role
      if (response.data.user.role !== 'ADMIN') {
        toast.error('You do not have admin privileges to access the dashboard.');
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
      toast.error(
        error instanceof Error ? error.message : 'Login failed. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Нэвтэрч орох</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Мэйл хаяг болон пин кодоо оруулна уу
          </p>
        </div>
        <div className="grid gap-6">
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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
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
