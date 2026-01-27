import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, Upload, Loader2 } from 'lucide-react';
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
import { uploadFiles, uploadFile, deleteImage } from '@/lib/file-upload';
import { toast } from 'sonner';
import { ImageCropDialog } from '@/components/image-crop-dialog';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isProcessingFilesRef = useRef(false); // Guard to prevent double uploads
  const processingFilesSetRef = useRef<Set<string>>(new Set()); // Track files currently being processed by name+size
  const activeUploadRef = useRef<Promise<void> | null>(null); // Track active upload promise
  const [uploadingFiles, setUploadingFiles] = useState<Set<number>>(new Set());
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // Track images uploaded in this session (to delete from server if removed)
  const [uploadedImageUrls, setUploadedImageUrls] = useState<Set<string>>(new Set());
  
  // Crop dialog state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<{ file: File; index: number; url: string } | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  // Get initial images from defaultValues (existing product images)
  const initialImages = defaultValues?.images || [];

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      price: defaultValues?.price || 0,
      originalPrice: defaultValues?.originalPrice ?? null,
      stock: defaultValues?.stock || 0,
      categoryId: defaultValues?.categoryId,
      categoryIds: defaultValues?.categoryIds || (defaultValues?.categoryId ? [defaultValues.categoryId] : []),
      images: defaultValues?.images || [],
    },
  });

  const images = form.watch('images') || [];

  // Cleanup blob URLs on component unmount only
  useEffect(() => {
    return () => {
      // Revoke blob URL from crop dialog if it exists
      if (imageToCrop?.url) {
        URL.revokeObjectURL(imageToCrop.url);
      }
    };
  }, [imageToCrop]);

  // Helper function to check if image is square (1:1 aspect ratio)
  const checkImageAspectRatio = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        // Consider it square if aspect ratio is between 0.95 and 1.05 (5% tolerance)
        const isSquare = aspectRatio >= 0.95 && aspectRatio <= 1.05;
        URL.revokeObjectURL(url);
        resolve(isSquare);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(true); // If we can't load it, assume it's square and let it upload normally
      };
      img.src = url;
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // CRITICAL: Prevent processing if already in progress - check FIRST
    if (isProcessingFilesRef.current || activeUploadRef.current) {
      event.target.value = '';
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.disabled = true; // Disable input
        // Re-enable after a short delay
        setTimeout(() => {
          if (fileInputRef.current) {
            fileInputRef.current.disabled = false;
          }
        }, 100);
      }
      return;
    }

    const files = event.target.files;
    if (!files || files.length === 0) {
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Store files immediately before any async operations
    const fileArray = Array.from(files);
    
    // Set flag IMMEDIATELY (synchronously) to prevent concurrent calls
    // The processingFilesSet will be managed in uploadFilesDirectly
    isProcessingFilesRef.current = true;
    
    // Disable file input to prevent multiple triggers
    if (fileInputRef.current) {
      fileInputRef.current.disabled = true;
    }
    
    // Reset file input immediately to prevent onChange from firing again
    // CRITICAL: Do this BEFORE any async operations
    const inputElement = event.target;
    inputElement.value = '';
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Process files asynchronously - don't await, let it run in background
    // This prevents the function from blocking and allows the guard to work
    (async () => {
      try {
        const currentImages = form.getValues('images') || [];
        const startIndex = currentImages.length;

        // Check each file to see if it needs cropping
        const filesToProcess: Array<{ file: File; needsCrop: boolean; index: number }> = [];
        
        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          const isSquare = await checkImageAspectRatio(file);
          filesToProcess.push({ file, needsCrop: !isSquare, index: startIndex + i });
        }

        // Separate files that need cropping from those that don't
        const filesNeedingCrop = filesToProcess.filter(f => f.needsCrop);
        const filesReadyToUpload = filesToProcess.filter(f => !f.needsCrop).map(f => f.file);

        // If there are files that need cropping, show crop dialog for the first one
        if (filesNeedingCrop.length > 0) {
          const firstFileToCrop = filesNeedingCrop[0];
          const url = URL.createObjectURL(firstFileToCrop.file);
          setImageToCrop({
            file: firstFileToCrop.file,
            index: firstFileToCrop.index,
            url,
          });
          // Store remaining files for later processing
          setPendingFiles([
            ...filesNeedingCrop.slice(1).map(f => f.file),
            ...filesReadyToUpload,
          ]);
          setCropDialogOpen(true);
        } else {
          // All files are square, upload them directly
          // uploadFilesDirectly will add to processingFilesSet and handle the guard
          await uploadFilesDirectly(filesReadyToUpload, startIndex, currentImages, true);
        }
      } catch (error) {
        // Handle any unexpected errors
        console.error('Error processing files:', error);
        isProcessingFilesRef.current = false;
        activeUploadRef.current = null;
        // Don't delete from processingFilesSet here - it wasn't added yet
        // Re-enable file input on error
        if (fileInputRef.current) {
          fileInputRef.current.disabled = false;
        }
        toast.error('Файл боловсруулахад алдаа гарлаа');
      }
    })(); // Execute async function immediately, don't await
    // Note: File input is already reset above, and processing flag is reset in uploadFilesDirectly or handleCropComplete
  };

  const uploadFilesDirectly = async (
    files: File[],
    startIndex: number,
    currentImages: string[],
    resetProcessingFlag = false
  ) => {
    if (files.length === 0) {
      if (resetProcessingFlag) {
        isProcessingFilesRef.current = false;
        // Clear processing files set
        processingFilesSetRef.current.clear();
      }
      return;
    }

    // Create unique identifier for this upload batch
    const fileIdentifiers = files.map(f => `${f.name}-${f.size}-${f.lastModified}`).join('|');
    
    // AGGRESSIVE GUARD: Check if these exact files are already being uploaded
    // This check happens in uploadFilesDirectly, but we also check here as a double guard
    if (processingFilesSetRef.current.has(fileIdentifiers)) {
      if (resetProcessingFlag) {
        isProcessingFilesRef.current = false;
        activeUploadRef.current = null;
      }
      return;
    }
    
    // AGGRESSIVE GUARD: Check if upload is already in progress
    if (activeUploadRef.current) {
      try {
        await activeUploadRef.current;
      } catch (e) {
        // Ignore errors from previous upload
      }
      // Check again after waiting - if files are now processed, skip
      if (processingFilesSetRef.current.has(fileIdentifiers)) {
        if (resetProcessingFlag) {
          isProcessingFilesRef.current = false;
          activeUploadRef.current = null;
        }
        return;
      }
    }

    // Mark files as being uploaded IMMEDIATELY
    processingFilesSetRef.current.add(fileIdentifiers);
    
    // Wrap upload in a promise and store it
    const uploadPromise = (async () => {
      // Create temporary placeholders for the files being uploaded
      const tempUrls = files.map((_, index) => `uploading-${startIndex + index}`);
      form.setValue('images', [...currentImages, ...tempUrls]);

      // Track which indices are being uploaded
      const uploadingIndices = new Set<number>();
      files.forEach((_, index) => {
        uploadingIndices.add(startIndex + index);
      });
      setUploadingFiles(uploadingIndices);

      try {
        // Upload files using the multiple upload endpoint
        const uploadedUrls = await uploadFiles(
          files,
          '/admin/upload/multiple',
          (progress) => setUploadProgress(progress)
        );

        // Replace temporary placeholders with actual server URLs (never store blob URLs)
        const updatedImages = [...currentImages];
        uploadedUrls.forEach((url, index) => {
          // Ensure we only store server URLs, not blob URLs
          if (url && !url.startsWith('blob:')) {
            updatedImages[startIndex + index] = url;
            // Track this as an uploaded image
            setUploadedImageUrls(prev => new Set([...prev, url]));
          } else {
            // If somehow we got a blob URL, remove it
            updatedImages[startIndex + index] = '';
          }
        });
        // Filter out any empty strings or blob URLs
        const cleanedImages = updatedImages.filter(img => img && !img.startsWith('blob:'));
        form.setValue('images', cleanedImages.length > 0 ? cleanedImages : undefined);
        
        toast.success(`${uploadedUrls.length} зураг амжилттай ачааллаа`);
      } catch (error) {
        // Remove failed uploads from the form
        const updatedImages = currentImages;
        form.setValue('images', updatedImages);
        
        const errorMessage = error instanceof Error ? error.message : 'Зураг ачаалахад алдаа гарлаа';
        toast.error(errorMessage);
        // Remove from processing set on error
        processingFilesSetRef.current.delete(fileIdentifiers);
        throw error;
      } finally {
        setUploadingFiles(new Set());
        setUploadProgress(0);
        // Remove from processing set
        processingFilesSetRef.current.delete(fileIdentifiers);
        activeUploadRef.current = null; // Clear active upload
        // Re-enable file input when done
        if (fileInputRef.current) {
          fileInputRef.current.disabled = false;
        }
        if (resetProcessingFlag) {
          isProcessingFilesRef.current = false;
          // Clear processing files set when done
          processingFilesSetRef.current.clear();
        }
      }
    })();
    
    // Store the promise to prevent concurrent uploads
    activeUploadRef.current = uploadPromise;
    
    // Wait for upload to complete
    try {
      await uploadPromise;
    } finally {
      // Ensure file input is re-enabled even if there's an error
      if (fileInputRef.current && !isProcessingFilesRef.current) {
        fileInputRef.current.disabled = false;
      }
    }
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    if (!imageToCrop) return;

    const currentImages = form.getValues('images') || [];
    const index = imageToCrop.index;
    const currentImageToCrop = imageToCrop; // Store reference before state update

    // Create temporary placeholder
    const tempUrls = [...currentImages];
    if (tempUrls.length <= index) {
      // Extend array if needed
      while (tempUrls.length <= index) {
        tempUrls.push('');
      }
    }
    tempUrls[index] = `uploading-${index}`;
    form.setValue('images', tempUrls);
    setUploadingFiles(new Set([index]));

    try {
      // Convert blob to File
      const croppedFile = new File([croppedImageBlob], currentImageToCrop.file.name, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      // Upload the cropped image
      const uploadedUrl = await uploadFile(croppedFile, '/admin/upload');

      // Update the image at the specific index with server URL (never store blob URLs)
      const updatedImages = [...currentImages];
      if (updatedImages.length <= index) {
        while (updatedImages.length <= index) {
          updatedImages.push('');
        }
      }
      // Ensure we only store server URLs, not blob URLs
      if (uploadedUrl && !uploadedUrl.startsWith('blob:')) {
        updatedImages[index] = uploadedUrl;
        form.setValue('images', updatedImages);
        // Track this as an uploaded image
        setUploadedImageUrls(prev => new Set([...prev, uploadedUrl]));
      } else {
        // If somehow we got a blob URL, don't store it
        console.error('Received blob URL instead of server URL, skipping storage');
        updatedImages[index] = '';
        form.setValue('images', updatedImages.filter(img => img && !img.startsWith('blob:')));
      }

      toast.success('Зураг таслаж амжилттай ачааллаа');

      // Clean up current image URL
      if (currentImageToCrop.url) {
        URL.revokeObjectURL(currentImageToCrop.url);
      }

      // Process next file if there are pending files
      if (pendingFiles.length > 0) {
        const nextFile = pendingFiles[0];
        const remainingFiles = pendingFiles.slice(1);
        
        // Check if next file needs cropping
        const needsCrop = !(await checkImageAspectRatio(nextFile));
        
        if (needsCrop) {
          const url = URL.createObjectURL(nextFile);
          setImageToCrop({
            file: nextFile,
            index: index + 1,
            url,
          });
          setPendingFiles(remainingFiles);
          // Dialog will stay open for next file
        } else {
          // Upload remaining files directly
          setPendingFiles([]);
          setCropDialogOpen(false);
          // Clean up blob URL before clearing
          if (imageToCrop?.url) {
            URL.revokeObjectURL(imageToCrop.url);
          }
          setImageToCrop(null);
          await uploadFilesDirectly([nextFile, ...remainingFiles], index + 1, updatedImages, true);
        }
      } else {
        setPendingFiles([]);
        setCropDialogOpen(false);
        // Clean up blob URL before clearing
        if (imageToCrop?.url) {
          URL.revokeObjectURL(imageToCrop.url);
        }
        setImageToCrop(null);
        isProcessingFilesRef.current = false; // Reset processing flag when all files are processed
        processingFilesSetRef.current.clear(); // Clear processing files set
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Зураг ачаалахад алдаа гарлаа';
      toast.error(errorMessage);
      // Remove failed upload from form
      const updatedImages = currentImages;
      form.setValue('images', updatedImages);
      setCropDialogOpen(false);
      // Clean up blob URL before clearing
      if (imageToCrop?.url) {
        URL.revokeObjectURL(imageToCrop.url);
      }
      setImageToCrop(null);
      isProcessingFilesRef.current = false; // Reset processing flag on error
      processingFilesSetRef.current.clear(); // Clear processing files set on error
    } finally {
      setUploadingFiles(new Set());
    }
  };

  const handleCropDialogClose = () => {
    setCropDialogOpen(false);
    if (imageToCrop?.url) {
      URL.revokeObjectURL(imageToCrop.url);
    }
    setImageToCrop(null);
    setPendingFiles([]);
  };

  const handleFormSubmit = async (values: ProductFormValues) => {
    try {
      // Filter out empty image URLs and uploading placeholders before submitting
      const cleanedValues: any = {
        name: values.name,
        description: values.description,
        price: values.price,
        originalPrice: values.originalPrice ?? null,
        stock: values.stock,
      };
      
      // Handle images - filter out empty URLs and uploading placeholders
      const filteredImages = values.images?.filter(
        img => img.trim() !== '' && !img.startsWith('uploading-')
      );
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

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => {
                const isFocusedRef = useRef(false);

                return (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      <span className="text-primary">Одоогийн үнэ (Зарах үнэ) *</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                          ₮
                        </span>
                        <Input
                          type="text"
                          placeholder="1,234.56"
                          className="pl-8 border-primary/20"
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Хэрэглэгчдэд харагдах үнэ
                    </p>
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="originalPrice"
              render={({ field }) => {
                const isFocusedRef = useRef(false);

                return (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      <span className="text-muted-foreground">Анхны үнэ (Хөнгөлөлтөөс өмнө)</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                          ₮
                        </span>
                        <Input
                          type="text"
                          placeholder="1,234.56 (сонголттой)"
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
                            
                            // Allow empty input (null)
                            if (inputValue === '') {
                              field.onChange(null);
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
                              field.onChange(null);
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
                              field.onChange(null);
                            }
                            field.onBlur();
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      Хөнгөлөлт үзүүлэхэд шаардлагатай. Анхны үнэ одоогийн үнээс их байвал хөнгөлөлт автоматаар тооцогдоно
                    </p>
                  </FormItem>
                );
              }}
            />
          </div>

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
                                  {parentCategory.children.map((childCategory: Category) => (
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
          render={({ field }) => {
            const isUploading = uploadingFiles.size > 0;
            
            return (
              <FormItem>
                <FormLabel>Зургууд</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    {images.map((image, index) => {
                      const isUploadingThis = uploadingFiles.has(index);
                      const isPlaceholder = image.startsWith('uploading-');
                      
                      return (
                        <div key={index} className="flex gap-2 items-start">
                          <div className="flex-1 flex gap-2">
                            <Input
                              type="url"
                              placeholder="https://example.com/image.jpg эсвэл файл сонгоно уу"
                              value={isPlaceholder || image.startsWith('blob:') ? '' : image}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                // Prevent storing blob URLs
                                if (newValue.startsWith('blob:')) {
                                  toast.error('Blob URLs cannot be stored. Please use a server URL or upload a file.');
                                  return;
                                }
                                const newImages = [...images];
                                newImages[index] = newValue;
                                field.onChange(newImages);
                              }}
                              className="flex-1"
                              disabled={isUploadingThis}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={async () => {
                                const imageToDelete = image;
                                const isUploadedImage = uploadedImageUrls.has(imageToDelete);
                                const isInitialImage = initialImages.includes(imageToDelete);
                                
                                // If this is an uploaded image (not from initial/defaultValues), delete it from server
                                if (isUploadedImage && !isInitialImage) {
                                  try {
                                    await deleteImage(imageToDelete);
                                    // Remove from tracked uploaded images
                                    setUploadedImageUrls(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete(imageToDelete);
                                      return newSet;
                                    });
                                  } catch (error) {
                                    // Log error but still remove from form
                                    console.error('Failed to delete image from server:', error);
                                    toast.error('Зургийг серверээс устгахад алдаа гарлаа, гэхдээ жагсаалтаас хасав');
                                  }
                                }
                                
                                // Remove from form
                                const newImages = images.filter((_, i) => i !== index);
                                field.onChange(newImages.length > 0 ? newImages : undefined);
                              }}
                              disabled={isUploadingThis}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          {image && !isPlaceholder && !image.startsWith('blob:') && (
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
                          {isUploadingThis && (
                            <div className="relative w-16 h-16 border rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center bg-muted">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          fileInputRef.current?.click();
                        }}
                        disabled={isUploading}
                        className="flex-1"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {isUploading ? 'Ачааллаж байна...' : 'Файл сонгох'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          field.onChange([...images, '']);
                        }}
                        disabled={isUploading}
                        className="flex-1"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        URL нэмэх
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={isUploading || isProcessingFilesRef.current}
                    />
                    {isUploading && uploadProgress > 0 && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
                <p className="text-sm text-muted-foreground">
                  Зураг файл сонгох эсвэл URL хаяг оруулах боломжтой
                </p>
              </FormItem>
            );
          }}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Хадгалж байна...' : 'Хадгалах'}
          </Button>
        </div>
      </form>
      
      {imageToCrop && (
        <ImageCropDialog
          open={cropDialogOpen}
          onClose={handleCropDialogClose}
          imageSrc={imageToCrop.url}
          onCropComplete={handleCropComplete}
          aspectRatio={1} // 1:1 square aspect ratio
        />
      )}
    </Form>
  );
}