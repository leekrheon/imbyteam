import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useMessages(channel) {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    if (channel === undefined) return
    const ch = channel === null ? 'team' : channel

    supabase.from('messages').select('*').eq('channel', ch).order('created_at')
      .then(({ data, error }) => { if (!error) setMessages(data || []) })

    const sub = supabase
      .channel(`messages_${ch}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel=eq.${ch}`
      }, (payload) => {
        setMessages(p => [...p, payload.new])
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `channel=eq.${ch}`
      }, (payload) => {
        setMessages(p => p.map(m => m.id === payload.new.id ? payload.new : m))
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [channel])

  async function sendMessage(text, senderIni, senderName, senderId, refData = null, eventData = null) {
    try {
      const ch = channel === null ? 'team' : channel
      const { error } = await supabase.from('messages').insert({
        channel: ch, text,
        sender_ini: senderIni, sender_name: senderName, sender_id: senderId,
        ref_data: refData, event_data: eventData,
      })
      if (error) console.error('sendMessage:', error.message)
    } catch (e) { console.error('sendMessage:', e) }
  }

  // 이모지 반응 토글: reactions = { "👍": ["ini1","ini2"], ... }
  async function toggleReaction(messageId, emoji, userIni) {
    try {
      const { data: msg, error } = await supabase
        .from('messages').select('reactions').eq('id', messageId).single()
      if (error) { console.error('toggleReaction fetch:', error.message); return }
      const reactions = msg?.reactions || {}
      const users = reactions[emoji] || []
      const newUsers = users.includes(userIni)
        ? users.filter(u => u !== userIni)
        : [...users, userIni]
      const newReactions = { ...reactions }
      if (newUsers.length === 0) delete newReactions[emoji]
      else newReactions[emoji] = newUsers
      const { error: updErr } = await supabase
        .from('messages').update({ reactions: newReactions }).eq('id', messageId)
      if (updErr) console.error('toggleReaction update:', updErr.message)
    } catch (e) { console.error('toggleReaction:', e) }
  }

  return { messages, sendMessage, toggleReaction }
}
