import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useIssues() {
  const [issues, setIssues] = useState([])

  useEffect(() => {
    supabase.from('issues').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => { if (!error) setIssues(data || []) })

    const sub = supabase
      .channel('issues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, (payload) => {
        if (payload.eventType === 'INSERT') setIssues(p => [payload.new, ...p])
        if (payload.eventType === 'UPDATE') setIssues(p => p.map(i => i.id === payload.new.id ? payload.new : i))
        if (payload.eventType === 'DELETE') setIssues(p => p.filter(i => i.id !== payload.old.id))
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [])

  async function addIssue(issue) {
    try {
      const { data, error } = await supabase.from('issues').insert(issue).select().single()
      if (error) { console.error('addIssue:', error.message); return null }
      return data
    } catch (e) { console.error('addIssue:', e); return null }
  }

  async function updateIssue(id, patch) {
    try {
      const { error } = await supabase.from('issues').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) console.error('updateIssue:', error.message)
    } catch (e) { console.error('updateIssue:', e) }
  }

  async function deleteIssue(id) {
    try {
      await supabase.from('issues').delete().eq('id', id)
    } catch (e) { console.error('deleteIssue:', e) }
  }

  return { issues, addIssue, updateIssue, deleteIssue }
}
