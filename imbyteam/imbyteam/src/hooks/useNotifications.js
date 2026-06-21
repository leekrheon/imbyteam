import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!userId) return
    const cutoff = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    supabase.from('notifications').select('*')
      .eq('user_id', userId).gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => { if (!error) setNotifications(data || []) })

    const sub = supabase
      .channel(`notifications_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => { setNotifications(p => [payload.new, ...p]) })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => { setNotifications(p => p.map(n => n.id === payload.new.id ? payload.new : n)) })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [userId])

  async function pushNotification(data) {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: data.targetUserId || userId,
        kind: data.kind, title: data.title, ini: data.ini,
        issue_id: data.issueId || null, event_id: data.eventId || null,
        idea_id: data.ideaId || null, extra: data.extra || '',
      })
      if (error) console.error('pushNotification:', error.message)
    } catch (e) { console.error('pushNotification:', e) }
  }

  async function markRead(id) {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id)
      setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (e) { console.error('markRead:', e) }
  }

  async function markAllRead() {
    try {
      await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
      setNotifications(p => p.map(n => ({ ...n, read: true })))
    } catch (e) { console.error('markAllRead:', e) }
  }

  const unreadCount = notifications.filter(n => !n.read).length
  return { notifications, pushNotification, markRead, markAllRead, unreadCount }
}
