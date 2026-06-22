import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  // null = 로딩 전, false = 프로필 있음, true = 이름 입력 필요
  const [needsName, setNeedsName] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    }).catch(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setNeedsName(false); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (!error && data && data.name) {
        // 프로필 있고 이름도 있음 → 정상 진입
        setProfile(data)
        setNeedsName(false)
      } else {
        // 프로필 없거나 이름 없음 → 이름 입력 팝업
        setProfile(data || null)
        setNeedsName(true)
      }
    } catch (e) {
      console.error('fetchProfile:', e)
      setNeedsName(true)
    }
    setLoading(false)
  }

  async function signIn(email, password) {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error
    } catch (e) { return { message: e.message } }
  }

  // 신규 팀원 회원가입 — 이게 없으면 첫 번째 사용자 외엔 계정을 만들 방법이 없어
  // 두 번째 사용자가 영원히 생기지 않고, 그 결과 DM 상대가 존재하지 않게 됨(= "DM이 안 됨")
  async function signUp(email, password, name, ini, role) {
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name, ini, role } }
      })
      return error
    } catch (e) { return { message: e.message } }
  }

  // 처음 로그인 후 이름 설정
  async function setupProfile(userId, name) {
    const ini = name.trim().slice(0, 1)
    try {
      // upsert: 프로필이 없으면 insert, 있으면 update
      const { data, error } = await supabase.from('profiles')
        .upsert({ id: userId, name: name.trim(), ini, role: '' }, { onConflict: 'id' })
        .select().single()
      if (error) return { message: error.message }
      setProfile(data)
      setNeedsName(false)
      return null
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

  return { user, profile, loading, needsName, signIn, signUp, setupProfile, signOut, updateProfile }
}
