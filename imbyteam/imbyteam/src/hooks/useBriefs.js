import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useBriefs() {
  const [briefs, setBriefs] = useState([])

  useEffect(() => {
    supabase.from('briefs').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => { if (!error) setBriefs(data || []) })

    const sub = supabase
      .channel('briefs_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'briefs' }, (payload) => {
        if (payload.eventType === 'INSERT') setBriefs(p => [payload.new, ...p])
        if (payload.eventType === 'UPDATE') setBriefs(p => p.map(b => b.id === payload.new.id ? payload.new : b))
        if (payload.eventType === 'DELETE') setBriefs(p => p.filter(b => b.id !== payload.old.id))
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [])

  async function addBrief(brief) {
    try {
      const { data, error } = await supabase.from('briefs').insert(brief).select().single()
      if (error) { console.error('addBrief:', error.message); return null }
      return data
    } catch (e) { console.error('addBrief:', e); return null }
  }

  async function updateBrief(id, patch) {
    try {
      const { error } = await supabase.from('briefs').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) console.error('updateBrief:', error.message)
    } catch (e) { console.error('updateBrief:', e) }
  }

  return { briefs, addBrief, updateBrief }
}
