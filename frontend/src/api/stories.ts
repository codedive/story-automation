import { apiClient } from './client'
import type { Story, StoryGenerateInput, StoryListItem, StoryManualCreateInput, StoryUpdateInput } from '../types'

export interface StoryListParams {
  search?: string
  status?: string
  sort?: 'newest' | 'oldest' | 'title'
}

export async function fetchStories(categoryId: number, params: StoryListParams = {}): Promise<StoryListItem[]> {
  const { data } = await apiClient.get<StoryListItem[]>(`/api/categories/${categoryId}/stories`, { params })
  return data
}

export async function fetchAllStories(): Promise<StoryListItem[]> {
  const { data } = await apiClient.get<StoryListItem[]>('/api/stories')
  return data
}

export async function fetchStory(id: number): Promise<Story> {
  const { data } = await apiClient.get<Story>(`/api/stories/${id}`)
  return data
}

export async function generateStory(categoryId: number, input: StoryGenerateInput): Promise<Story> {
  const { data } = await apiClient.post<Story>(`/api/categories/${categoryId}/stories/generate`, input)
  return data
}

export async function createManualStory(categoryId: number, input: StoryManualCreateInput): Promise<Story> {
  const { data } = await apiClient.post<Story>(`/api/categories/${categoryId}/stories/manual`, input)
  return data
}

export async function updateStory(id: number, input: StoryUpdateInput): Promise<Story> {
  const { data } = await apiClient.put<Story>(`/api/stories/${id}`, input)
  return data
}

export async function deleteStory(id: number): Promise<void> {
  await apiClient.delete(`/api/stories/${id}`)
}

export async function regenerateStory(id: number, input: StoryGenerateInput = {}): Promise<Story> {
  const { data } = await apiClient.post<Story>(`/api/stories/${id}/regenerate`, input)
  return data
}
