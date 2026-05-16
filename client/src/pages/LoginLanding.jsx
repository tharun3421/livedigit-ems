
import React from 'react'
import { ArrowRightIcon, ShieldIcon, UserIcon } from "lucide-react"
import { Link, Navigate } from "react-router-dom"
import Loading from '../components/Loading'
import { useAuth } from '../context/authContext'

const portalOptions = [
  {
    to: "/login/admin",
    title: "Admin Portal",
    description: "Manage employees, departments, payroll, and system configurations.",
    icon: ShieldIcon,
    label: "Administrator",
    accent: "indigo",
  },
  {
    to: "/login/employee",
    title: "Employee Portal",
    description: "View your profile, track attendance, request time off, and access payslips.",
    icon: UserIcon,
    label: "Staff Member",
    accent: "cyan",
  },
]

const LoginLanding = () => {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (user) return <Navigate to="/" />

  return (
    <div className="min-h-svh w-full bg-[#080b14] flex items-center justify-center relative overflow-hidden">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');

        @keyframes drift1 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(30px,-20px) scale(1.07); }
        }
        @keyframes drift2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-40px,30px) scale(1.1); }
        }
        @keyframes cardIn {
          from { opacity:0; transform:translateY(20px) scale(0.97); }
          to   { opacity:1; transform:none; }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.35} }

        .syne { font-family:'Syne',sans-serif; }
        .grad-text {
          background: linear-gradient(120deg,#818cf8,#38bdf8);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .card-in   { animation: cardIn 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .card-in-1 { animation: cardIn 0.7s 0.08s cubic-bezier(0.16,1,0.3,1) both; }
        .card-in-2 { animation: cardIn 0.7s 0.14s cubic-bezier(0.16,1,0.3,1) both; }
        .card-in-3 { animation: cardIn 0.7s 0.20s cubic-bezier(0.16,1,0.3,1) both; }
        .card-in-4 { animation: cardIn 0.7s 0.26s cubic-bezier(0.16,1,0.3,1) both; }
        .card-in-5 { animation: cardIn 0.7s 0.32s cubic-bezier(0.16,1,0.3,1) both; }
        .card-in-6 { animation: cardIn 0.7s 0.38s cubic-bezier(0.16,1,0.3,1) both; }
        .dot-blink { animation: blink 2s ease-in-out infinite; }

        /* portal hover — indigo */
        .portal-indigo { transition: border-color .25s, background .25s, transform .25s; }
        .portal-indigo:hover { border-color:#6366f1 !important; transform:translateY(-2px); }
        .portal-indigo:hover .pwash  { opacity:1 !important; }
        .portal-indigo:hover .picon  { background:rgba(99,102,241,0.22) !important; transform:scale(1.07); }
        .portal-indigo:hover .parr   { background:#6366f1 !important; border-color:#6366f1 !important; transform:translateX(4px); }
        .portal-indigo:hover .parr svg { stroke:#fff !important; }

        /* portal hover — cyan */
        .portal-cyan { transition: border-color .25s, background .25s, transform .25s; }
        .portal-cyan:hover { border-color:#06b6d4 !important; transform:translateY(-2px); }
        .portal-cyan:hover .pwash  { opacity:1 !important; }
        .portal-cyan:hover .picon  { background:rgba(6,182,212,0.22) !important; transform:scale(1.07); }
        .portal-cyan:hover .parr   { background:#06b6d4 !important; border-color:#06b6d4 !important; transform:translateX(4px); }
        .portal-cyan:hover .parr svg { stroke:#fff !important; }

        .picon { transition: background .25s, transform .25s; }
        .parr  { transition: background .25s, border-color .25s, transform .25s; }
        .pwash { transition: opacity .25s; }
      `}</style>

      {/* Ambient orbs */}
      <div className="absolute rounded-full pointer-events-none"
        style={{ width:'min(420px,90vw)', height:'min(420px,90vw)', top:'-15%', left:'-15%',
          background:'radial-gradient(circle,rgba(99,102,241,0.55),transparent 70%)',
          filter:'blur(72px)', animation:'drift1 14s ease-in-out infinite' }} />
      <div className="absolute rounded-full pointer-events-none"
        style={{ width:'min(340px,75vw)', height:'min(340px,75vw)', bottom:'-12%', right:'-10%',
          background:'radial-gradient(circle,rgba(6,182,212,0.45),transparent 70%)',
          filter:'blur(72px)', animation:'drift2 18s ease-in-out infinite' }} />
      <div className="absolute rounded-full pointer-events-none"
        style={{ width:'min(240px,55vw)', height:'min(240px,55vw)', top:'45%', left:'55%',
          background:'radial-gradient(circle,rgba(139,92,246,0.22),transparent 70%)',
          filter:'blur(72px)', animation:'drift1 22s ease-in-out infinite reverse' }} />

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:`linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),
                           linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)`,
          backgroundSize:'44px 44px',
          maskImage:'radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 100%)',
          WebkitMaskImage:'radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 100%)',
        }} />

      {/* Card */}
      <div className="card-in relative z-10 w-full mx-4 sm:mx-6 rounded-2xl sm:rounded-[26px] px-5 py-8 sm:px-8 sm:py-10 md:px-11 md:py-12"
        style={{
          maxWidth: 'min(440px, 100%)',
          background:'rgba(255,255,255,0.038)',
          border:'1px solid rgba(255,255,255,0.08)',
          boxShadow:'0 0 0 1px rgba(255,255,255,0.04) inset, 0 28px 80px rgba(0,0,0,0.6)',
        }}>

        {/* Corner glow */}
        <div className="absolute top-0 right-0 w-24 h-24 sm:w-28 sm:h-28 pointer-events-none rounded-tr-2xl sm:rounded-tr-[26px]"
          style={{ background:'conic-gradient(from 200deg at 100% 0%,rgba(99,102,241,0.18),transparent 60%)' }} />

        {/* Badge */}
        <div className="card-in-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 sm:mb-6"
          style={{ background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.28)' }}>
          <span className="dot-blink w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"
            style={{ boxShadow:'0 0 6px #6366f1' }} />
          <span className="text-[10px] sm:text-[11px] font-medium tracking-widest uppercase text-indigo-400 whitespace-nowrap">
            Secure Access
          </span>
        </div>

        {/* Headline */}
        <h1 className="card-in-2 syne text-3xl sm:text-4xl font-extrabold leading-[1.1] tracking-tight text-white mb-2">
          Welcome<br /><span className="grad-text">Back.</span>
        </h1>
        <p className="card-in-3 text-sm font-light leading-relaxed mb-7 sm:mb-8"
          style={{ color:'rgba(255,255,255,0.4)' }}>
          Select your portal to securely access the system.
        </p>

        {/* Portals */}
        <div className="flex flex-col gap-3">
          {portalOptions.map((portal, i) => {
            const isIndigo   = portal.accent === "indigo"
            const iconBg     = isIndigo ? "rgba(99,102,241,0.11)" : "rgba(6,182,212,0.11)"
            const iconBorder = isIndigo ? "rgba(99,102,241,0.25)" : "rgba(6,182,212,0.25)"
            const iconColor  = isIndigo ? "#818cf8" : "#22d3ee"
            const labelColor = isIndigo ? "#818cf8" : "#22d3ee"
            const washBg     = isIndigo ? "rgba(99,102,241,0.08)" : "rgba(6,182,212,0.08)"

            return (
              <Link
                key={portal.to}
                to={portal.to}
                className={`portal-${portal.accent} ${i === 0 ? 'card-in-4' : 'card-in-5'} relative overflow-hidden block no-underline rounded-xl sm:rounded-[14px] px-4 py-4 sm:px-5`}
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}
              >
                {/* Wash */}
                <div className="pwash absolute inset-0 opacity-0 pointer-events-none rounded-xl sm:rounded-[14px]"
                  style={{ background: washBg }} />

                <div className="relative z-10 flex items-center gap-3 sm:gap-3.5">
                  {/* Icon */}
                  <div className="shrink-0">
                    <div className="picon w-10 h-10 sm:w-11 sm:h-11 rounded-[10px] sm:rounded-[11px] flex items-center justify-center"
                      style={{ background: iconBg, border:`1px solid ${iconBorder}` }}>
                      <portal.icon strokeWidth={1.75}
                        style={{ width:16, height:16, stroke: iconColor }} className="sm:w-[18px] sm:h-[18px]" />
                    </div>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] sm:text-[10px] font-medium tracking-[0.1em] uppercase mb-0.5 opacity-80"
                      style={{ color: labelColor }}>
                      {portal.label}
                    </div>
                    <div className="syne text-sm sm:text-[15px] font-bold text-white tracking-tight mb-0.5">
                      {portal.title}
                    </div>
                    <div className="text-[11px] sm:text-[12px] font-light truncate"
                      style={{ color:'rgba(255,255,255,0.36)' }}>
                      {portal.description}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="parr shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center"
                    style={{ border:'1px solid rgba(255,255,255,0.1)' }}>
                    <ArrowRightIcon style={{ width:13, height:13, stroke:'rgba(255,255,255,0.45)' }} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Footer */}
        <div className="card-in-6 flex items-center gap-3 mt-7 sm:mt-8">
          <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.07)' }} />
          <span className="syne text-[11px] sm:text-xs font-bold tracking-tight"
            style={{ color:'rgba(255,255,255,0.25)' }}>
            Livedigit
          </span>
          <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.07)' }} />
        </div>
        <p className="mt-2.5 text-center text-[10px] sm:text-[11px]"
          style={{ color:'rgba(255,255,255,0.2)' }}>
          &copy; {new Date().getFullYear()} Livedigit. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default LoginLanding