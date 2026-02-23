'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => setPhase(4), 2200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Montserrat:wght@300;400;500;600;700&display=swap');

        .mp-landing {
          min-height: 100vh;
          background: #001220;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 2rem;
        }

        .mp-landing * {
          box-sizing: border-box;
        }

        .mp-bg-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 800px;
          height: 800px;
          background: radial-gradient(ellipse at center, rgba(212,175,55,0.06) 0%, rgba(212,175,55,0.02) 40%, transparent 70%);
          animation: mp-pulse 8s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes mp-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.7; }
        }

        .mp-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: #D4AF37;
          border-radius: 50%;
          opacity: 0;
          animation: mp-float 6s ease-in-out infinite;
        }

        @keyframes mp-float {
          0% { opacity: 0; transform: translateY(0) scale(0); }
          20% { opacity: 0.6; transform: translateY(-20px) scale(1); }
          80% { opacity: 0.3; transform: translateY(-80px) scale(0.5); }
          100% { opacity: 0; transform: translateY(-120px) scale(0); }
        }

        .mp-content {
          position: relative;
          z-index: 10;
          text-align: center;
          max-width: 600px;
        }

        .mp-logo-wrap {
          display: inline-block;
          position: relative;
          opacity: 0;
          transform: scale(0.8);
          transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mp-logo-wrap.active {
          opacity: 1;
          transform: scale(1);
        }

        .mp-logo-ring {
          position: absolute;
          inset: -20px;
          border: 1px solid rgba(212,175,55,0.15);
          border-radius: 50%;
          animation: mp-ring-rotate 20s linear infinite;
        }
        .mp-logo-ring::after {
          content: '';
          position: absolute;
          top: -2px;
          left: 50%;
          width: 4px;
          height: 4px;
          background: #D4AF37;
          border-radius: 50%;
        }

        @keyframes mp-ring-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .mp-title {
          margin-top: 3rem;
          opacity: 0;
          transform: translateY(20px);
          transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mp-title.active {
          opacity: 1;
          transform: translateY(0);
        }

        .mp-title h1 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: 3.5rem;
          color: #ffffff;
          letter-spacing: 0.02em;
          line-height: 1.1;
          margin: 0;
        }

        .mp-title h1 span {
          color: #D4AF37;
          font-weight: 400;
        }

        .mp-divider {
          margin: 1.8rem auto;
          height: 1px;
          background: linear-gradient(90deg, transparent, #D4AF37, transparent);
          transition: all 1.5s ease;
          width: 0;
          opacity: 0;
        }
        .mp-divider.active {
          width: 200px;
          opacity: 1;
        }

        .mp-subtitle {
          opacity: 0;
          transform: translateY(15px);
          transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mp-subtitle.active {
          opacity: 1;
          transform: translateY(0);
        }

        .mp-subtitle p {
          font-family: 'Montserrat', sans-serif;
          font-weight: 400;
          font-size: 0.65rem;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: rgba(212,175,55,0.7);
          margin: 0 0 1.5rem 0;
        }

        .mp-subtitle .mp-desc {
          font-family: 'Montserrat', sans-serif;
          font-weight: 300;
          font-size: 0.9rem;
          color: rgba(255,255,255,0.9);
          line-height: 1.8;
          letter-spacing: 0.02em;
          max-width: 440px;
          margin: 0 auto;
        }

        .mp-cta-area {
          margin-top: 3rem;
          opacity: 0;
          transform: translateY(15px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mp-cta-area.active {
          opacity: 1;
          transform: translateY(0);
        }

        .mp-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: transparent;
          border: 1px solid rgba(212,175,55,0.3);
          color: #D4AF37;
          padding: 16px 40px;
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
          font-size: 0.6rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }

        .mp-cta-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.05));
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .mp-cta-btn:hover {
          border-color: #D4AF37;
          box-shadow: 0 0 30px rgba(212,175,55,0.15), inset 0 0 30px rgba(212,175,55,0.05);
          transform: translateY(-2px);
        }

        .mp-cta-btn:hover::before {
          opacity: 1;
        }

        .mp-cta-btn:hover .mp-arrow {
          transform: translateX(4px);
        }

        .mp-arrow {
          transition: transform 0.3s ease;
          position: relative;
          z-index: 1;
        }

        .mp-cta-btn span {
          position: relative;
          z-index: 1;
        }

        .mp-footer {
          position: absolute;
          bottom: 2rem;
          text-align: center;
          opacity: 0;
          transition: opacity 1s ease;
        }
        .mp-footer.active {
          opacity: 1;
        }

        .mp-footer p {
          font-family: 'Montserrat', sans-serif;
          font-weight: 400;
          font-size: 0.5rem;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.15);
          margin: 0;
        }

        .mp-corner {
          position: absolute;
          width: 60px;
          height: 60px;
          opacity: 0;
          transition: opacity 1.5s ease;
        }
        .mp-corner.active { opacity: 1; }

        .mp-corner-tl { top: 2rem; left: 2rem; border-top: 1px solid rgba(212,175,55,0.15); border-left: 1px solid rgba(212,175,55,0.15); }
        .mp-corner-tr { top: 2rem; right: 2rem; border-top: 1px solid rgba(212,175,55,0.15); border-right: 1px solid rgba(212,175,55,0.15); }
        .mp-corner-bl { bottom: 2rem; left: 2rem; border-bottom: 1px solid rgba(212,175,55,0.15); border-left: 1px solid rgba(212,175,55,0.15); }
        .mp-corner-br { bottom: 2rem; right: 2rem; border-bottom: 1px solid rgba(212,175,55,0.15); border-right: 1px solid rgba(212,175,55,0.15); }

        @media (max-width: 640px) {
          .mp-title h1 { font-size: 2.4rem; }
          .mp-cta-btn { padding: 14px 28px; }
          .mp-corner { display: none; }
        }
      `}</style>

      <div className="mp-landing">
        <div className="mp-bg-glow" />

        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="mp-particle"
            style={{
              left: `${15 + i * 10}%`,
              top: `${40 + (i % 3) * 15}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${5 + i * 0.5}s`,
            }}
          />
        ))}

        <div className={`mp-corner mp-corner-tl ${phase >= 3 ? 'active' : ''}`} />
        <div className={`mp-corner mp-corner-tr ${phase >= 3 ? 'active' : ''}`} />
        <div className={`mp-corner mp-corner-bl ${phase >= 3 ? 'active' : ''}`} />
        <div className={`mp-corner mp-corner-br ${phase >= 3 ? 'active' : ''}`} />

        <div className="mp-content">
          <div className={`mp-logo-wrap ${phase >= 1 ? 'active' : ''}`}>
            <div className="mp-logo-ring" />
            <Image
              src="/icon.webp"
              alt="Minerva Partners"
              width={90}
              height={90}
              priority
              style={{ position: 'relative', zIndex: 2 }}
            />
          </div>

          <div className={`mp-title ${phase >= 2 ? 'active' : ''}`}>
            <h1>Minerva <span>Partners</span></h1>
          </div>

          <div className={`mp-divider ${phase >= 2 ? 'active' : ''}`} />

          <div className={`mp-subtitle ${phase >= 3 ? 'active' : ''}`}>
            <p>Private Investment Marketplace</p>
            <p className="mp-desc">
              Un ecosistema esclusivo per investitori qualificati.
              Deal riservati, due diligence protetta, accesso su invito.
            </p>
          </div>

          <div className={`mp-cta-area ${phase >= 4 ? 'active' : ''}`}>
            <button className="mp-cta-btn" onClick={() => router.push('/login')}>
              <span>Accedi al Portale</span>
              <svg className="mp-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className={`mp-footer ${phase >= 4 ? 'active' : ''}`}>
          <p>&copy; 2026 Minerva Partners &bull; Private &amp; Confidential</p>
        </div>
      </div>
    </>
  );
}
