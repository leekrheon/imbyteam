import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useIdeas() {
  const [ideas, setIdeas] = useState([])
  const [comments, setComments] = useState({})

  useEffect(() => {
    supabase.from('ideas').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setIdeas(data || []))

    supabase.from('idea_comments').select('*').order('created_at')
      .then(({ data }) => {
        const map = {}
        ;(data || []).forEach(c => {
          if (!map[c.idea_id]) map[c.idea_id] = []
          map[c.idea_id].push(c)
        })
        setComments(map)
      })

    const sub = supabase.channel('ideas_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, (payload) => {
        if (payload.eventType === 'INSERT') setIdeas(p => [payload.new, ...p])
        if (payload.eventType === 'UPDATE') setIdeas(p => p.map(i => i.id === payload.new.id ? payload.new : i))
        if (payload.eventType === 'DELETE') setIdeas(p => p.filter(i => i.id !== payload.old.id))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'idea_comments' }, (payload) => {
        setComments(p => ({
          ...p,
          [payload.new.idea_id]: [...(p[payload.new.idea_id] || []), payload.new]
        }))
      })
      .subscribe()

    return () => supabase.removeChannel(sub)
  }, [])

  async function addIdea(idea) {
    const { data } = await supabase.from('ideas').insert(idea).select().single()
    return data
  }

  async function updateIdea(id, patch) {
    await supabase.from('ideas').update(patch).eq('id', id)
  }

  async function addComment(ideaId, comment) {
    await supabase.from('idea_comments').insert({ idea_id: ideaId, ...comment })
  }

  return { ideas, comments, addIdea, updateIdea, addComment }
}
