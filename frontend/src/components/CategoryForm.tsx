import { useState } from 'react'
import type { FormEvent } from 'react'
import { DURATION_OPTIONS, LANGUAGE_OPTIONS, VISUAL_STYLE_OPTIONS } from '../constants'
import type { Category, CategoryCreateInput } from '../types'
import Modal from './Modal'

interface CategoryFormProps {
  initial?: Category | null
  onClose: () => void
  onSubmit: (input: CategoryCreateInput) => Promise<void>
}

export default function CategoryForm({ initial, onClose, onSubmit }: CategoryFormProps) {
  const isEdit = Boolean(initial)
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [language, setLanguage] = useState(initial?.default_language ?? LANGUAGE_OPTIONS[1])
  const [duration, setDuration] = useState(initial?.default_duration ?? DURATION_OPTIONS[1])
  const [visualStyleOption, setVisualStyleOption] = useState(
    !initial ? VISUAL_STYLE_OPTIONS[0] : VISUAL_STYLE_OPTIONS.includes(initial.visual_style) ? initial.visual_style : 'Custom',
  )
  const [customVisualStyle, setCustomVisualStyle] = useState(
    !initial || VISUAL_STYLE_OPTIONS.includes(initial.visual_style) ? '' : initial.visual_style,
  )
  const [customInstructions, setCustomInstructions] = useState(initial?.custom_instructions ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Category name is required.')
      return
    }
    const visualStyle = visualStyleOption === 'Custom' ? customVisualStyle.trim() || 'Custom' : visualStyleOption
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        default_language: language,
        default_duration: duration,
        visual_style: visualStyle,
        custom_instructions: customInstructions.trim(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category.')
      setSubmitting(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Edit Category' : 'Add New Category'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Category Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="e.g. Romantic Love Stories"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Romantic stories for Raj & Simran"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Default Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Default Story Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Default Visual Style</label>
          <select
            value={visualStyleOption}
            onChange={(e) => setVisualStyleOption(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {VISUAL_STYLE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {visualStyleOption === 'Custom' && (
            <input
              value={customVisualStyle}
              onChange={(e) => setCustomVisualStyle(e.target.value)}
              placeholder="Describe the custom visual style"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Custom AI Instructions</label>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Generate romantic Raj and Simran stories. Both characters must remain consistent..."
          />
        </div>

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
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Category'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
