import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  // 실시간으로 막 도착한 알림만 담음(초기 로딩분은 안 들어감) — 우측 하단 메시지 팝업 트리거용
  const [lastInserted, setLastInserted] = useState(null)

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
      }, (payload) => { setNotifications(p => [payload.new, ...p]); setLastInserted(payload.new) })
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

  // 특정 발신자(ini)의 특정 종류(kind) 알림만 읽음 처리 — DM 상대를 열었을 때 사용
  async function markReadByKindIni(kind, ini) {
    try {
      await supabase.from('notifications').update({ read: true })
        .eq('user_id', userId).eq('kind', kind).eq('ini', ini).eq('read', false)
      setNotifications(p => p.map(n => (n.kind === kind && n.ini === ini) ? { ...n, read: true } : n))
    } catch (e) { console.error('markReadByKindIni:', e) }
  }

  // 특정 종류(kind)의 알림 전부 읽음 처리 — 전체 채팅을 열었을 때 사용
  async function markAllReadByKind(kind) {
    try {
      await supabase.from('notifications').update({ read: true })
        .eq('user_id', userId).eq('kind', kind).eq('read', false)
      setNotifications(p => p.map(n => n.kind === kind ? { ...n, read: true } : n))
    } catch (e) { console.error('markAllReadByKind:', e) }
  }

  const unreadCount = notifications.filter(n => !n.read).length
  return { notifications, pushNotification, markRead, markAllRead, markReadByKindIni, markAllReadByKind, unreadCount, lastInserted }
}
