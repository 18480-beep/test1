import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

// ─── THEME CONFIG ─────────────────────────────────────────────────────────────
const DEFAULT_HUE = 330;
const DEFAULT_AUTO_SHIFT = true;

// ─── TEXT COLOR CONFIG ────────────────────────────────────────────────────────
const TEXT_COLORS = {
  logo: '#000000',
  heading: '#170808d2',
  tagline: 'auto' as 'auto' | string,
  description: 'rgba(12, 13, 19, 0.8)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const createStyles = (hue: number) => ({
  accent:            `hsl(${hue}, 70%, 55%)`,
  accentDark:        `hsl(${hue}, 70%, 42%)`,
  accentShadow:      `hsla(${hue}, 70%, 50%, 0.35)`,
  accentShadowHover: `hsla(${hue}, 70%, 50%, 0.50)`,
  accentFocus:       `hsla(${hue}, 70%, 55%, 0.18)`,
  accentGlow:        `hsla(${hue}, 80%, 55%, 0.55)`,
  orb1:              `hsl(${hue}, 80%, 55%)`,
  orb2:              `hsl(${(hue + 60) % 360}, 80%, 55%)`,
  orb3:              `hsl(${(hue + 150) % 360}, 80%, 55%)`,
  stripGradient:     `linear-gradient(180deg,
    hsl(${hue},70%,55%),
    hsl(${(hue + 60) % 360},70%,55%),
    hsl(${(hue + 120) % 360},70%,55%))`,
});

// ─── Icons ────────────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.013 17.64 11.705 17.64 9.2z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>
);

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    ) : (
      <>
        <path d="M17.94 12s-3.94 6-8.94 6S.06 12 .06 12 4 6 9 6s8.94 6 8.94 6z"/>
        <circle cx="9" cy="12" r="3"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    )}
  </svg>
);

const CheckIcon = () => (
  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
    <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Animated Canvas Background ───────────────────────────────────────────────
function ParticleCanvas({ hue }: { hue: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<any[]>([]);
  const hueRef = useRef(hue);

  useEffect(() => { hueRef.current = hue; }, [hue]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const count = 80;
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.2 + 0.4,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      opacity: Math.random() * 0.6 + 0.15,
      hueOffset: Math.floor(Math.random() * 120),
      pulseOffset: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    const draw = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#060608');
      bg.addColorStop(0.5, `hsla(${hueRef.current}, 20%, 4%, 1)`);
      bg.addColorStop(1, '#080610');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const g1 = ctx.createRadialGradient(w * 0.7, h * 0.25, 0, w * 0.7, h * 0.25, w * 0.45);
      g1.addColorStop(0, `hsla(${hueRef.current}, 80%, 55%, 0.18)`);
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const g2 = ctx.createRadialGradient(w * 0.15, h * 0.8, 0, w * 0.15, h * 0.8, w * 0.35);
      g2.addColorStop(0, `hsla(${(hueRef.current + 60) % 360}, 80%, 55%, 0.14)`);
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = `rgba(255,255,255,0.025)`;
      ctx.lineWidth = 0.5;
      const gridSize = 52;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      const pts = particlesRef.current;
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.02 + p.pulseOffset);
        const pHue = (hueRef.current + p.hueOffset) % 360;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.8 + 0.4 * pulse), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${pHue}, 75%, 65%, ${p.opacity * pulse})`;
        ctx.fill();
      });

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.12;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `hsla(${hueRef.current}, 70%, 65%, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      const rings = 3;
      for (let ri = 0; ri < rings; ri++) {
        const cx = w * (0.3 + ri * 0.2);
        const cy = h * (0.4 + Math.sin(t * 0.008 + ri * 1.8) * 0.15);
        const radius = 60 + ri * 35 + Math.sin(t * 0.01 + ri) * 8;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${(hueRef.current + ri * 50) % 360}, 70%, 55%, ${0.06 - ri * 0.01})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      t++;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}

// ─── Right Panel ──────────────────────────────────────────────────────────────
function RightPanel({ hue }: { hue: number }) {
  return (
    <div className="fdx-right" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <ParticleCanvas hue={hue} />
      <video
        src="/videos/login-bg.mp4"
        autoPlay muted loop playsInline
        onCanPlay={e => { (e.currentTarget as HTMLVideoElement).style.opacity = '1'; }}
        onError={e => { (e.currentTarget as HTMLVideoElement).style.display = 'none'; }}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 5,
          opacity: 0, transition: 'opacity 1.2s ease',
        }}
      />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 6,
        background: `hsl(${hue}, 80%, 45%)`,
        mixBlendMode: 'color', opacity: 0.16,
        transition: 'background 1s ease', pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', inset: 0, zIndex: 7,
        background: 'linear-gradient(to right, rgba(0,0,0,0.25) 0%, transparent 40%)',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', bottom: 28, right: 32, zIndex: 8,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.18)', fontWeight: 500,
        pointerEvents: 'none',
      }}>
        NSC by SKR
      </div>
      <div style={{
        position: 'absolute', inset: 0, zIndex: 8,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(22px, 2.4vw, 34px)',
          fontWeight: 700, fontStyle: 'italic',
          color: 'rgba(255,255,255,0.12)',
          letterSpacing: 1, textAlign: 'center', lineHeight: 1.4,
        }}>
          Restaurant Intelligence,<br/>Elevated.
        </div>
      </div>
    </div>
  );
}

// ─── Main Login Component ──────────────────────────────────────────────────────
export default function Login() {
  const [, navigate] = useLocation();
  const { loginWithGoogle, isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) navigate('/');
  }, [isLoggedIn, navigate]);

  const googleLogin = () => {
    void loginWithGoogle().catch(() => {
      setBtnShake(true);
      setBtnState('idle');
      setTimeout(() => setBtnShake(false), 400);
    });
  };

  const [hue, setHue] = useState(DEFAULT_HUE);
  const [autoShift] = useState(DEFAULT_AUTO_SHIFT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [btnState, setBtnState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [btnShake, setBtnShake] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const animRef = useRef<number>(0);
  const hueRef = useRef(DEFAULT_HUE);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!document.getElementById('foodix-fonts')) {
      const link = document.createElement('link');
      link.id = 'foodix-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@300;400;500;600&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const animateHue = useCallback((ts: number) => {
    if (autoShift) {
      const delta = ts - lastTimeRef.current;
      if (delta > 16) {
        hueRef.current = (hueRef.current + 0.05) % 360;
        setHue(Math.round(hueRef.current));
        lastTimeRef.current = ts;
      }
    }
    animRef.current = requestAnimationFrame(animateHue);
  }, [autoShift]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(animateHue);
    return () => cancelAnimationFrame(animRef.current);
  }, [animateHue]);

  const handleSignIn = () => {
    if (!email || !password) {
      setBtnShake(true);
      setTimeout(() => setBtnShake(false), 400);
      return;
    }
    googleLogin();
  };

  const s = createStyles(hue);
  const btnLabel =
    btnState === 'loading' ? 'Signing in…' :
    btnState === 'success' ? '✓ Welcome back!' : 'Sign In';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes login-bg-anim {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .fdx-body {
          font-family: 'DM Sans', sans-serif;
          background: linear-gradient(135deg, #0a0e1a, #081218, #100a18, #0e0a12, #0a0e1a);
          background-size: 400% 400%;
          animation: login-bg-anim 18s ease infinite;
          min-height: 100dvh;
          width: 100%;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: auto;
        }

        .fdx-shell {
          width: min(1500px, 100%);
          height: min(1060px, calc(100dvh - 24px));
          min-height: min(600px, calc(100dvh - 24px));
          border-radius: 24px;
          overflow: hidden;
          display: flex;
          box-shadow: 0 40px 100px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06);
          position: relative;
        }

        .fdx-left {
          width: clamp(400px, 34vw, 500px);
          min-width: 0;
          background: var(--login-bg);
          color: var(--login-text);
          padding: clamp(28px, 3.2vw, 52px) clamp(26px, 3vw, 48px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 22px;
          position: relative;
          z-index: 2;
          flex-shrink: 0;
          overflow-y: auto;
          scrollbar-width: thin;
        }

        .fdx-right { min-width: 0; min-height: 0; }

        .fdx-left::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 4px;
          background: ${s.stripGradient};
          border-radius: 4px 0 0 4px;
          transition: background 1s ease;
        }

        .fdx-input:focus { border-color: ${s.accent} !important; box-shadow: 0 0 0 3px ${s.accentFocus} !important; outline: none; }
        .fdx-input::placeholder { color: #bbb; }
        .fdx-eye:hover { color: ${s.accent} !important; }
        .fdx-forgot:hover { color: ${s.accent} !important; }
        .fdx-btn-google:hover { border-color: ${s.accent} !important; box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important; transform: translateY(-1px) !important; }
        .fdx-btn-signin:hover:not(:disabled) { transform: translateY(-2px) !important; box-shadow: 0 10px 28px ${s.accentShadowHover} !important; }
        .fdx-btn-signin:active:not(:disabled) { transform: translateY(0) !important; }
        .fdx-left h1, .fdx-left h1 em, .fdx-left p { overflow-wrap: anywhere; }

        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        @keyframes loadBar { from{width:0} to{width:100%} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        .shake { animation: shake 0.35s ease; }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fdx-fadein { animation: fadeInUp 0.55s ease forwards; }
        .fdx-fadein-d1 { animation-delay: 0.05s; opacity: 0; }
        .fdx-fadein-d2 { animation-delay: 0.12s; opacity: 0; }
        .fdx-fadein-d3 { animation-delay: 0.20s; opacity: 0; }
        .fdx-fadein-d4 { animation-delay: 0.28s; opacity: 0; }
        .fdx-fadein-d5 { animation-delay: 0.36s; opacity: 0; }

        @media (max-height: 820px) and (min-width: 1025px) {
          .fdx-left { justify-content: flex-start; gap: 12px; padding-top: 26px; padding-bottom: 22px; }
          .fdx-left h1 { font-size: clamp(27px, 2.15vw, 32px) !important; line-height: 1.12 !important; margin-bottom: 6px !important; }
          .fdx-left p { font-size: 12px !important; line-height: 1.55 !important; }
          .fdx-fadein-d1 { font-size: 14px !important; }
          .fdx-fadein-d3 { gap: 8px !important; }
          .fdx-btn-signin { margin-top: 4px !important; padding: 12px !important; }
          .fdx-btn-google { padding: 10px !important; }
          .fdx-register-link { display: none; }
          .fdx-fadein-d5 { display: none; }
        }
        @media (max-height: 760px) and (min-width: 1025px) {
          .fdx-left { gap: 10px; padding-top: 22px; padding-bottom: 18px; }
          .fdx-left h1 { font-size: clamp(25px, 2vw, 30px) !important; }
          .fdx-left p { font-size: 12px !important; line-height: 1.45 !important; }
        }

        @media (max-width: 1024px) {
          .fdx-body { align-items: flex-start; padding: 8px; }
          .fdx-shell { width: 100%; height: calc(100dvh - 16px); min-height: calc(100dvh - 16px); flex-direction: column; border-radius: 20px; }
          .fdx-right { order: 1; flex: 0 0 clamp(200px, 32dvh, 320px) !important; width: 100%; min-height: 200px; }
          .fdx-left { order: 2; width: 100%; padding: 28px 32px; justify-content: flex-start; gap: 20px; overflow: visible; }
          .fdx-left::before { top: 0; right: 0; bottom: auto; width: auto; height: 4px; border-radius: 0; }
          .fdx-left h1 { font-size: clamp(28px, 5vw, 40px) !important; }
          .fdx-left p { max-width: 100% !important; }
        }

        @media (max-width: 640px) {
          .fdx-body { padding: 0; align-items: stretch; }
          .fdx-shell { width: 100%; height: 100dvh; min-height: 100dvh; border-radius: 0; box-shadow: none; }
          .fdx-right { flex-basis: clamp(140px, 25dvh, 220px) !important; min-height: 140px; }
          .fdx-left { padding: 22px 18px 18px; gap: 16px; }
          .fdx-left h1 { font-size: clamp(22px, 7.5vw, 30px) !important; line-height: 1.12 !important; margin-bottom: 8px !important; }
          .fdx-left p { font-size: 13px !important; line-height: 1.7 !important; }
          .fdx-input { min-height: 48px; font-size: 16px !important; }
          .fdx-btn-signin, .fdx-btn-google { min-height: 48px; }
          .fdx-forgot { margin-left: auto; }
        }
      `}</style>

      {/* Loading screen */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200, background: '#0a0a10',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'opacity 0.7s ease', opacity: loaded ? 0 : 1,
        pointerEvents: loaded ? 'none' : 'all',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 24, letterSpacing: 5, color: '#fff', fontWeight: 600 }}>
            STR<span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: s.accent, verticalAlign: 'middle', margin: '0 2px', transition: 'background 1s' }}/>KE
          </div>
          <div style={{ width: 160, height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: s.accent, borderRadius: 2, animation: 'loadBar 1.1s ease forwards', transition: 'background 1s' }}/>
          </div>
        </div>
      </div>

      <div className="fdx-body">
        <div className="fdx-shell">

          {/* ════ LEFT PANEL ════ */}
          <div className="fdx-left">
            {/* Logo */}
            <div className="fdx-fadein fdx-fadein-d1" style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 17, letterSpacing: 3, color: TEXT_COLORS.logo, textTransform: 'uppercase' }}>
              STR<span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', background: 'var(--primary)', margin: '0 2px', verticalAlign: 'middle', transition: 'background 1s' }}/>KE
            </div>

            {/* Hero */}
            <div className="fdx-fadein fdx-fadein-d2">
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 2.8vw, 40px)', fontWeight: 700, lineHeight: 1.25, color: TEXT_COLORS.heading, marginBottom: 10 }}>
                ฟื้นฟูสมอง<br/>{' '} ฟื้นฟูการเคลื่อนไหว<br/>{' '}
                <em style={{ fontStyle: 'italic', color: TEXT_COLORS.tagline === 'auto' ? s.accent : TEXT_COLORS.tagline, transition: 'color 1s ease' }}>เริ่มต้นทุกวัน เพื่อการพัฒนาที่ดีขึ้น</em>
              </h1>
              <p style={{ fontSize: 20, color: TEXT_COLORS.description, lineHeight: 2, maxWidth: 360 }}>
                ช่วยให้การฟื้นฟูเป็นเรื่องง่าย สนุกกับเกมฝึกกายภาพ และติดตามพัฒนาการได้ทุกวัน
              </p>
            </div>

            {/* Form */}
            <div className="fdx-fadein fdx-fadein-d3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                className="fdx-input"
                type="email"
                placeholder="@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                style={{ width: '100%', padding: '14px 16px', fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: 'var(--foreground)', background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 10, outline: 'none', transition: 'border-color 0.25s, box-shadow 0.25s' }}
              />

              <div style={{ position: 'relative' }}>
                <input
                  className="fdx-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ width: '100%', padding: '14px 44px 14px 16px', fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: 'var(--foreground)', background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 10, outline: 'none', transition: 'border-color 0.25s, box-shadow 0.25s' }}
                />
                <button className="fdx-eye" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', display: 'flex', alignItems: 'center', transition: 'color 0.2s', padding: 0 }} aria-label="Toggle password">
                  <EyeIcon open={!showPw}/>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#888', cursor: 'pointer', userSelect: 'none' }} onClick={() => setRemember(r => !r)}>
                  <div style={{ width: 17, height: 17, borderRadius: 5, border: `1.5px solid ${remember ? "var(--login-primary)" : '#e0deda'}`, background: remember ? "var(--login-primary)" : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s, border-color 0.2s', flexShrink: 0 }}>
                    {remember && <CheckIcon/>}
                  </div>
                  Remember me
                </label>
                <a href="#" className="fdx-forgot" style={{ fontSize: 13, color: '#888', textDecoration: 'none', transition: 'color 0.2s' }}>ลืมรหัสผ่าน?</a>
              </div>

              <button
                className={`fdx-btn-signin ${btnShake ? 'shake' : ''}`}
                onClick={handleSignIn}
                disabled={btnState !== 'idle'}
                style={{ marginTop: 8, width: '100%', padding: 14, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: 0.5, color: '#fff', background: "var(--login-primary)", border: 'none', borderRadius: 10, cursor: btnState !== 'idle' ? 'default' : 'pointer', transition: 'background 1s ease, box-shadow 0.2s, transform 0.15s' }}
              >
                {btnLabel}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0', color: '#bbb', fontSize: 12 }}>
                <div style={{ flex: 1, height: 1, background: '#e0deda' }}/> or <div style={{ flex: 1, height: 1, background: '#e0deda' }}/>
              </div>

              <button
                className="fdx-btn-google"
                onClick={() => googleLogin()}
                style={{ width: '100%', padding: 12, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 500, color: '#1a1a1a', background: '#fff', border: '1.5px solid #e0deda', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
              >
                <GoogleIcon/> เข้าสู่ระบบด้วย Google
              </button>

              <div className="fdx-register-link" style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
                Don't have an account?{' '}
                <a href="#" style={{ color: s.accent, fontWeight: 500, textDecoration: 'none', transition: 'color 1s' }}>สมัครสมาชิก</a>
              </div>
            </div>

            {/* Copyright */}
            <div className="fdx-fadein fdx-fadein-d5" style={{ fontSize: 11, color: '#ccc', lineHeight: 1.6 }}>
              NSC © 2026 BY SKR.<br/>ผลงานสำหรับNSC 2026
            </div>
          </div>

          {/* ════ RIGHT PANEL ════ */}
          <RightPanel hue={hue} />

        </div>
      </div>
    </>
  );
}