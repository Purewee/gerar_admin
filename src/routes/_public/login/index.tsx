import { IconDiamond, IconShieldLock } from '@tabler/icons-react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod';
import { LoginForm } from '@/components/forms/login-from';

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
  error: z.string().optional(),
});

const TITLE = 'Нэвтрэх | Gerar';

export const Route = createFileRoute('/_public/login/')({
  validateSearch: loginSearchSchema,
  head: () => ({ meta: [{ title: TITLE }] }),
  component: LoginPage,
});

export function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10 lg:p-12">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link
            to="/"
            className="group flex items-center gap-2 font-medium transition-opacity hover:opacity-80"
          >
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md shadow-sm transition-transform group-hover:scale-105">
              <IconDiamond className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">GERAR</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-4">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                <IconShieldLock className="size-3.5" />
                Admin dashboard
              </div>
            </div>

            <div className="w-full rounded-xl border bg-background p-6 shadow-sm dark:shadow-black/30">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Админ нэвтрэх</h1>
                <p className="mt-2 text-sm text-muted-foreground">Gerar удирдлагын самбар</p>
              </div>
              <LoginForm />
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Unauthorized access is prohibited.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative hidden items-center justify-center bg-gradient-to-br from-muted to-background p-12 dark:from-zinc-900 dark:to-black lg:flex">
        <div className="text-center">
          <img
            src="/logo.svg"
            alt="Gerar"
            className="mx-auto mb-6 w-64 opacity-90 dark:opacity-95"
          />
          <p className="text-sm text-muted-foreground">Internal administration system</p>
        </div>
      </div>
    </div>
  );
}