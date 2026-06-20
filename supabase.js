import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useBriefs() {
  const [briefs, setBriefs] = useState([])

  useEffect(() => {
    supabase.from('briefs').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setBriefs(data || []))

    const sub = supabase.channel('briefs_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'briefs' }, (payload) => {
        if (payload.eventType === 'INSERT') setBriefs(p => [payload.new, ...p])
        if (payload.eventType === 'UPDATE') setBriefs(p => p.map(b => b.id === payload.new.id ? payload.new : b))
        if (payload.eventType === 'DELETE') setBriefs(p => p.filter(b => b.id !== payload.old.id))
      }).subscribe()

    return () => supabase.removeChannel(sub)
  }, [])

  async function addBrief(brief) {
    const { data } = await supabase.from('briefs').insert(brief).select().single()
    return data
  }

  async function updateBrief(id, patch) {
    await supabase.from('briefs').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
  }

  return { briefs, addBrief, updateBrief }
}
