import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useTimePolls() {
  const [polls, setPolls] = useState([])

  useEffect(() => {
    supabase.from('time_polls').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => { if (!error) setPolls(data || []) })

    const sub = supabase
      .channel('time_polls_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_polls' }, (payload) => {
        if (payload.eventType === 'INSERT') setPolls(p => [payload.new, ...p])
        if (payload.eventType === 'UPDATE') setPolls(p => p.map(t => t.id === payload.new.id ? payload.new : t))
        if (payload.eventType === 'DELETE') setPolls(p => p.filter(t => t.id !== payload.old.id))
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [])

  async function createPoll(poll) {
    try {
      const { data, error } = await supabase.from('time_polls').insert(poll).select().single()
      if (error) { console.error('createPoll:', error.message); return null }
      return data
    } catch (e) { console.error('createPoll:', e); return null }
  }

  async function votePoll(pollId, userIni, slotKey) {
    try {
      const poll = polls.find(p => p.id === pollId)
      if (!poll) return
      const votes = { ...(poll.votes || {}) }
      const cur = votes[userIni] || []
      votes[userIni] = cur.includes(slotKey) ? cur.filter(s => s !== slotKey) : [...cur, slotKey]
      const { error } = await supabase.from('time_polls').update({ votes }).eq('id', pollId)
      if (error) console.error('votePoll:', error.message)
    } catch (e) { console.error('votePoll:', e) }
  }

  return { polls, createPoll, votePoll }
}
