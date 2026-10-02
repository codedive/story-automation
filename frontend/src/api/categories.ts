import { apiClient } from './client'
import type { Category, CategoryCreateInput, CategorySummary, CategoryUpdateInput } from '../types'

export async function fetchCategories(): Promise<CategorySummary[]> {
  const { data } = await apiClient.get<CategorySummary[]>('/api/categories')
  return data
}

export async function fetchCategory(id: number): Promise<Category> {
  const { data } = await apiClient.get<Category>(`/api/categories/${id}`)
  return data
}

export async function createCategory(input: CategoryCreateInput): Promise<Category> {
  const { data } = await apiClient.post<Category>('/api/categories', input)
  return data
}

export async function updateCategory(id: number, input: CategoryUpdateInput): Promise<Category> {
  const { data } = await apiClient.put<Category>(`/api/categories/${id}`, input)
  return data
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/api/categories/${id}`)
}
