import { useCallback, useEffect, useState } from 'react'
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '../api/categories'
import { getErrorMessage } from '../api/client'
import type { CategoryCreateInput, CategorySummary, CategoryUpdateInput } from '../types'

export function useCategories() {
  const [categories, setCategories] = useState<CategorySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCategories()
      setCategories(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function create(input: CategoryCreateInput) {
    await createCategory(input)
    await load()
  }

  async function update(id: number, input: CategoryUpdateInput) {
    await updateCategory(id, input)
    await load()
  }

  async function remove(id: number) {
    await deleteCategory(id)
    await load()
  }

  return { categories, loading, error, reload: load, create, update, remove }
}
