import React, { useState } from 'react'

export default function Login({ onSignIn, onSignUp }) {
  const [mode, setMode] = useState('signin')
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

  return (
    <>
      <style>{`
        @keyframes login-swirl-1 {
          0% { transform: translate(0,0) scale(1) rotate(0deg); border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
          25% { transform: translate(35%,-32%) scale(1.45) rotate(90deg); border-radius: 60% 40% 30% 70% / 50% 60% 50% 40%; }
          50% { transform: translate(-30%,28%) scale(.7) rotate(180deg); border-radius: 30% 70% 50% 50% / 60% 40% 70% 30%; }
          75% { transform: translate(28%,22%) scale(1.2) rotate(270deg); border-radius: 50% 50% 40% 60% / 40% 60% 50% 50%; }
          100% { transform: translate(0,0) scale(1) rotate(360deg); border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
        }
        @keyframes login-swirl-2 {
          0% { transform: translate(0,0) scale(1) rotate(0deg); border-radius: 60% 40% 30% 70% / 50% 60% 50% 40%; }
          25% { transform: translate(-38%,30%) scale(1.5) rotate(-90deg); border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
          50% { transform: translate(34%,-28%) scale(.65) rotate(-180deg); border-radius: 50% 50% 70% 30% / 30% 70% 40% 60%; }
          75% { transform: translate(-26%,-24%) scale(1.25) rotate(-270deg); border-radius: 70% 30% 50% 50% / 50% 50% 60% 40%; }
          100% { transform: translate(0,0) scale(1) rotate(-360deg); border-radius: 60% 40% 30% 70% / 50% 60% 50% 40%; }
        }
        @keyframes login-swirl-3 {
          0% { transform: translate(0,0) scale(1) rotate(0deg); border-radius: 30% 70% 50% 50% / 60% 40% 70% 30%; }
          25% { transform: translate(32%,34%) scale(.7) rotate(90deg); border-radius: 50% 50% 70% 30% / 30% 70% 40% 60%; }
          50% { transform: translate(-34%,-30%) scale(1.45) rotate(180deg); border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
          75% { transform: translate(30%,-26%) scale(1.1) rotate(270deg); border-radius: 60% 40% 50% 50% / 50% 50% 40% 60%; }
          100% { transform: translate(0,0) scale(1) rotate(360deg); border-radius: 30% 70% 50% 50% / 60% 40% 70% 30%; }
        }
        .login-root {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
          font-family: 'Pretendard', 'Apple SD Gothic Neo', -apple-system, sans-serif;
        }
        .login-blobs { position: absolute; inset: 0; z-index: 0; overflow: hidden; }
        .login-blob { position: absolute; mix-blend-mode: multiply; }
        .login-blob.b1 { top: -30%; left: -15%; width: 55%; padding-bottom: 55%; background: #22cd6d; filter: blur(60px); opacity: .7; animation: login-swirl-1 9s infinite ease-in-out; }
        .login-blob.b2 { top: -15%; right: -20%; width: 50%; padding-bottom: 50%; background: #38d98a; filter: blur(55px); opacity: .5; animation: login-swirl-2 11s infinite ease-in-out; }
        .login-blob.b3 { bottom: -35%; left: 5%; width: 48%; padding-bottom: 48%; background: #a3e635; filter: blur(62px); opacity: .45; animation: login-swirl-3 10s infinite ease-in-out; }
        .login-blob.b4 { bottom: -20%; right: 8%; width: 42%; padding-bottom: 42%; background: #5eead4; filter: blur(58px); opacity: .4; animation: login-swirl-1 13s infinite reverse ease-in-out; }
        .login-glass {
          position: absolute; inset: 0; z-index: 1;
          background: rgba(255,255,255,0.50);
          backdrop-filter: blur(6px) saturate(1.2);
          -webkit-backdrop-filter: blur(6px) saturate(1.2);
        }
        .login-card {
          position: relative; z-index: 2;
          width: 400px; max-width: 92vw;
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(18px) saturate(1.6);
          -webkit-backdrop-filter: blur(18px) saturate(1.6);
          border: 1px solid rgba(255,255,255,0.85);
          border-radius: 24px;
          padding: 44px 38px;
          box-shadow: 0 12px 48px rgba(0,0,0,.08), 0 2px 12px rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,.95);
        }
        .login-logo { text-align: center; margin-bottom: 36px; }
        .login-logo svg { height: 32px; width: auto; }
        .login-logo svg path { fill: #111 !important; }
        .login-tabs {
          display: flex; background: rgba(0,0,0,.05); border-radius: 11px; padding: 4px; margin-bottom: 26px; gap: 4px;
        }
        .login-tab {
          flex: 1; height: 38px; border-radius: 8px; border: none; cursor: pointer;
          font-weight: 700; font-size: 13.5px; font-family: inherit;
          transition: all .18s;
        }
        .login-tab.on {
          background: rgba(255,255,255,.85); color: #111;
          box-shadow: 0 1px 6px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,1);
        }
        .login-tab:not(.on) { background: transparent; color: #888; }
        .login-tab:not(.on):hover { color: #555; }
        .login-label { font-size: 12.5px; font-weight: 600; color: #555; display: block; margin-bottom: 6px; }
        .login-input {
          width: 100%; height: 44px; border-radius: 11px;
          border: 1.5px solid rgba(0,0,0,.10);
          padding: 0 14px; font-size: 14px; color: #111;
          background: rgba(255,255,255,.65); font-family: inherit;
          outline: none; box-sizing: border-box;
          backdrop-filter: blur(4px);
          transition: border-color .18s, box-shadow .18s, background .18s;
        }
        .login-input:focus {
          border-color: #05d560;
          box-shadow: 0 0 0 3px rgba(5,213,96,.15);
          background: rgba(255,255,255,.85);
        }
        .login-input::placeholder { color: #aaa; }
        .login-ini-input {
          text-align: center; font-size: 20px; font-weight: 800;
          background: #1e1e1e; color: #fff; border-color: #1e1e1e;
        }
        .login-ini-input:focus { border-color: #1e1e1e; box-shadow: 0 0 0 3px rgba(30,30,30,.15); background: #1e1e1e; }
        .login-error {
          font-size: 13px; color: #ef4444; background: rgba(239,68,68,.08);
          padding: 9px 13px; border-radius: 9px; border: 1px solid rgba(239,68,68,.15);
        }
        .login-submit {
          width: 100%; height: 46px; border-radius: 12px; border: none; cursor: pointer;
          background: #111; color: #fff; font-weight: 700; font-size: 15px;
          font-family: inherit; margin-top: 6px;
          transition: opacity .15s, transform .12s;
        }
        .login-submit:hover { transform: translateY(-1px); }
        .login-submit:active { transform: translateY(0); }
        .login-submit:disabled { opacity: .5; cursor: default; transform: none; }
      `}</style>
      <div className="login-root">
        <div className="login-blobs">
          <div className="login-blob b1" />
          <div className="login-blob b2" />
          <div className="login-blob b3" />
          <div className="login-blob b4" />
        </div>
        <div className="login-glass" />
        <div className="login-card">
          <div className="login-logo">
            <svg width="1161" height="217" viewBox="0 0 1161 217" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_login)">
                <path d="M557.433 207.253V50.4944H502.813V16.084H650.286V50.4944H595.667V207.253H557.433ZM685.132 210.803C670.567 210.803 657.731 207.435 646.625 200.698C635.519 193.962 626.871 185.041 620.681 173.935C614.673 162.647 611.669 150.175 611.669 136.52C611.669 122.865 614.855 110.394 621.227 99.1059C627.599 87.6358 636.247 78.5325 647.171 71.7961C658.277 65.0596 670.931 61.6914 685.132 61.6914C699.333 61.6914 711.805 65.0596 722.546 71.7961C733.47 78.5325 741.936 87.6358 747.945 99.1059C754.135 110.394 757.23 122.865 757.23 136.52C757.23 138.523 757.139 140.617 756.957 142.802C756.775 144.986 756.502 147.262 756.137 149.629H649.902C651.905 158.004 655.91 164.832 661.919 170.111C668.109 175.391 675.847 178.031 685.132 178.031C693.143 178.031 700.061 176.211 705.887 172.569C711.896 168.928 716.538 164.376 719.815 158.914L748.491 180.489C742.847 189.41 734.381 196.693 723.093 202.337C711.805 207.981 699.151 210.803 685.132 210.803ZM684.586 93.3708C675.847 93.3708 668.382 96.0108 662.192 101.291C656.001 106.571 651.905 113.489 649.902 122.046H720.089C718.086 114.217 713.898 107.481 707.526 101.837C701.336 96.1929 693.689 93.3708 684.586 93.3708ZM825.349 210.803C812.422 210.803 800.588 207.526 789.846 200.972C779.286 194.235 770.82 185.314 764.448 174.208C758.258 162.92 755.162 150.448 755.162 136.793C755.162 126.598 756.983 117.039 760.624 108.118C764.266 99.0149 769.273 91.095 775.645 84.3586C782.017 77.4401 789.391 72.0692 797.766 68.2458C806.323 64.2404 815.517 62.2376 825.349 62.2376C837.729 62.2376 847.379 64.6045 854.297 69.3382C861.216 73.8898 866.587 79.989 870.41 87.6358V65.2417H907.005V207.253H871.229V184.039C867.406 192.05 861.944 198.514 854.843 203.429C847.925 208.345 838.093 210.803 825.349 210.803ZM831.357 177.485C839.55 177.485 846.559 175.664 852.385 172.023C858.394 168.2 863.036 163.193 866.313 157.003C869.591 150.813 871.229 144.076 871.229 136.793C871.229 129.329 869.591 122.501 866.313 116.311C863.036 110.121 858.394 105.114 852.385 101.291C846.559 97.4673 839.55 95.5556 831.357 95.5556C823.528 95.5556 816.61 97.4673 810.601 101.291C804.775 104.932 800.224 109.848 796.946 116.038C793.669 122.228 792.031 129.056 792.031 136.52C792.031 143.621 793.669 150.357 796.946 156.73C800.224 162.92 804.775 167.927 810.601 171.75C816.61 175.573 823.528 177.485 831.357 177.485ZM917.987 207.253V65.2417H954.309V85.9972C961.773 69.9754 976.248 61.9645 997.731 61.9645C1007.74 61.9645 1016.76 64.3314 1024.77 69.0651C1032.78 73.6167 1039.15 80.1711 1043.88 88.7282C1048.62 80.1711 1054.63 73.6167 1061.91 69.0651C1069.37 64.3314 1079.39 61.9645 1091.95 61.9645C1102.15 61.9645 1111.34 64.3314 1119.53 69.0651C1127.73 73.7988 1134.19 80.5352 1138.92 89.2744C1143.66 98.0135 1146.02 108.391 1146.02 120.408V207.253H1109.16V129.42C1109.16 117.039 1106.52 108.118 1101.24 102.656C1095.96 97.0121 1089.13 94.1901 1080.75 94.1901C1072.2 94.1901 1065.19 96.648 1059.72 101.564C1054.44 106.48 1051.8 115.765 1051.8 129.42V207.253H1014.94V129.42C1014.94 117.039 1012.11 108.118 1006.47 102.656C1000.83 97.0121 993.453 94.1901 984.349 94.1901C976.521 94.1901 969.602 97.0121 963.594 102.656C957.768 108.118 954.855 117.039 954.855 129.42V207.253H917.987Z" fill="#1E1E1E"/>
                <path d="M60.6272 16.4353V206.419H15.147V16.4353H60.6272ZM200.44 206.419L194.858 110.91H194.238L171.912 206.419H140.075L117.749 110.91H117.129L111.547 206.419H66.8936L79.2973 16.4353H128.499L155.58 128.896H156.407L183.488 16.4353H232.69L245.093 206.419H200.44ZM340.88 102.021C349.149 104.777 355.695 110.29 360.519 118.559C365.48 126.69 367.961 136.613 367.961 148.328C367.961 159.629 365.756 169.621 361.346 178.304C356.936 187.124 350.596 194.015 342.327 198.976C334.196 203.938 324.617 206.419 313.592 206.419H251.366V16.4353H304.909C316.072 16.4353 325.789 18.5715 334.058 22.8439C342.465 27.1163 348.873 33.1114 353.283 40.8292C357.694 48.5471 359.899 57.4364 359.899 67.4972C359.899 75.6285 358.107 82.7262 354.524 88.7902C350.941 94.7164 346.393 99.1266 340.88 102.021ZM304.909 165.073C309.871 165.073 313.661 163.419 316.279 160.111C319.035 156.666 320.414 152.049 320.414 146.261C320.414 140.334 319.035 135.718 316.279 132.41C313.661 128.964 309.871 127.242 304.909 127.242H296.847V165.073H304.909ZM303.048 91.271C307.459 91.271 310.766 89.8239 312.971 86.9297C315.314 84.0355 316.486 79.9009 316.486 74.526C316.486 69.151 315.314 65.0165 312.971 62.1223C310.766 59.2281 307.459 57.781 303.048 57.781H296.847V91.271H303.048ZM348.238 16.4353H397.646L417.699 84.6556L437.751 16.4353H487.159L440.439 127.655V206.419H394.959V127.655L348.238 16.4353Z" fill="black"/>
              </g>
              <defs><clipPath id="clip0_login"><rect width="1161" height="216.485" fill="white"/></clipPath></defs>
            </svg>
          </div>

          <div className="login-tabs">
            {['signin','signup'].map(m => (
              <button key={m} className={`login-tab${mode === m ? ' on' : ''}`}
                onClick={() => { setMode(m); setError('') }}>
                {m === 'signin' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && (
              <>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label className="login-label">이름</label>
                    <input className="login-input" placeholder="홍길동" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div style={{ width: 80 }}>
                    <label className="login-label">이니셜</label>
                    <input className="login-input login-ini-input" placeholder="길" maxLength={1} value={ini} onChange={e => setIni(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="login-label">직책/역할</label>
                  <input className="login-input" placeholder="크리에이티브 디렉터" value={role} onChange={e => setRole(e.target.value)} />
                </div>
              </>
            )}
            <div>
              <label className="login-label">이메일</label>
              <input className="login-input" type="email" placeholder="hello@imby.kr" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="login-label">비밀번호</label>
              <input className="login-input" type="password" placeholder="6자 이상" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" disabled={loading} className="login-submit">
              {loading ? '처리 중...' : mode === 'signin' ? '로그인' : '가입하기'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
