import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useBookmarks(userId) {
  const [bookmarks, setBookmarks] = useState({})

  useEffect(() => {
    if (!userId) return
    supabase.from('idea_bookmarks').select('idea_id').eq('user_id', userId)
      .then(({ data, error }) => {
        if (error) return
        const map = {}
        ;(data || []).forEach(b => { map[b.idea_id] = true })
        setBookmarks(map)
      })

    const sub = supabase
      .channel(`bookmarks_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'idea_bookmarks', filter: `user_id=eq.${userId}` }, (payload) => {
        if (payload.eventType === 'INSERT') setBookmarks(p => ({ ...p, [payload.new.idea_id]: true }))
        if (payload.eventType === 'DELETE') setBookmarks(p => { const n = { ...p }; delete n[payload.old.idea_id]; return n })
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [userId])

  async function toggleBookmark(ideaId) {
    try {
      if (bookmarks[ideaId]) {
        await supabase.from('idea_bookmarks').delete().eq('user_id', userId).eq('idea_id', ideaId)
        setBookmarks(p => { const n = { ...p }; delete n[ideaId]; return n })
      } else {
        await supabase.from('idea_bookmarks').insert({ user_id: userId, idea_id: ideaId })
        setBookmarks(p => ({ ...p, [ideaId]: true }))
      }
    } catch (e) { console.error('toggleBookmark:', e) }
  }

  const bookmarkCount = Object.keys(bookmarks).length
  return { bookmarks, toggleBookmark, bookmarkCount }
}
