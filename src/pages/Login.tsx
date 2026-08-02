import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getStoredToken } from '../api/authStorage'
import axios from 'axios'
import { login } from '../api/auth'
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertTriangle, Sparkles } from 'lucide-react'

function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [ready,    setReady]    = useState(false)

  useEffect(() => {
    if (getStoredToken()) navigate('/', { replace: true })
    const t = setTimeout(() => setReady(true), 80)
    return () => clearTimeout(t)
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object'
          ? String((err.response.data as { message?: string }).message || '')
          : ''
      setError(msg || (err instanceof Error ? err.message : 'تعذر تسجيل الدخول'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center overflow-hidden relative"
      style={{ direction: 'rtl' }}
    >
      <style>{`
        /* ── Keyframes ── */
        @keyframes bgPan {
          0%   { transform: scale(1.08) translateX(0px);   }
          50%  { transform: scale(1.08) translateX(-18px); }
          100% { transform: scale(1.08) translateX(0px);   }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(36px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes logoIn {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        @keyframes floatDot {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-8px); }
        }
        @keyframes glowPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(26,92,58,0); }
          50%     { box-shadow: 0 0 0 8px rgba(26,92,58,0.15); }
        }

        .bg-pan      { animation: bgPan 20s ease-in-out infinite; }
        .card-in     { animation: cardIn .7s cubic-bezier(.22,1,.36,1) both; }
        .logo-in     { animation: logoIn .6s cubic-bezier(.22,1,.36,1) .1s both; }
        .glow-btn    { animation: glowPulse 2.5s ease-in-out infinite; }

        /* Glassmorphism card */
        .glass-login {
          background: rgba(255,255,255,0.13);
          backdrop-filter: blur(22px) saturate(1.6);
          -webkit-backdrop-filter: blur(22px) saturate(1.6);
          border: 1px solid rgba(255,255,255,0.28);
          box-shadow:
            0 8px 40px rgba(0,0,0,0.28),
            0 1px 0 rgba(255,255,255,0.35) inset;
        }

        /* Input glass */
        .input-glass {
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.12);
          color: #ffffff;
          caret-color: #fff;
          outline: none;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: border-color .25s, background .25s, box-shadow .25s;
        }
        .input-glass::placeholder { color: rgba(255,255,255,0.4); }
        .input-glass:focus {
          border-color: rgba(255,255,255,0.4);
          background: rgba(0,0,0,0.4);
          box-shadow: 0 0 0 3px rgba(255,255,255,0.05);
        }

        /* Label */
        .label-glass { color: rgba(255,255,255,0.75); font-size: 13px; font-weight: 600; }

        /* Submit btn */
        .btn-primary-glass {
          background: linear-gradient(135deg, var(--primary) 0%, #0d3320 100%);
          box-shadow: 0 4px 20px rgba(26,92,58,0.5);
          border: 1px solid rgba(255,255,255,0.15);
          letter-spacing: 0.02em;
          transition: opacity .2s, transform .2s, box-shadow .2s;
        }
        .btn-primary-glass:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(26,92,58,0.55);
        }
        .btn-primary-glass:active:not(:disabled) { transform: scale(0.98); }
        .btn-primary-glass:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Floating particles */
        .particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.18);
          pointer-events: none;
        }
      `}</style>

      {/* ── Background image (full-screen, animated pan) ── */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <img
          src="/background.png"
          alt=""
          className="bg-pan w-full h-full object-cover"
          draggable={false}
        />
        {/* Dark overlay gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(0,0,0,0.62) 0%, rgba(10,30,18,0.72) 50%, rgba(0,0,0,0.55) 100%)',
          }}
        />
        {/* Subtle green tint at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2/3 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 120%, rgba(26,92,58,0.35) 0%, transparent 65%)',
          }}
        />
      </div>

      {/* ── Floating decorative particles ── */}
      {[
        { w:10, h:10, top:'12%', left:'8%',  delay:'0s',   dur:'4s' },
        { w:6,  h:6,  top:'22%', right:'10%',delay:'1.2s', dur:'3.5s' },
        { w:14, h:14, top:'68%', left:'6%',  delay:'0.6s', dur:'5s' },
        { w:8,  h:8,  top:'78%', right:'8%', delay:'1.8s', dur:'4.5s' },
        { w:5,  h:5,  top:'40%', left:'15%', delay:'2.4s', dur:'3s' },
        { w:7,  h:7,  top:'55%', right:'15%',delay:'0.3s', dur:'4.8s' },
      ].map((p, i) => (
        <div
          key={i}
          className="particle"
          style={{
            width: p.w, height: p.h,
            top: p.top, left: ('left' in p ? p.left : undefined), right: ('right' in p ? p.right : undefined),
            animation: `floatDot ${p.dur} ease-in-out ${p.delay} infinite`,
            zIndex: 1,
          }}
        />
      ))}

      {/* ── Logo Top Right ── */}
     <div className="absolute top-6 right-6 z-20 logo-in pointer-events-none">
        <div className="w-28 h-28 md:w-36 md:h-36 overflow-hidden drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
          <img src="/logo-login.png" alt="شعار الموقع" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* ── Main content ── */}
      <div
        className="relative z-10 w-full max-w-sm mx-4 flex flex-col items-center gap-6"
        style={{ opacity: ready ? 1 : 0, transition: 'opacity .3s' }}
      >

        {/* welcome text */}
        <div className="logo-in flex flex-col items-center gap-3 mt-10 md:mt-0">
          <div className="text-center">
            <h1 className="flex items-center justify-center gap-2 text-3xl font-black text-white tracking-tight drop-shadow-lg">
              مرحباً بك <Sparkles size={28} className="text-yellow-400" />
            </h1>
            <p className="text-white/70 text-base mt-2 font-medium">
              لوحة تحكم الأدمن
            </p>
          </div>
        </div>

        {/* Glass Card */}
        <div className="glass-login card-in w-full rounded-3xl px-7 py-8">

          {/* Card header */}
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck size={18} className="text-green-300 shrink-0" />
            <span className="text-white/80 text-sm font-semibold">تسجيل الدخول الآمن</span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Error message */}
            {error && (
              <div
                className="flex items-center justify-center gap-2 text-sm text-red-200 rounded-2xl px-4 py-3 text-center font-medium"
                style={{
                  background: 'rgba(239,68,68,0.18)',
                  border: '1px solid rgba(239,68,68,0.35)',
                }}
              >
                <AlertTriangle size={16} className="text-red-300" />
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="label-glass block mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-glass w-full rounded-xl pr-10 pl-4 py-3 text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label-glass block mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                />
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-glass w-full rounded-xl pr-10 pl-10 py-3 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white/80 transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-glass glow-btn mt-1 w-full rounded-xl py-3.5 text-sm font-bold text-white cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                  />
                  جاري الدخول...
                </span>
              ) : (
                'دخول →'
              )}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-white/35 text-xs text-center pb-2">
          للدخول بحساب الأدمن فقط • نظام إدارة الصيدلية
        </p>
      </div>
    </div>
  )
}

export default Login
