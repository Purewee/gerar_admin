import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { CreateFeatureRequest } from '@/queries/feature/type';
import { CreateFeatureSchema } from '@/queries/feature/type';

const featureFormSchema = CreateFeatureSchema.extend({
  description: z.string().optional().nullable(),
});

export type FeatureFormValues = z.infer<typeof featureFormSchema>;

interface FeatureFormProps {
  defaultValues?: Partial<FeatureFormValues>;
  onSubmit: (values: CreateFeatureRequest) => Promise<void>;
  isLoading?: boolean;
}

export function FeatureForm({
  defaultValues,
  onSubmit,
  isLoading = false,
}: FeatureFormProps) {
  const form = useForm<FeatureFormValues>({
    resolver: zodResolver(featureFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      order: defaultValues?.order ?? 0,
    },
  });

  const handleSubmit = async (values: FeatureFormValues) => {
    const payload: CreateFeatureRequest = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
      order: Number(values.order) || 0,
    };
    await onSubmit(payload);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Нэр *</FormLabel>
              <FormControl>
                <Input placeholder="Жишээ: Хамгийн их борлуулалттай" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тайлбар</FormLabel>
              <FormControl>
                <Input placeholder="Онцлохын товч тайлбар" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Дараалал (бага тоо эхэнд)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  {...field}
                  value={field.value ?? 0}
                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Хадгалж байна...' : 'Хадгалах'}
        </Button>
      </form>
    </Form>
  );
}
