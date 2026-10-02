import { useState } from 'react'
import { useAiToggle } from '../context/AiToggleContext'
import type { Story, StoryUpdateInput } from '../types'
import SceneCard from './SceneCard'
import SimilarityBadge from './SimilarityBadge'
import StatusBadge from './StatusBadge'

interface StoryDetailProps {
  story: Story
  onSave: (input: StoryUpdateInput) => Promise<void>
  onRegenerate: () => Promise<void>
  onDelete: () => void
  onSceneUpdated: (scene: Story['scenes'][number]) => void
  initialEdit?: boolean
}

export default function StoryDetail({ story, onSave, onRegenerate, onDelete, onSceneUpdated, initialEdit = false }: StoryDetailProps) {
  const { aiEnabled } = useAiToggle()
  const [editing, setEditing] = useState(initialEdit)
  const [title, setTitle] = useState(story.title)
  const [hook, setHook] = useState(story.hook ?? '')
  const [summary, setSummary] = useState(story.summary ?? '')
  const [storyText, setStoryText] = useState(story.story_text ?? '')
  const [ending, setEnding] = useState(story.ending ?? '')
  const [location, setLocation] = useState(story.location ?? '')
  const [mood, setMood] = useState(story.mood ?? '')
  const [status, setStatus] = useState(story.status)
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleCopyIdea() {
    const parts = [
      `Title: ${story.title}`,
      story.hook && `Hook: ${story.hook}`,
      story.summary && `Idea: ${story.summary}`,
      story.characters.length > 0 && `Characters: ${story.characters.join(', ')}`,
      story.location && `Location: ${story.location}`,
      story.mood && `Mood: ${story.mood}`,
    ].filter(Boolean)
    await navigator.clipboard.writeText(parts.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await onSave({ title, hook, summary, story_text: storyText, ending, location, mood, status })
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save story.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRegenerate() {
    if (!aiEnabled) {
      setError('AI Generation is turned OFF (see the header toggle). Turn it on to regenerate this story.')
      return
    }
    setRegenerating(true)
    setError(null)
    try {
      await onRegenerate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate story.')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {editing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xl font-bold"
            />
          ) : (
            <h2 className="text-2xl font-bold text-slate-800">{story.title}</h2>
          )}
          <p className="mt-1 text-sm text-slate-500">Episode #{story.episode_number}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <SimilarityBadge score={story.similarity_score} />
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
          >
            EDIT STORY
          </button>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'SAVE CHANGES'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              CANCEL
            </button>
          </>
        )}
        <button
          onClick={handleRegenerate}
          disabled={regenerating || !aiEnabled}
          title={aiEnabled ? undefined : 'AI Generation is turned OFF (see header toggle)'}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {regenerating ? 'REGENERATING...' : 'REGENERATE ENTIRE STORY'}
        </button>
        <button onClick={onDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
          DELETE STORY
        </button>
        <button
          onClick={handleCopyIdea}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {copied ? 'COPIED!' : 'COPY IDEA'}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Hook</h3>
          {editing ? (
            <textarea value={hook} onChange={(e) => setHook(e.target.value)} rows={2} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          ) : (
            <p className="mt-2 text-slate-700">{story.hook}</p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Summary</h3>
          {editing ? (
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          ) : (
            <p className="mt-2 text-slate-700">{story.summary}</p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Full Story</h3>
          {editing ? (
            <textarea value={storyText} onChange={(e) => setStoryText(e.target.value)} rows={8} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          ) : (
            <p className="mt-2 whitespace-pre-wrap text-slate-700">{story.story_text}</p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Ending</h3>
          {editing ? (
            <textarea value={ending} onChange={(e) => setEnding(e.target.value)} rows={2} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          ) : (
            <p className="mt-2 text-slate-700">{story.ending}</p>
          )}
        </section>

        <section className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Characters</h3>
            <p className="mt-2 text-slate-700">{story.characters.join(', ') || '—'}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Location</h3>
            {editing ? (
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            ) : (
              <p className="mt-2 text-slate-700">{story.location}</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Mood</h3>
            {editing ? (
              <input value={mood} onChange={(e) => setMood(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            ) : (
              <p className="mt-2 text-slate-700">{story.mood}</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Status</h3>
            {editing ? (
              <select value={status} onChange={(e) => setStatus(e.target.value as Story['status'])} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="DRAFT">DRAFT</option>
                <option value="APPROVED">APPROVED</option>
                <option value="PUBLISHED">PUBLISHED</option>
              </select>
            ) : (
              <div className="mt-2"><StatusBadge status={story.status} /></div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Generated With</h3>
            <p className="mt-2 text-slate-700">
              {story.ai_provider === 'manual'
                ? 'Added manually'
                : story.ai_provider
                  ? `${story.ai_provider === 'ollama' ? 'Ollama (Local)' : 'OpenAI'}${story.ai_model ? ` — ${story.ai_model}` : ''}`
                  : '—'}
            </p>
          </div>
        </section>

        {story.signature && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Story Signature</h3>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-700 sm:grid-cols-3">
              <div><dt className="text-xs text-slate-400">Primary Theme</dt><dd>{story.signature.primary_theme || '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Location</dt><dd>{story.signature.location || '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Conflict Type</dt><dd>{story.signature.conflict_type || '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Hook Type</dt><dd>{story.signature.hook_type || '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Ending Type</dt><dd>{story.signature.ending_type || '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Relationship Dynamic</dt><dd>{story.signature.relationship_dynamic || '—'}</dd></div>
            </dl>
          </section>
        )}

        {story.seo_package && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">SEO Data</h3>
            <div className="mt-2 space-y-1 text-sm text-slate-700">
              {story.seo_package.youtube_title && (
                <p><span className="font-medium text-slate-500">YouTube Title:</span> {story.seo_package.youtube_title}</p>
              )}
              {story.seo_package.description && (
                <p><span className="font-medium text-slate-500">Description:</span> {story.seo_package.description}</p>
              )}
              {story.seo_package.tags.length > 0 && (
                <p><span className="font-medium text-slate-500">Tags:</span> {story.seo_package.tags.join(', ')}</p>
              )}
              {story.seo_package.thumbnail_text && (
                <p><span className="font-medium text-slate-500">Thumbnail Text:</span> {story.seo_package.thumbnail_text}</p>
              )}
              {story.seo_package.flow_prompt && (
                <div>
                  <span className="font-medium text-slate-500">Google Flow Prompt (all scenes):</span>
                  <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-slate-700">
                    {story.seo_package.flow_prompt}
                  </p>
                </div>
              )}
              {!story.seo_package.youtube_title &&
                !story.seo_package.description &&
                !story.seo_package.tags.length &&
                !story.seo_package.thumbnail_text &&
                !story.seo_package.flow_prompt && <p className="text-slate-400">No SEO outputs were requested for this story.</p>}
            </div>
          </section>
        )}

        <section>
          <h3 className="mb-3 text-lg font-semibold text-slate-800">Scenes</h3>
          <div className="flex flex-col gap-3">
            {story.scenes.map((scene) => (
              <SceneCard key={scene.id} scene={scene} onUpdated={onSceneUpdated} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
