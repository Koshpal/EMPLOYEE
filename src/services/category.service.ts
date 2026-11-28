import { axiosInstance } from './api';
import type {
  Category,
  CategoryList,
  CategoryType,
  CreateCategoryPayload,
  RestoreDefaultsResult,
  SubCategory,
  UpdateCategoryPayload,
} from '../types/spending.types';
import { invalidateAfter } from '../hooks/useApi';

/** The authenticated employee's own category library. There is no way to name another user. */

export async function listCategories(params: { type?: CategoryType; isActive?: boolean | 'all'; search?: string } = {}): Promise<Category[]> {
  const q = new URLSearchParams();
  if (params.type) q.set('type', params.type);
  if (params.isActive !== undefined) q.set('isActive', String(params.isActive));
  if (params.search) q.set('search', params.search);
  const res = await axiosInstance.get<CategoryList>(`/categories?${q}`);
  return res.data.data;
}

export async function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  const res = await axiosInstance.post<Category>('/categories', payload);
  invalidateAfter('category');
  return res.data;
}

export async function updateCategory(id: string, payload: UpdateCategoryPayload): Promise<Category> {
  const res = await axiosInstance.patch<Category>(`/categories/${id}`, payload);
  invalidateAfter('category');
  return res.data;
}

export async function archiveCategory(id: string): Promise<{ retainedTransactions: number; activeBudgetLines: number }> {
  const res = await axiosInstance.delete(`/categories/${id}`);
  invalidateAfter('category');
  return res.data;
}

export async function restoreDefaultCategories(): Promise<RestoreDefaultsResult> {
  const res = await axiosInstance.post<RestoreDefaultsResult>('/categories/restore-defaults');
  invalidateAfter('category');
  return res.data;
}

export async function createSubCategory(categoryId: string, payload: { name: string; icon?: string }): Promise<SubCategory & { restored?: boolean }> {
  const res = await axiosInstance.post(`/categories/${categoryId}/subcategories`, payload);
  invalidateAfter('category');
  return res.data;
}

export async function updateSubCategory(
  categoryId: string,
  subCategoryId: string,
  payload: { name?: string; icon?: string; isActive?: boolean },
): Promise<SubCategory> {
  const res = await axiosInstance.patch(`/categories/${categoryId}/subcategories/${subCategoryId}`, payload);
  invalidateAfter('category');
  return res.data;
}

export async function archiveSubCategory(categoryId: string, subCategoryId: string): Promise<void> {
  await axiosInstance.delete(`/categories/${categoryId}/subcategories/${subCategoryId}`);
  invalidateAfter('category');
}

export async function reorderSubCategories(categoryId: string, orderedIds: string[]): Promise<void> {
  await axiosInstance.post(`/categories/${categoryId}/subcategories/reorder`, { orderedIds });
  invalidateAfter('category');
}
