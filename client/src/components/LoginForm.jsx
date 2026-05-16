
import React, { useState } from 'react'
import LoginLeftSide from './LoginLeftSide'
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, Loader2Icon, MailIcon, LockIcon } from "lucide-react"
import { useAuth } from '../context/authContext'
import toast from 'react-hot-toast'

const LoginForm = ({ role, title, subtitle }) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password, role)
      navigate("/dashboard")
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh w-full flex flex-col md:flex-row bg-[#080b14]">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        @keyframes formIn {
          from { opacity:0; transform:translateY(18px) scale(0.98); }
          to   { opacity:1; transform:none; }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .syne { font-family:'Syne',sans-serif; }
        .grad-text {
          background:linear-gradient(120deg,#818cf8,#38bdf8);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .form-in   { animation: formIn 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .form-in-1 { animation: formIn 0.6s 0.08s cubic-bezier(0.16,1,0.3,1) both; }
        .form-in-2 { animation: formIn 0.6s 0.14s cubic-bezier(0.16,1,0.3,1) both; }
        .form-in-3 { animation: formIn 0.6s 0.20s cubic-bezier(0.16,1,0.3,1) both; }
        .form-in-4 { animation: formIn 0.6s 0.26s cubic-bezier(0.16,1,0.3,1) both; }
        .form-in-5 { animation: formIn 0.6s 0.32s cubic-bezier(0.16,1,0.3,1) both; }
        .dot-blink { animation: blink 2s ease-in-out infinite; }

        .lf-input {
          width:100%; padding:11px 16px 11px 42px;
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.09);
          border-radius:11px; color:#fff;
          font-size:13.5px; font-weight:300; outline:none;
          transition:border-color .25s, background .25s, box-shadow .25s;
        }
        .lf-input::placeholder { color:rgba(255,255,255,0.2); }
        .lf-input:focus {
          border-color:rgba(99,102,241,0.55);
          background:rgba(99,102,241,0.06);
          box-shadow:0 0 0 3px rgba(99,102,241,0.12);
        }
        .lf-input.pr { padding-right:44px; }

        .lf-btn {
          width:100%; padding:12px;
          background:linear-gradient(135deg,#6366f1,#4f46e5);
          border:1px solid rgba(99,102,241,0.4);
          border-radius:11px; color:#fff;
          font-size:14px; font-weight:500; letter-spacing:0.01em;
          cursor:pointer; outline:none;
          display:flex; align-items:center; justify-content:center; gap:8px;
          box-shadow:0 4px 20px rgba(99,102,241,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset;
          transition:all .2s cubic-bezier(0.16,1,0.3,1);
        }
        .lf-btn:hover:not(:disabled) {
          background:linear-gradient(135deg,#818cf8,#6366f1);
          box-shadow:0 6px 28px rgba(99,102,241,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset;
          transform:translateY(-1px);
        }
        .lf-btn:active:not(:disabled) { transform:scale(0.98); }
        .lf-btn:disabled { opacity:0.5; cursor:not-allowed; }
      `}</style>

      {/* Left side */}
      <LoginLeftSide />

      {/* Right side */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden p-5 sm:p-8 md:p-12 min-h-svh md:min-h-0">

        {/* subtle orbs behind form */}
        <div className="absolute top-[-10%] right-[-10%] w-72 h-72 rounded-full pointer-events-none"
          style={{ background:'radial-gradient(circle,rgba(99,102,241,0.18),transparent 70%)', filter:'blur(60px)' }} />
        <div className="absolute bottom-[-8%] left-[-8%] w-56 h-56 rounded-full pointer-events-none"
          style={{ background:'radial-gradient(circle,rgba(6,182,212,0.14),transparent 70%)', filter:'blur(60px)' }} />

        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:`linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),
                             linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)`,
            backgroundSize:'44px 44px',
            maskImage:'radial-gradient(ellipse 70% 70% at 60% 50%,black 20%,transparent 100%)',
            WebkitMaskImage:'radial-gradient(ellipse 70% 70% at 60% 50%,black 20%,transparent 100%)',
          }} />

        {/* Form card */}
        <div className="form-in relative z-10 w-full"
          style={{ maxWidth:'min(420px,100%)' }}>

          {/* Card shell */}
          <div className="rounded-2xl sm:rounded-3xl px-6 py-8 sm:px-8 sm:py-10"
            style={{
              background:'rgba(255,255,255,0.038)',
              border:'1px solid rgba(255,255,255,0.08)',
              boxShadow:'0 0 0 1px rgba(255,255,255,0.04) inset, 0 24px 72px rgba(0,0,0,0.5)',
            }}>

            {/* Corner glow */}
            <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none rounded-tr-2xl sm:rounded-tr-3xl"
              style={{ background:'conic-gradient(from 200deg at 100% 0%,rgba(99,102,241,0.15),transparent 60%)' }} />

            {/* Back link */}
            <div className="form-in-1 mb-6">
              <Link to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide no-underline transition-colors duration-200"
                style={{ color:'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.3)'}
              >
                <ArrowLeftIcon size={13} />
                Back to portals
              </Link>
            </div>

            {/* Role badge */}
            <div className="form-in-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{ background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.28)' }}>
              <span className="dot-blink w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"
                style={{ boxShadow:'0 0 6px #6366f1' }} />
              <span className="text-[10px] font-medium tracking-widest uppercase text-indigo-400">
                {role === "ADMIN" ? "Admin Portal" : "Employee Portal"}
              </span>
            </div>

            {/* Heading */}
            <div className="form-in-2 mb-7">
              <h1 className="syne text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight text-white mb-1.5">
                {title?.split(" ")[0]}{" "}
                <span className="grad-text">{title?.split(" ").slice(1).join(" ")}</span>
              </h1>
              <p className="text-sm font-light leading-relaxed"
                style={{ color:'rgba(255,255,255,0.38)' }}>
                {subtitle}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="form-in-2 mb-5 flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', color:'#fca5a5' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Email */}
              <div className="form-in-3">
                <label className="block text-xs font-medium tracking-wide mb-2"
                  style={{ color:'rgba(255,255,255,0.45)' }}>
                  Email address
                </label>
                <div className="relative">
                  <MailIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color:'rgba(255,255,255,0.25)' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="lf-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-in-4">
                <label className="block text-xs font-medium tracking-wide mb-2"
                  style={{ color:'rgba(255,255,255,0.45)' }}>
                  Password
                </label>
                <div className="relative">
                  <LockIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color:'rgba(255,255,255,0.25)' }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="lf-input pr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
                    style={{ color:'rgba(255,255,255,0.25)', background:'none', border:'none', cursor:'pointer', padding:0 }}
                    onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.6)'}
                    onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.25)'}
                  >
                    {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="form-in-5 mt-1">
                <button type="submit" disabled={loading} className="lf-btn">
                  {loading && <Loader2Icon size={16} className="animate-spin" />}
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="form-in-5 flex items-center gap-3 mt-7">
              <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.07)' }} />
              <span className="syne text-[11px] font-bold tracking-tight"
                style={{ color:'rgba(255,255,255,0.2)' }}>Livedigit</span>
              <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.07)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginForm