import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useIssues() {
  const [issues, setIssues] = useState([])

  useEffect(() => {
    supabase.from('issues').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setIssues(data || []))

    const sub = supabase.channel('issues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, (payload) => {
        if (payload.eventType === 'INSERT') setIssues(p => [payload.new, ...p])
        if (payload.eventType === 'UPDATE') setIssues(p => p.map(i => i.id === payload.new.id ? payload.new : i))
        if (payload.eventType === 'DELETE') setIssues(p => p.filter(i => i.id !== payload.old.id))
      }).subscribe()

    return () => supabase.removeChannel(sub)
  }, [])

  async function addIssue(issue) {
    const { data } = await supabase.from('issues').insert(issue).select().single()
    return data
  }

  async function updateIssue(id, patch) {
    await supabase.from('issues').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
  }

  async function deleteIssue(id) {
    await supabase.from('issues').delete().eq('id', id)
  }

  return { issues, addIssue, updateIssue, deleteIssue }
}
