import React, { useState } from 'react'

const COLORS = {
  주: { bg: "#1e1e1e", fg: "#fff" },
  소: { bg: "#7c5cfc", fg: "#fff" },
  민: { bg: "#0ea5e9", fg: "#fff" },
  예: { bg: "#f43f5e", fg: "#fff" },
}

export default function Login({ onSignIn, onSignUp }) {
  const [mode, setMode] = useState('signin') // signin | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [ini, setIni] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    let err
    if (mode === 'signin') {
      err = await onSignIn(email, password)
    } else {
      if (!name || !ini) { setError('이름과 이니셜을 입력해주세요.'); setLoading(false); return }
      err = await onSignUp(email, password, name, ini.slice(0,1), role)
    }
    if (err) setError(err.message)
    setLoading(false)
  }

  const c = COLORS[ini] || { bg: '#e5e7eb', fg: '#374151' }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8f9fa', fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif"
    }}>
      <div style={{ width: 380, background: '#fff', borderRadius: 20, padding: '40px 36px', boxShadow: '0 8px 40px rgba(0,0,0,.10)' }}>
        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, color: '#111' }}>틈</div>
          <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>IMBY Workspace</div>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 10, padding: 4, marginBottom: 24, gap: 4 }}>
          {['signin','signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              style={{
                flex: 1, height: 36, borderRadius: 7, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 13.5,
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#111' : '#999',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,.10)' : 'none',
                transition: 'all .15s'
              }}>
              {m === 'signin' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>이름</label>
                  <input style={inputStyle} placeholder="홍길동" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div style={{ width: 80 }}>
                  <label style={labelStyle}>이니셜</label>
                  <input style={{ ...inputStyle, textAlign: 'center', fontSize: 18, fontWeight: 800,
                    background: c.bg, color: c.fg, borderColor: c.bg }}
                    placeholder="길" maxLength={1} value={ini} onChange={e => setIni(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>직책/역할</label>
                <input style={inputStyle} placeholder="크리에이티브 디렉터" value={role} onChange={e => setRole(e.target.value)} />
              </div>
            </>
          )}
          <div>
            <label style={labelStyle}>이메일</label>
            <input style={inputStyle} type="email" placeholder="hello@imby.kr" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={labelStyle}>비밀번호</label>
            <input style={inputStyle} type="password" placeholder="6자 이상" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>

          {error && <div style={{ fontSize: 13, color: '#ef4444', background: '#fef2f2', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{
            height: 44, borderRadius: 11, border: 'none', cursor: 'pointer',
            background: '#111', color: '#fff', fontWeight: 700, fontSize: 15,
            marginTop: 4, opacity: loading ? .6 : 1, transition: 'opacity .15s'
          }}>
            {loading ? '처리 중...' : mode === 'signin' ? '로그인' : '가입하기'}
          </button>
        </form>
      </div>
    </div>
  )
}

const labelStyle = { fontSize: 12.5, fontWeight: 600, color: '#666', display: 'block', marginBottom: 5 }
const inputStyle = {
  width: '100%', height: 42, borderRadius: 9, border: '1.5px solid #e5e7eb',
  padding: '0 13px', fontSize: 14, color: '#111', background: '#fff',
  outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s',
  fontFamily: 'inherit'
}
