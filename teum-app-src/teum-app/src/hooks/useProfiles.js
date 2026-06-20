import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useProfiles() {
  const [profiles, setProfiles] = useState([])

  useEffect(() => {
    supabase.from('profiles').select('*')
      .then(({ data }) => setProfiles(data || []))

    const sub = supabase.channel('profiles_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        if (payload.eventType === 'INSERT') setProfiles(p => [...p, payload.new])
        if (payload.eventType === 'UPDATE') setProfiles(p => p.map(pr => pr.id === payload.new.id ? payload.new : pr))
      }).subscribe()

    return () => supabase.removeChannel(sub)
  }, [])

  async function updateWorking(userId, working, startedAt) {
    await supabase.from('profiles').update({ working, work_started_at: startedAt }).eq('id', userId)
  }

  async function updateTheme(userId, theme) {
    await supabase.from('profiles').update({ theme }).eq('id', userId)
  }

  return { profiles, updateWorking, updateTheme }
}
