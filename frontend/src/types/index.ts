export type StoryStatus = 'DRAFT' | 'APPROVED' | 'PUBLISHED'

export type AIProviderOption = 'openai' | 'ollama'

export interface Category {
  id: number
  name: string
  description: string | null
  default_language: string
  default_duration: string
  visual_style: string
  custom_instructions: string | null
  created_at: string
  updated_at: string
}

export interface CategorySummary extends Category {
  story_count: number
  last_generated_at: string | null
}

export interface CategoryCreateInput {
  name: string
  description?: string
  default_language?: string
  default_duration?: string
  visual_style?: string
  custom_instructions?: string
}

export type CategoryUpdateInput = Partial<CategoryCreateInput>

export interface StorySignature {
  primary_theme: string
  location: string
  conflict_type: string
  hook_type: string
  ending_type: string
  relationship_dynamic: string
}

export interface Scene {
  id: number
  story_id: number
  scene_number: number
  duration_seconds: number
  location: string | null
  visual_description: string | null
  dialogue: string[]
  camera: string | null
  music_sfx: string | null
  created_at: string
  updated_at: string
}

export interface SceneUpdateInput {
  duration_seconds?: number
  location?: string
  visual_description?: string
  dialogue?: string[]
  camera?: string
  music_sfx?: string
}

export interface SEOPackage {
  id: number
  story_id: number
  youtube_title: string | null
  description: string | null
  tags: string[]
  thumbnail_text: string | null
  flow_prompt: string | null
}

export interface StoryListItem {
  id: number
  category_id: number
  episode_number: number
  title: string
  summary: string | null
  status: StoryStatus
  similarity_score: number
  created_at: string
}

export interface Story {
  id: number
  category_id: number
  episode_number: number
  title: string
  hook: string | null
  summary: string | null
  story_text: string | null
  ending: string | null
  location: string | null
  mood: string | null
  status: StoryStatus
  similarity_score: number
  signature: StorySignature | null
  characters: string[]
  ai_provider: string | null
  ai_model: string | null
  created_at: string
  updated_at: string
  scenes: Scene[]
  seo_package: SEOPackage | null
}

export interface StoryGenerateInput {
  story_idea?: string
  duration?: string
  language?: string
  emotion_level?: string
  number_of_scenes?: number
  include_title?: boolean
  include_description?: boolean
  include_tags?: boolean
  include_flow_prompt?: boolean
  ai_provider?: AIProviderOption
}

export interface StoryUpdateInput {
  title?: string
  hook?: string
  summary?: string
  story_text?: string
  ending?: string
  location?: string
  mood?: string
  status?: StoryStatus
}

export interface StoryManualCreateInput {
  title: string
  hook?: string
  summary?: string
  story_text?: string
  ending?: string
  location?: string
  mood?: string
  characters?: string[]
  status?: StoryStatus
  signature?: StorySignature
}
