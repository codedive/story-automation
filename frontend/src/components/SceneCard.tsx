import { useState } from 'react'
import { regenerateScene, updateScene } from '../api/scenes'
import { getErrorMessage } from '../api/client'
import { useAiToggle } from '../context/AiToggleContext'
import type { Scene } from '../types'

interface SceneCardProps {
  scene: Scene
  onUpdated: (scene: Scene) => void
}

export default function SceneCard({ scene, onUpdated }: SceneCardProps) {
  const { aiEnabled, aiProvider } = useAiToggle()
  const [editing, setEditing] = useState(false)
  const [visualDescription, setVisualDescription] = useState(scene.visual_description ?? '')
  const [location, setLocation] = useState(scene.location ?? '')
  const [dialogue, setDialogue] = useState(scene.dialogue.join('\n'))
  const [camera, setCamera] = useState(scene.camera ?? '')
  const [musicSfx, setMusicSfx] = useState(scene.music_sfx ?? '')
  const [duration, setDuration] = useState(scene.duration_seconds)
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateScene(scene.id, {
        visual_description: visualDescription,
        location,
        dialogue: dialogue.split('\n').filter((line) => line.trim().length > 0),
        camera,
        music_sfx: musicSfx,
        duration_seconds: duration,
      })
      onUpdated(updated)
      setEditing(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleRegenerate() {
    if (!aiEnabled) {
      setError('AI Generation is turned OFF (see the header toggle). Turn it on to regenerate this scene.')
      return
    }
    setRegenerating(true)
    setError(null)
    try {
      const updated = await regenerateScene(scene.id, aiProvider)
      setVisualDescription(updated.visual_description ?? '')
      setLocation(updated.location ?? '')
      setDialogue(updated.dialogue.join('\n'))
      setCamera(updated.camera ?? '')
      setMusicSfx(updated.music_sfx ?? '')
      setDuration(updated.duration_seconds)
      onUpdated(updated)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-800">Scene {scene.scene_number}</h4>
        <div className="flex gap-3 text-xs font-semibold">
          <button onClick={() => setEditing((v) => !v)} className="text-slate-600 hover:text-slate-900">
            {editing ? 'CANCEL' : 'EDIT'}
          </button>
          <button onClick={handleRegenerate} disabled={regenerating || !aiEnabled} title={aiEnabled ? undefined : 'AI Generation is turned OFF (see header toggle)'} className="text-amber-600 hover:text-amber-800 disabled:opacity-50">
            {regenerating ? 'REGENERATING...' : 'REGENERATE SCENE'}
          </button>
        </div>
      </div>

      {error && <p className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">{error}</p>}

      {!editing ? (
        <div className="mt-2 space-y-1 text-sm text-slate-600">
          <p><span className="font-medium text-slate-500">Duration:</span> {scene.duration_seconds}s</p>
          <p><span className="font-medium text-slate-500">Location:</span> {location || '—'}</p>
          <p><span className="font-medium text-slate-500">Visual:</span> {visualDescription || '—'}</p>
          <p><span className="font-medium text-slate-500">Dialogue:</span></p>
          <ul className="list-inside list-disc pl-2">
            {dialogue.split('\n').filter(Boolean).map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
          <p><span className="font-medium text-slate-500">Camera:</span> {camera || '—'}</p>
          <p><span className="font-medium text-slate-500">Music/SFX:</span> {musicSfx || '—'}</p>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-medium text-slate-500">
              Duration (s)
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-slate-500">
              Location
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
          </div>
          <label className="text-xs font-medium text-slate-500">
            Visual Description
            <textarea
              value={visualDescription}
              onChange={(e) => setVisualDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-slate-500">
            Dialogue (one line per entry)
            <textarea
              value={dialogue}
              onChange={(e) => setDialogue(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-medium text-slate-500">
              Camera
              <input
                value={camera}
                onChange={(e) => setCamera(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-slate-500">
              Music/SFX
              <input
                value={musicSfx}
                onChange={(e) => setMusicSfx(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
          </div>
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Scene'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
