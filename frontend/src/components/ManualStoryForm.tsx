import { useState } from 'react'
import type { FormEvent } from 'react'
import { createManualStory } from '../api/stories'
import { getErrorMessage } from '../api/client'
import type { Story, StoryManualCreateInput, StoryStatus } from '../types'
import Modal from './Modal'

interface ManualStoryFormProps {
  categoryId: number
  onClose: () => void
  onCreated: (story: Story) => void
}

export default function ManualStoryForm({ categoryId, onClose, onCreated }: ManualStoryFormProps) {
  const [title, setTitle] = useState('')
  const [hook, setHook] = useState('')
  const [summary, setSummary] = useState('')
  const [storyText, setStoryText] = useState('')
  const [ending, setEnding] = useState('')
  const [location, setLocation] = useState('')
  const [mood, setMood] = useState('')
  const [characters, setCharacters] = useState('')
  const [storyStatus, setStoryStatus] = useState<StoryStatus>('DRAFT')
  const [primaryTheme, setPrimaryTheme] = useState('')
  const [conflictType, setConflictType] = useState('')
  const [hookType, setHookType] = useState('')
  const [endingType, setEndingType] = useState('')
  const [relationshipDynamic, setRelationshipDynamic] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    setSubmitting(true)
    setError(null)
    const input: StoryManualCreateInput = {
      title: title.trim(),
      hook: hook.trim() || undefined,
      summary: summary.trim() || undefined,
      story_text: storyText.trim() || undefined,
      ending: ending.trim() || undefined,
      location: location.trim() || undefined,
      mood: mood.trim() || undefined,
      characters: characters
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      status: storyStatus,
      signature: {
        primary_theme: primaryTheme.trim(),
        location: location.trim(),
        conflict_type: conflictType.trim(),
        hook_type: hookType.trim(),
        ending_type: endingType.trim(),
        relationship_dynamic: relationshipDynamic.trim(),
      },
    }
    try {
      const story = await createManualStory(categoryId, input)
      onCreated(story)
    } catch (err) {
      setError(getErrorMessage(err))
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

  return (
    <Modal title="Add Story Manually" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <p className="text-xs text-slate-500">
          Already have a story from elsewhere? Enter it here — it's saved to this category's history so future AI
          generations know to avoid repeating its premise, location, conflict, hook and ending.
        </p>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. बारिश वाला आख़िरी पन्ना" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Hook</label>
          <textarea value={hook} onChange={(e) => setHook(e.target.value)} rows={2} className={inputClass} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Summary</label>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className={inputClass} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Full Story</label>
          <textarea value={storyText} onChange={(e) => setStoryText(e.target.value)} rows={5} className={inputClass} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Ending</label>
          <textarea value={ending} onChange={(e) => setEnding(e.target.value)} rows={2} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mood</label>
            <input value={mood} onChange={(e) => setMood(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Characters (comma separated)</label>
          <input value={characters} onChange={(e) => setCharacters(e.target.value)} className={inputClass} placeholder="Raj, Simran" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
          <select value={storyStatus} onChange={(e) => setStoryStatus(e.target.value as StoryStatus)} className={inputClass}>
            <option value="DRAFT">DRAFT</option>
            <option value="APPROVED">APPROVED</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </select>
        </div>

        <fieldset className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Story Signature (optional — helps avoid future duplicates)
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Primary Theme</label>
              <input value={primaryTheme} onChange={(e) => setPrimaryTheme(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Conflict Type</label>
              <input value={conflictType} onChange={(e) => setConflictType(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Hook Type</label>
              <input value={hookType} onChange={(e) => setHookType(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Ending Type</label>
              <input value={endingType} onChange={(e) => setEndingType(e.target.value)} className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Relationship Dynamic</label>
              <input value={relationshipDynamic} onChange={(e) => setRelationshipDynamic(e.target.value)} className={inputClass} />
            </div>
          </div>
        </fieldset>

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'ADD STORY'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
