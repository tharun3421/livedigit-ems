
const LoginLeftSide = () => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

        @keyframes ls-drift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(20px, -30px) scale(1.08); }
        }
        @keyframes ls-drift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-30px, 20px) scale(1.1); }
        }
        @keyframes ls-drift3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(15px, 25px) scale(0.95); }
        }
        @keyframes ls-fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes ls-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes ls-scan {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(400px); }
        }

        .ls-wrap {
          display: none;
          font-family: 'DM Sans', sans-serif;
        }
        @media (min-width: 768px) {
          .ls-wrap {
            display: flex;
            flex-direction: column;
            justify-content: center;
            width: 50%;
            min-height: 100svh;
            background: #080b14;
            position: relative;
            overflow: hidden;
            padding: 64px 56px;
            border-right: 1px solid rgba(255,255,255,0.06);
          }
        }
        @media (min-width: 1024px) {
          .ls-wrap { padding: 80px 72px; }
        }

        .ls-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); pointer-events: none;
        }
        .ls-orb-a {
          width: 480px; height: 480px; top: -180px; left: -160px;
          background: radial-gradient(circle, rgba(99,102,241,0.5), transparent 70%);
          animation: ls-drift1 16s ease-in-out infinite;
        }
        .ls-orb-b {
          width: 360px; height: 360px; bottom: -120px; right: -80px;
          background: radial-gradient(circle, rgba(6,182,212,0.35), transparent 70%);
          animation: ls-drift2 20s ease-in-out infinite;
        }
        .ls-orb-c {
          width: 260px; height: 260px; top: 55%; left: 60%;
          background: radial-gradient(circle, rgba(139,92,246,0.2), transparent 70%);
          animation: ls-drift3 24s ease-in-out infinite;
        }

        .ls-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 90% 90% at 30% 50%, black 20%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 90% 90% at 30% 50%, black 20%, transparent 100%);
        }

        .ls-content {
          position: relative; z-index: 10;
          display: flex; flex-direction: column;
        }

        .ls-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          margin-bottom: 28px;
          animation: ls-fadeUp 0.7s 0.1s cubic-bezier(0.16,1,0.3,1) both;
        }
        .ls-eye-line {
          width: 28px; height: 1px;
          background: linear-gradient(90deg, #6366f1, #38bdf8);
        }
        .ls-eye-txt {
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(130,132,255,0.8);
        }

        .ls-brand {
          font-family: 'Syne', sans-serif;
          font-size: clamp(36px, 4vw, 52px);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.025em;
          color: #fff;
          margin-bottom: 6px;
          animation: ls-fadeUp 0.7s 0.18s cubic-bezier(0.16,1,0.3,1) both;
        }
        .ls-brand-grad {
          background: linear-gradient(120deg, #818cf8 0%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .ls-sub {
          font-family: 'Syne', sans-serif;
          font-size: clamp(13px, 1.5vw, 16px);
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.22);
          margin-bottom: 28px;
          animation: ls-fadeUp 0.7s 0.24s cubic-bezier(0.16,1,0.3,1) both;
        }

        .ls-divider {
          width: 40px; height: 2px;
          background: linear-gradient(90deg, #6366f1, #38bdf8);
          border-radius: 999px;
          margin-bottom: 28px;
          animation: ls-fadeUp 0.7s 0.28s cubic-bezier(0.16,1,0.3,1) both;
        }

        .ls-desc {
          font-size: 15px; font-weight: 300;
          color: rgba(255,255,255,0.38); line-height: 1.75;
          max-width: 360px; margin-bottom: 48px;
          animation: ls-fadeUp 0.7s 0.32s cubic-bezier(0.16,1,0.3,1) both;
        }

        .ls-stats {
          display: flex; gap: 28px; flex-wrap: wrap;
          animation: ls-fadeUp 0.7s 0.38s cubic-bezier(0.16,1,0.3,1) both;
        }
        .ls-stat {
          display: flex; flex-direction: column; gap: 3px;
        }
        .ls-stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 800;
          letter-spacing: -0.02em; color: #fff;
        }
        .ls-stat-num span {
          background: linear-gradient(120deg, #818cf8, #38bdf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .ls-stat-label {
          font-size: 11px; font-weight: 400;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .ls-stat-sep {
          width: 1px; background: rgba(255,255,255,0.08);
          align-self: stretch; margin: 4px 0;
        }

        .ls-card {
          position: absolute; bottom: 40px; right: 40px;
          padding: 16px 20px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          display: flex; align-items: center; gap: 12px;
          animation: ls-fadeUp 0.7s 0.5s cubic-bezier(0.16,1,0.3,1) both;
          z-index: 10;
        }
        .ls-card-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }
        .ls-card-txt { display: flex; flex-direction: column; gap: 2px; }
        .ls-card-top {
          font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.7);
        }
        .ls-card-bot {
          font-size: 11px; font-weight: 300; color: rgba(255,255,255,0.3);
        }
        .ls-live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #22c55e; box-shadow: 0 0 6px #22c55e;
          animation: ls-blink 2s ease-in-out infinite;
          margin-left: auto;
        }
      `}</style>

      <div className="ls-wrap">
        <div className="ls-orb ls-orb-a" />
        <div className="ls-orb ls-orb-b" />
        <div className="ls-orb ls-orb-c" />
        <div className="ls-grid" />

        <div className="ls-content">
          <div className="ls-eyebrow">
            <div className="ls-eye-line" />
            <span className="ls-eye-txt">HR Platform</span>
          </div>

          <h1 className="ls-brand">
            LIVE<span className="ls-brand-grad">DIGIT</span>
          </h1>
          <p className="ls-sub">Employee Management System</p>

          <div className="ls-divider" />

          <p className="ls-desc">
            Streamline your workforce operations, track attendance, manage payroll, and empower your team — all in one secure platform.
          </p>

          <div className="ls-stats">
            <div className="ls-stat">
              <span className="ls-stat-num"><span>99.9%</span></span>
              <span className="ls-stat-label">Uptime</span>
            </div>
            <div className="ls-stat-sep" />
            <div className="ls-stat">
              <span className="ls-stat-num"><span>256-bit</span></span>
              <span className="ls-stat-label">Encryption</span>
            </div>
            <div className="ls-stat-sep" />
            <div className="ls-stat">
              <span className="ls-stat-num"><span>24/7</span></span>
              <span className="ls-stat-label">Support</span>
            </div>
          </div>
        </div>

        <div className="ls-card">
          <div className="ls-card-icon">🔒</div>
          <div className="ls-card-txt">
            <span className="ls-card-top">System Secure</span>
            <span className="ls-card-bot">All systems operational</span>
          </div>
          <div className="ls-live-dot" />
        </div>
      </div>
    </>
  )
}

export default LoginLeftSide