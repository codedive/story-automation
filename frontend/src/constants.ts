export const LANGUAGE_OPTIONS = ['Hindi', 'English', 'Hinglish']

export const DURATION_OPTIONS = ['30 Seconds', '60 Seconds', '2 Minutes', '5 Minutes', '10 Minutes']

export const VISUAL_STYLE_OPTIONS = [
  '2D Animated',
  '3D Animated',
  'Ghibli Inspired',
  'Cinematic',
  'Semi-Realistic 2D',
  'Custom',
]

export const EMOTION_LEVEL_OPTIONS = ['Low', 'Medium', 'High']

export const STATUS_FILTER_OPTIONS = ['All', 'Draft', 'Approved', 'Published']

export const SORT_OPTIONS: { value: 'newest' | 'oldest' | 'title'; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'title', label: 'Title' },
]

export const AI_PROVIDER_OPTIONS: { value: 'openai' | 'ollama'; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'ollama', label: 'Ollama (Local)' },
]
