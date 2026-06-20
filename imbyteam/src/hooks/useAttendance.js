import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useAttendance(userId) {
  const [attendance, setAttendance] = useState([])

  useEffect(() => {
    if (!userId) return
    supabase.from('attendance').select('*').order('date', { ascending: false })
      .then(({ data }) => setAttendance(data || []))

    const sub = supabase.channel('attendance_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, (payload) => {
        if (payload.eventType === 'INSERT') setAttendance(p => [payload.new, ...p])
        if (payload.eventType === 'UPDATE') setAttendance(p => p.map(a => a.id === payload.new.id ? payload.new : a))
      }).subscribe()

    return () => supabase.removeChannel(sub)
  }, [userId])

  const todayIso = new Date().toISOString().slice(0, 10)

  async function startWork(userIni) {
    const now = Date.now()
    const existing = attendance.find(a => a.user_id === userId && a.date === todayIso)
    if (existing) {
      await supabase.from('attendance').update({ start_ms: now }).eq('id', existing.id)
    } else {
      await supabase.from('attendance').insert({
        user_id: userId, user_ini: userIni, date: todayIso, start_ms: now, end_ms: 0, total_minutes: 0
      })
    }
    return now
  }

  async function endWork(startMs) {
    const now = Date.now()
    const elapsed = Math.floor((now - startMs) / 60000)
    const existing = attendance.find(a => a.user_id === userId && a.date === todayIso)
    if (existing) {
      await supabase.from('attendance').update({
        end_ms: now,
        total_minutes: existing.total_minutes + elapsed
      }).eq('id', existing.id)
    }
    return elapsed
  }

  const todayRecord = attendance.find(a => a.user_id === userId && a.date === todayIso)
  const todayMinutes = todayRecord?.total_minutes || 0

  return { attendance, startWork, endWork, todayMinutes }
}
