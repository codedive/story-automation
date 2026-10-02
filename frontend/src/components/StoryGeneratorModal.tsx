import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { generateStory } from '../api/stories'
import { getErrorMessage } from '../api/client'
import { useAiToggle } from '../context/AiToggleContext'
import type { Category, Story } from '../types'
import Modal from './Modal'

interface StoryGeneratorModalProps {
  category: Category
  onClose: () => void
  onGenerated: (story: Story) => void
}

const PROGRESS_MESSAGES = ['Creating a unique story idea...', 'Checking against previous stories...']

export default function StoryGeneratorModal({ category, onClose, onGenerated }: StoryGeneratorModalProps) {
  const { aiEnabled, aiProvider } = useAiToggle()
  const [storyIdea, setStoryIdea] = useState('')
  const [generating, setGenerating] = useState(false)
  const [progressMessage, setProgressMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!generating) return
    let index = 0
    setProgressMessage(PROGRESS_MESSAGES[0])
    const interval = setInterval(() => {
      index = Math.min(index + 1, PROGRESS_MESSAGES.length - 1)
      setProgressMessage(PROGRESS_MESSAGES[index])
    }, 1800)
    return () => clearInterval(interval)
  }, [generating])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!aiEnabled) {
      setError('AI Generation is turned OFF (see the header toggle). Turn it on to generate a story.')
      return
    }
    setGenerating(true)
    setError(null)
    try {
      const story = await generateStory(category.id, {
        story_idea: storyIdea.trim() || undefined,
        language: category.default_language,
        ai_provider: aiProvider,
      })
      setProgressMessage('Story idea created successfully.')
      onGenerated(story)
    } catch (err) {
      setError(getErrorMessage(err))
      setGenerating(false)
    }
  }

  return (
    <Modal title="Generate New Story Idea" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <p className="text-xs text-slate-500">
          AI generates one unique story idea (title, hook, premise) for this category, checked against previous
          stories so it isn't a repeat. Copy the result and develop the full script wherever you like (e.g. ChatGPT).
        </p>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Story Idea / Topic (optional)</label>
          <textarea
            value={storyIdea}
            onChange={(e) => setStoryIdea(e.target.value)}
            rows={3}
            disabled={generating}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            placeholder="e.g. Raj and Simran go to a lakeside restaurant."
          />
        </div>

        {generating && (
          <div className="flex items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
            {progressMessage}
          </div>
        )}

        {!aiEnabled && !generating && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            AI Generation is turned OFF. Toggle it on in the header to generate a story.
          </p>
        )}

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={generating}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={generating || !aiEnabled}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'GENERATE UNIQUE STORY'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
