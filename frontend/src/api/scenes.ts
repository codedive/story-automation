import { apiClient } from './client'
import type { AIProviderOption, Scene, SceneUpdateInput } from '../types'

export async function updateScene(id: number, input: SceneUpdateInput): Promise<Scene> {
  const { data } = await apiClient.put<Scene>(`/api/scenes/${id}`, input)
  return data
}

export async function regenerateScene(id: number, aiProvider?: AIProviderOption): Promise<Scene> {
  const { data } = await apiClient.post<Scene>(`/api/scenes/${id}/regenerate`, { ai_provider: aiProvider })
  return data
}
