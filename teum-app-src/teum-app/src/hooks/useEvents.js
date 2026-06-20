import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useEvents() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    supabase.from('events').select('*').order('date')
      .then(({ data }) => setEvents(data || []))

    const sub = supabase.channel('events_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
        if (payload.eventType === 'INSERT') setEvents(p => [...p, payload.new])
        if (payload.eventType === 'UPDATE') setEvents(p => p.map(e => e.id === payload.new.id ? payload.new : e))
        if (payload.eventType === 'DELETE') setEvents(p => p.filter(e => e.id !== payload.old.id))
      }).subscribe()

    return () => supabase.removeChannel(sub)
  }, [])

  async function addEvent(event) {
    const { data } = await supabase.from('events').insert(event).select().single()
    return data
  }

  async function updateEvent(id, patch) {
    await supabase.from('events').update(patch).eq('id', id)
  }

  async function deleteEvent(id) {
    await supabase.from('events').delete().eq('id', id)
  }

  return { events, addEvent, updateEvent, deleteEvent }
}
