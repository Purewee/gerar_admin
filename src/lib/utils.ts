import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price as Mongolian Tugrik (₮) with thousand separators
 * @param price - Price as string or number
 * @returns Formatted price string with ₮ symbol and comma separators
 */
export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '₮0';
  
  // Format with commas for thousands and 2 decimal places
  const formatted = numPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `₮${formatted}`;
}
