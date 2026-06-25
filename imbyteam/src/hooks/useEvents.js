import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useEvents() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    supabase.from('events').select('*').order('date')
      .then(({ data, error }) => { if (!error) setEvents(data || []) })

    const sub = supabase
      .channel('events_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
        if (payload.eventType === 'INSERT') setEvents(p => [...p, payload.new])
        if (payload.eventType === 'UPDATE') setEvents(p => p.map(e => e.id === payload.new.id ? payload.new : e))
        if (payload.eventType === 'DELETE') setEvents(p => p.filter(e => e.id !== payload.old.id))
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [])

  async function addEvent(event) {
    try {
      const { data, error } = await supabase.from('events').insert(event).select().single()
      if (error) { console.error('addEvent:', error.message); return null }
      return data
    } catch (e) { console.error('addEvent:', e); return null }
  }

  async function updateEvent(id, patch) {
    try {
      const { error } = await supabase.from('events').update(patch).eq('id', id)
      if (error) console.error('updateEvent:', error.message)
    } catch (e) { console.error('updateEvent:', e) }
  }

  async function deleteEvent(id) {
    try {
      await supabase.from('events').delete().eq('id', id)
    } catch (e) { console.error('deleteEvent:', e) }
  }

  return { events, addEvent, updateEvent, deleteEvent }
}
