import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useProfiles() {
  const [profiles, setProfiles] = useState([])

  useEffect(() => {
    supabase.from('profiles').select('*')
      .then(({ data, error }) => { if (!error) setProfiles(data || []) })

    const sub = supabase
      .channel('profiles_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        if (payload.eventType === 'INSERT') setProfiles(p => [...p, payload.new])
        if (payload.eventType === 'UPDATE') setProfiles(p => p.map(pr => pr.id === payload.new.id ? payload.new : pr))
        if (payload.eventType === 'DELETE') setProfiles(p => p.filter(pr => pr.id !== payload.old.id))
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [])

  async function updateWorking(userId, working, startedAt) {
    try {
      const { error } = await supabase.from('profiles').update({ working, work_started_at: startedAt }).eq('id', userId)
      if (error) console.error('updateWorking:', error.message)
    } catch (e) { console.error('updateWorking:', e) }
  }

  async function deleteMember(userId) {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId)
      if (error) console.error('deleteMember:', error.message)
      else setProfiles(p => p.filter(pr => pr.id !== userId))
    } catch (e) { console.error('deleteMember:', e) }
  }

  async function updateTheme(userId, theme) {
    try {
      const { error } = await supabase.from('profiles').update({ theme }).eq('id', userId)
      if (error) console.error('updateTheme:', error.message)
    } catch (e) { console.error('updateTheme:', e) }
  }

  return { profiles, updateWorking, updateTheme, deleteMember }
}
