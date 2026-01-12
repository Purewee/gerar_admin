import adminFetchAndValidate from '@/lib/admin-fetcher';
import { API_BASE_URL } from '@/lib/api-config';
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoriesResponse,
  Category,
} from './type';
import {
  CategoryResponseSchema,
  CategoriesResponseSchema,
} from './type';

// Helper function to flatten nested categories into a flat array
function flattenCategories(categories: Category[]): Category[] {
  const flattened: Category[] = [];
  
  const traverse = (cats: Category[]) => {
    for (const cat of cats) {
      // Push the category (with parentId) to the flat array
      flattened.push({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        parentId: cat.parentId,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      });
      
      // Recursively flatten children (subcategories) if they exist
      // API returns nested categories in 'children' field, but check both for compatibility
      const nestedCategories = cat.children || cat.subcategories;
      if (nestedCategories && nestedCategories.length > 0) {
        traverse(nestedCategories);
      }
    }
  };
  
  traverse(categories);
  return flattened;
}

export const getCategories = async (): Promise<Category[]> => {
  // Use admin endpoint for fetching categories with nested subcategories
  // The admin endpoint returns categories with subcategories in 'children' field
  const response = await adminFetchAndValidate<CategoriesResponse>(
    '/admin/categories',
    CategoriesResponseSchema,
  );

  const categories = response.data;

  // Check if categories are already flat (all categories have parentId directly)
  // vs nested (only top-level categories are in the array, with subcategories nested in 'children')
  const hasNestedStructure = categories.some(
    cat => (cat.children && cat.children.length > 0) || (cat.subcategories && cat.subcategories.length > 0)
  );
  const hasAllCategoriesFlat = categories.some(cat => cat.parentId !== null);
  
  // If we have nested structure, flatten it
  // If it's already completely flat, return as-is
  if (hasNestedStructure) {
    // API returned nested structure, flatten it
    return flattenCategories(categories);
  } else if (hasAllCategoriesFlat) {
    // API returned flat array with all categories (including children), return as-is
    return categories;
  } else {
    // Only top-level categories returned, flatten to be safe
    return flattenCategories(categories);
  }
};

export const getCategory = async (id: number): Promise<Category> => {
  // Use public endpoint for fetching single category
  const res = await fetch(`${API_BASE_URL}/categories/${id}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(
      json.error?.message || json.message || `Request failed with status ${res.status}`,
    );
  }

  // Handle response format
  if (json.success && json.data) {
    return json.data;
  }
  if (json.id) {
    return json;
  }
  throw new Error('Invalid API response format');
};

export const createCategory = async (
  category: CreateCategoryRequest,
): Promise<Category> => {
  const response = await adminFetchAndValidate(
    '/admin/categories',
    CategoryResponseSchema,
    {
      method: 'POST',
      body: category,
    },
  );
  return response.data;
};

export const updateCategory = async (
  id: number,
  updates: UpdateCategoryRequest,
): Promise<Category> => {
  const response = await adminFetchAndValidate(
    `/admin/categories/${id}/update`,
    CategoryResponseSchema,
    {
      method: 'POST',
      body: updates,
    },
  );
  return response.data;
};

export const deleteCategory = async (id: number): Promise<Category> => {
  const response = await adminFetchAndValidate(
    `/admin/categories/${id}/delete`,
    CategoryResponseSchema,
    {
      method: 'POST',
    },
  );
  return response.data;
}
