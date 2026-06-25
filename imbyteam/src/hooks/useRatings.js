import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useRatings(userId, userIni) {
  const [myRatings, setMyRatings] = useState({})

  useEffect(() => {
    if (!userId) return
    supabase.from('idea_ratings').select('idea_id, rating').eq('user_id', userId)
      .then(({ data, error }) => {
        if (error) return
        const map = {}
        ;(data || []).forEach(r => { map[r.idea_id] = r.rating })
        setMyRatings(map)
      })

    const sub = supabase
      .channel(`ratings_${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'idea_ratings',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setMyRatings(p => ({ ...p, [payload.new.idea_id]: payload.new.rating }))
        }
        if (payload.eventType === 'DELETE') {
          setMyRatings(p => { const n = { ...p }; delete n[payload.old.idea_id]; return n })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [userId])

  async function rateIdea(ideaId, rating) {
    try {
      const { error } = await supabase.from('idea_ratings').upsert({
        idea_id: ideaId, user_id: userId, user_ini: userIni, rating
      }, { onConflict: 'idea_id,user_id' })
      if (error) { console.error('rateIdea:', error.message); return }
      setMyRatings(p => ({ ...p, [ideaId]: rating }))

      const { data: allRatings } = await supabase.from('idea_ratings').select('rating').eq('idea_id', ideaId)
      if (allRatings) {
        const sum = allRatings.reduce((s, r) => s + r.rating, 0)
        await supabase.from('ideas').update({ rating_sum: sum, rating_count: allRatings.length }).eq('id', ideaId)
      }
    } catch (e) { console.error('rateIdea:', e) }
  }

  return { myRatings, rateIdea }
}
