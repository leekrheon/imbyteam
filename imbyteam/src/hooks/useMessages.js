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

  return { messages, sendMessage }
}
