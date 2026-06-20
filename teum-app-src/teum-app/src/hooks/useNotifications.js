import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!userId) return

    // 4일 이내 알림만 로드
    const cutoff = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    supabase.from('notifications').select('*')
      .eq('user_id', userId)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .then(({ data }) => setNotifications(data || []))

    const sub = supabase.channel(`notifications_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        setNotifications(p => [payload.new, ...p])
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        setNotifications(p => p.map(n => n.id === payload.new.id ? payload.new : n))
      })
      .subscribe()

    return () => supabase.removeChannel(sub)
  }, [userId])

  async function pushNotification({ kind, title, ini, issueId, eventId, ideaId, extra, targetUserId }) {
    await supabase.from('notifications').insert({
      user_id: targetUserId || userId,
      kind, title, ini,
      issue_id: issueId || null,
      event_id: eventId || null,
      idea_id: ideaId || null,
      extra: extra || '',
    })
  }

  async function markRead(id) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setNotifications(p => p.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return { notifications, pushNotification, markRead, markAllRead, unreadCount }
}
