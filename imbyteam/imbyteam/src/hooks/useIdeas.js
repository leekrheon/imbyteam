import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useIdeas() {
  const [ideas, setIdeas] = useState([])
  const [comments, setComments] = useState({})

  useEffect(() => {
    supabase.from('ideas').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => { if (!error) setIdeas(data || []) })

    supabase.from('idea_comments').select('*').order('created_at')
      .then(({ data, error }) => {
        if (error) return
        const map = {}
        ;(data || []).forEach(c => {
          if (!map[c.idea_id]) map[c.idea_id] = []
          map[c.idea_id].push(c)
        })
        setComments(map)
      })

    const sub = supabase
      .channel('ideas_realtime')
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

    return () => { supabase.removeChannel(sub) }
  }, [])

  async function addIdea(idea) {
    try {
      const { data, error } = await supabase.from('ideas').insert(idea).select().single()
      if (error) { console.error('addIdea failed:', error.code, error.message, error.details); return null }
      return data
    } catch (e) { console.error('addIdea threw:', e); return null }
  }

  async function updateIdea(id, patch) {
    try {
      const { error } = await supabase.from('ideas').update(patch).eq('id', id)
      if (error) console.error('updateIdea:', error.message)
    } catch (e) { console.error('updateIdea:', e) }
  }

  async function addComment(ideaId, comment) {
    try {
      const { error } = await supabase.from('idea_comments').insert({ idea_id: ideaId, ...comment })
      if (error) console.error('addComment:', error.message)
    } catch (e) { console.error('addComment:', e) }
  }

  async function deleteIdea(id) {
    try {
      await supabase.from('ideas').delete().eq('id', id)
    } catch (e) { console.error('deleteIdea:', e) }
  }

  return { ideas, comments, addIdea, updateIdea, addComment, deleteIdea }
}
