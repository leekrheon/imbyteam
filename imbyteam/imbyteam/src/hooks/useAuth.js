import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    }).catch(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (error) console.error('fetchProfile:', error.message)
      setProfile(data)
    } catch (e) { console.error('fetchProfile:', e) }
    setLoading(false)
  }

  async function signIn(email, password) {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error
    } catch (e) { return { message: e.message } }
  }

  async function signUp(email, password, name, ini, role) {
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name, ini, role } }
      })
      return error
    } catch (e) { return { message: e.message } }
  }

  async function signOut() {
    try { await supabase.auth.signOut() }
    catch (e) { console.error('signOut:', e) }
  }

  async function updateProfile(patch) {
    try {
      const { data, error } = await supabase.from('profiles').update(patch).eq('id', user.id).select().single()
      if (!error) setProfile(data)
    } catch (e) { console.error('updateProfile:', e) }
  }

  return { user, profile, loading, signIn, signUp, signOut, updateProfile }
}
