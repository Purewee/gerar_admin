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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Category, CreateCategoryRequest } from '@/queries/category/type';
import { CreateCategorySchema } from '@/queries/category/type';

const categoryFormSchema = CreateCategorySchema.extend({
  description: z.string().optional().or(z.literal('')),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  categories: Category[];
  defaultValues?: Partial<CategoryFormValues & { id?: number }>;
  onSubmit: (values: CreateCategoryRequest) => Promise<void>;
  isLoading?: boolean;
}

export function CategoryForm({
  categories,
  defaultValues,
  onSubmit,
  isLoading = false,
}: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      description: defaultValues?.description ?? '',
      parentId: defaultValues?.parentId ?? null,
    },
  });

  // Filter out the current category from parent options (if editing)
  const availableParents = categories.filter(
    (cat) => !defaultValues?.id || cat.id !== defaultValues.id,
  );

  // Filter out categories that would create circular references
  const getParentOptions = () => {
    if (!defaultValues?.id) return availableParents;
    
    // Prevent selecting a category that has the current category as an ancestor
    const excludeIds = new Set<number>([defaultValues.id]);
    const findDescendants = (parentId: number) => {
      availableParents.forEach((cat) => {
        if (cat.parentId === parentId) {
          excludeIds.add(cat.id);
          findDescendants(cat.id);
        }
      });
    };
    findDescendants(defaultValues.id);
    
    return availableParents.filter((cat) => !excludeIds.has(cat.id));
  };

  const handleSubmit = async (values: CategoryFormValues) => {
    // Convert empty description to null to match API expectations
    const submitValues: CreateCategoryRequest = {
      ...values,
      description: values.description?.trim() ? values.description.trim() : null,
    };
    await onSubmit(submitValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ангилалын нэр *</FormLabel>
              <FormControl>
                <Input placeholder="Гал тогооны хэрэгсэл" {...field} />
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
              <FormLabel>Ангилалын тайлбар</FormLabel>
              <FormControl>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Гал тогооны хэрэгслүүд"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Харьяалагдах цэс</FormLabel>
              <Select
                value={field.value?.toString() ?? '__none__'}
                onValueChange={(value) =>
                  field.onChange(value === '__none__' ? null : Number(value))
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent category (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none__">Хоосон (Үндсэн цэс үүсгэх)</SelectItem>
                  {getParentOptions().map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Хадгалж байна...' : 'Хадгалах'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
