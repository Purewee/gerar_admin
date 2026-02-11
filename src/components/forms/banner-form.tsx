import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRef, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { uploadFile, type UploadImageType } from '@/lib/file-upload';
import { toast } from 'sonner';
import type { CreateBannerRequest } from '@/queries/banner/type';
import { CreateBannerSchema } from '@/queries/banner/type';
import { Loader2, Upload, ImageIcon } from 'lucide-react';

const bannerFormSchema = CreateBannerSchema.extend({
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  linkUrl: z.string().optional().nullable(),
});

export type BannerFormValues = z.infer<typeof bannerFormSchema>;

interface BannerFormProps {
  defaultValues?: Partial<BannerFormValues>;
  onSubmit: (values: CreateBannerRequest) => Promise<void>;
  isLoading?: boolean;
}

function ImageUploadField({
  value,
  onChange,
  label,
  imageType,
  disabled,
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
  imageType: UploadImageType;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, '/admin/upload', imageType);
      onChange(url);
      toast.success('Зураг амжилттай ачааллаа');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Зураг ачаалахад алдаа гарлаа');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <FormLabel>{label}</FormLabel>
      <div className="flex gap-2 items-start">
        <div className="flex-1 min-w-0">
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="URL эсвэл доорх товчоор ачаална уу"
            className="font-mono text-sm"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || disabled}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {value && (
        <div className="relative rounded-lg border overflow-hidden bg-muted h-24">
          <img
            src={value}
            alt={label}
            className="object-contain w-full h-full"
            onError={() => {}}
          />
        </div>
      )}
      {!value && (
        <div className="rounded-lg border border-dashed bg-muted/50 h-24 flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export function BannerForm({
  defaultValues,
  onSubmit,
  isLoading = false,
}: BannerFormProps) {
  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      imageDesktop: defaultValues?.imageDesktop ?? '',
      imageMobile: defaultValues?.imageMobile ?? '',
      linkUrl: defaultValues?.linkUrl ?? '',
      order: defaultValues?.order ?? 0,
      isActive: defaultValues?.isActive ?? true,
      startDate: defaultValues?.startDate ?? null,
      endDate: defaultValues?.endDate ?? null,
    },
  });

  const handleSubmit = async (values: BannerFormValues) => {
    const payload: CreateBannerRequest = {
      title: values.title?.trim() || null,
      description: values.description?.trim() || null,
      imageDesktop: values.imageDesktop,
      imageMobile: values.imageMobile,
      linkUrl: values.linkUrl?.trim() || null,
      order: Number(values.order) || 0,
      isActive: values.isActive ?? true,
      startDate: values.startDate?.trim() || null,
      endDate: values.endDate?.trim() || null,
    };
    await onSubmit(payload);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Гарчиг</FormLabel>
              <FormControl>
                <Input placeholder="Жишээ: Зуны хямдрал" {...field} value={field.value ?? ''} />
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
                <Input placeholder="Жишээ: 50% хүртэл хөнгөлөлт" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageDesktop"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ImageUploadField
                  label="Зураг (Desktop) *"
                  value={field.value}
                  onChange={field.onChange}
                  imageType="banner-desktop"
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageMobile"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ImageUploadField
                  label="Зураг (Mobile) *"
                  value={field.value}
                  onChange={field.onChange}
                  imageType="banner-mobile"
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="linkUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Холбоос (URL)</FormLabel>
              <FormControl>
                <Input placeholder="/categories/1 эсвэл https://..." {...field} value={field.value ?? ''} />
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
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Идэвхтэй</FormLabel>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Эхлэх огноо (ISO, заавал биш)</FormLabel>
              <FormControl>
                <Input placeholder="2024-01-01" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Дуусах огноо (ISO, заавал биш)</FormLabel>
              <FormControl>
                <Input placeholder="2024-12-31" {...field} value={field.value ?? ''} />
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
