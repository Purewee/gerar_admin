import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import type { Category } from '@/queries/category/type';
import { CreateProductSchema } from '@/queries/product/type';

export type ProductFormValues = z.infer<typeof CreateProductSchema>;

// Helper to format number with commas for input display
const formatPriceInput = (value: number): string => {
  if (!value || value === 0) return '';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Helper to parse formatted price string back to number
const parsePriceInput = (value: string): number => {
  // Remove all non-numeric characters except decimal point
  const numericValue = value.replace(/[^\d.]/g, '');
  const parsed = parseFloat(numericValue);
  return isNaN(parsed) ? 0 : parsed;
};

interface ProductFormProps {
  categories: Category[];
  defaultValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  isLoading?: boolean;
}

// Helper function to get category full path (Parent > Child)
const getCategoryPath = (category: Category, categories: Category[]): string => {
  if (!category.parentId) {
    return category.name;
  }
  
  const parent = categories.find(cat => cat.id === category.parentId);
  if (parent) {
    return `${getCategoryPath(parent, categories)} > ${category.name}`;
  }
  
  return category.name;
};

// Helper function to get all child category IDs recursively
const getChildCategoryIds = (categoryId: number, categories: Category[]): number[] => {
  const children = categories.filter(cat => cat.parentId === categoryId);
  const allIds = [categoryId];
  children.forEach(child => {
    allIds.push(...getChildCategoryIds(child.id, categories));
  });
  return allIds;
};

// Helper function to organize categories by parent-child relationship
type OrganizedCategory = Category & {
  children: Category[];
};

const organizeCategories = (categories: Category[]): OrganizedCategory[] => {
  const topLevel = categories.filter(cat => !cat.parentId);
  const organized = topLevel.map(parent => ({
    ...parent,
    children: categories.filter(cat => cat.parentId === parent.id),
  }));
  return organized;
};

export function ProductForm({
  categories,
  defaultValues,
  onSubmit,
  isLoading = false,
}: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      price: defaultValues?.price || 0,
      stock: defaultValues?.stock || 0,
      categoryId: defaultValues?.categoryId,
      categoryIds: defaultValues?.categoryIds || (defaultValues?.categoryId ? [defaultValues.categoryId] : []),
      images: defaultValues?.images || [],
    },
  });

  const images = form.watch('images') || [];

  const handleFormSubmit = async (values: ProductFormValues) => {
    try {
      // Filter out empty image URLs before submitting
      const cleanedValues: any = {
        name: values.name,
        description: values.description,
        price: values.price,
        stock: values.stock,
      };
      
      // Handle images
      const filteredImages = values.images?.filter(img => img.trim() !== '');
      if (filteredImages && filteredImages.length > 0) {
        cleanedValues.images = filteredImages;
      }
      
      // Handle categories - prioritize categoryIds, ensure it's always a proper array
      if (values.categoryIds && Array.isArray(values.categoryIds) && values.categoryIds.length > 0) {
        // Filter out any invalid values and ensure all are numbers
        const validCategoryIds = values.categoryIds
          .filter((id): id is number => typeof id === 'number' && id > 0);
        
        if (validCategoryIds.length > 0) {
          cleanedValues.categoryIds = validCategoryIds;
        }
      } else if (values.categoryId && typeof values.categoryId === 'number' && values.categoryId > 0) {
        // Fallback to single categoryId for backward compatibility
        cleanedValues.categoryId = values.categoryId;
      }
      
      // Ensure at least one category is provided
      if (!cleanedValues.categoryIds && !cleanedValues.categoryId) {
        throw new Error('At least one category is required');
      }
      
      await onSubmit(cleanedValues);
    } catch (error) {
      // Re-throw with more context if it's a backend error
      if (error instanceof Error && error.message.includes('deleteMany')) {
        throw new Error(
          'Failed to save product categories. This may be a backend issue. Please try again or contact support if the problem persists.'
        );
      }
      throw error;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Барааны нэр *</FormLabel>
              <FormControl>
                <Input placeholder="Laptop" {...field} />
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
              <FormLabel>Барааны дэлгэрэнгүй тайлбар *</FormLabel>
              <FormControl>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="High-performance laptop"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => {
              const isFocusedRef = useRef(false);

              return (
                <FormItem>
                  <FormLabel>Барааны үнэ *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                        ₮
                      </span>
                      <Input
                        type="text"
                        placeholder="1,234.56"
                        className="pl-8"
                        defaultValue={field.value && field.value > 0 ? formatPriceInput(field.value) : ''}
                        onFocus={(e) => {
                          isFocusedRef.current = true;
                          // Remove formatting when focused to allow editing
                          const rawValue = parsePriceInput(e.target.value).toString();
                          if (rawValue !== '0') {
                            e.target.value = rawValue;
                          } else {
                            e.target.value = '';
                          }
                        }}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          
                          // Allow empty input
                          if (inputValue === '') {
                            field.onChange(0);
                            return;
                          }
                          
                          // Remove currency symbol and commas if user types them
                          const cleaned = inputValue.replace(/[₮,]/g, '').trim();
                          // Remove all non-numeric except decimal point
                          const numericValue = cleaned.replace(/[^\d.]/g, '');
                          
                          // Prevent multiple decimal points
                          const parts = numericValue.split('.');
                          let finalValue = parts[0];
                          if (parts.length > 1) {
                            finalValue += '.' + parts.slice(1).join('').slice(0, 2);
                          }
                          
                          // Update input value (raw numeric)
                          if (e.target.value !== finalValue) {
                            e.target.value = finalValue;
                          }
                          
                          // Parse and update form value
                          const parsed = parseFloat(finalValue);
                          if (!isNaN(parsed)) {
                            field.onChange(parsed);
                          } else {
                            field.onChange(0);
                          }
                        }}
                        onBlur={(e) => {
                          isFocusedRef.current = false;
                          // Format on blur
                          const parsed = parsePriceInput(e.target.value);
                          if (parsed > 0) {
                            const formatted = formatPriceInput(parsed);
                            e.target.value = formatted;
                            field.onChange(parsed);
                          } else {
                            e.target.value = '';
                            field.onChange(0);
                          }
                          field.onBlur();
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Барааны үлдэгдэл *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="50"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="categoryIds"
          render={({ field }) => {
            const organizedCategories = organizeCategories(categories);
            const selectedIds = field.value || [];
            
            return (
              <FormItem>
                <FormLabel>Ангилал *</FormLabel>
                <FormControl>
                  <div className="max-h-80 overflow-y-auto rounded-lg border bg-card">
                    {categories.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-sm text-muted-foreground">Ангилал олдсонгүй</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {organizedCategories.map((parentCategory) => {
                          const hasChildren = parentCategory.children.length > 0;
                          const isParentSelected = selectedIds.includes(parentCategory.id);
                          
                          return (
                            <div key={parentCategory.id} className="group">
                              {/* Parent Category */}
                              <div className="flex items-center space-x-3 p-3 hover:bg-accent/50 transition-colors">
                                <Checkbox
                                  id={`category-${parentCategory.id}`}
                                  checked={isParentSelected}
                                  onCheckedChange={(checked) => {
                                    const currentValues = field.value || [];
                                    const allChildIds = getChildCategoryIds(parentCategory.id, categories);
                                    
                                    if (checked) {
                                      // Add parent and all its children
                                      const newIds = [...new Set([...currentValues, ...allChildIds])];
                                      field.onChange(newIds);
                                    } else {
                                      // Remove parent and all its children
                                      field.onChange(currentValues.filter(id => !allChildIds.includes(id)));
                                    }
                                  }}
                                />
                                <Label
                                  htmlFor={`category-${parentCategory.id}`}
                                  className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {parentCategory.name}
                                </Label>
                                {hasChildren && (
                                  <span className="text-xs text-muted-foreground">
                                    ({parentCategory.children.length})
                                  </span>
                                )}
                              </div>
                              
                              {/* Child Categories */}
                              {hasChildren && (
                                <div className="bg-muted/30 divide-y">
                                  {parentCategory.children.map((childCategory) => (
                                    <div 
                                      key={childCategory.id} 
                                      className="flex items-center space-x-3 pl-8 pr-3 py-2.5 hover:bg-accent/30 transition-colors"
                                    >
                                      <Checkbox
                                        id={`category-${childCategory.id}`}
                                        checked={selectedIds.includes(childCategory.id)}
                                        onCheckedChange={(checked) => {
                                          const currentValues = field.value || [];
                                          if (checked) {
                                            field.onChange([...currentValues, childCategory.id]);
                                          } else {
                                            field.onChange(currentValues.filter(id => id !== childCategory.id));
                                          }
                                        }}
                                      />
                                      <Label
                                        htmlFor={`category-${childCategory.id}`}
                                        className="flex-1 cursor-pointer text-sm font-normal leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        <span className="flex items-center gap-1.5">
                                          <span className="text-muted-foreground/60">└─</span>
                                          {childCategory.name}
                                        </span>
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
                {selectedIds.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedIds.length} ангилал сонгогдсон
                  </p>
                )}
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Зургууд</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  {images.map((image, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 flex gap-2">
                        <Input
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          value={image}
                          onChange={(e) => {
                            const newImages = [...images];
                            newImages[index] = e.target.value;
                            field.onChange(newImages);
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const newImages = images.filter((_, i) => i !== index);
                            field.onChange(newImages.length > 0 ? newImages : undefined);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {image && (
                        <div className="relative w-16 h-16 border rounded-md overflow-hidden flex-shrink-0">
                          <img
                            src={image}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      field.onChange([...images, '']);
                    }}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Зураг нэмэх
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
              <p className="text-sm text-muted-foreground">
                Бүтээгдэхүүний зургийн URL хаягуудыг оруулна уу
              </p>
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