"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Invalid credentials. Please try again.");
        setShakeKey((k) => k + 1);
      }
    } catch {
      setError("Network error. Please try again.");
      setShakeKey((k) => k + 1);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="login-shell">
      {/* Animated orbs background */}
      <div className="login-orb login-orb-1" aria-hidden="true" />
      <div className="login-orb login-orb-2" aria-hidden="true" />
      <div className="login-orb login-orb-3" aria-hidden="true" />

      <div className="login-card" key={shakeKey} style={{ animation: error ? "shake 0.45s ease" : undefined }}>
        {/* Logo lockup */}
        <div className="login-brand">
          <div className="login-brand-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L25 8V20L14 26L3 20V8L14 2Z" fill="url(#hexGrad)" />
              <path d="M14 7L10 10V15L14 18L18 15V10L14 7Z" fill="white" fillOpacity="0.9" />
              <defs>
                <linearGradient id="hexGrad" x1="3" y1="2" x2="25" y2="26" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0f766e" />
                  <stop offset="1" stopColor="#065f46" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 className="login-title">Falcon AI</h1>
            <p className="login-subtitle">Lead generation command center</p>
          </div>
        </div>

        <div className="login-divider" aria-hidden="true" />

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="login-field-group">
            <label className="login-label" htmlFor="login-username">
              Username
            </label>
            <div className="login-input-wrap">
              <span className="login-input-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                id="login-username"
                type="text"
                className="login-input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="login-field-group">
            <label className="login-label" htmlFor="login-password">
              Password
            </label>
            <div className="login-input-wrap">
              <span className="login-input-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="login-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isLoading || !username || !password}
            id="login-submit"
          >
            {isLoading ? (
              <>
                <span className="login-spinner" aria-hidden="true" />
                Authenticating…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Sign in to Command Center
              </>
            )}
          </button>
        </form>

        <p className="login-footer">
          Secured by Falcon AI · All sessions are encrypted
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .login-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #040a0f;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          padding: 1.5rem;
        }

        .login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          will-change: transform;
        }

        .login-orb-1 {
          width: 520px;
          height: 520px;
          top: -180px;
          left: -160px;
          background: radial-gradient(circle, rgba(15, 118, 110, 0.35) 0%, transparent 70%);
          animation: orbFloat 12s ease-in-out infinite;
        }

        .login-orb-2 {
          width: 420px;
          height: 420px;
          bottom: -120px;
          right: -100px;
          background: radial-gradient(circle, rgba(6, 95, 70, 0.3) 0%, transparent 70%);
          animation: orbFloat 16s ease-in-out infinite reverse;
        }

        .login-orb-3 {
          width: 280px;
          height: 280px;
          top: 50%;
          left: 55%;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
          animation: orbFloat 20s ease-in-out infinite 4s;
        }

        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -25px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.97); }
        }

        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 2.5rem 2.25rem;
          box-shadow:
            0 0 0 1px rgba(16, 185, 129, 0.08),
            0 32px 80px rgba(0, 0, 0, 0.6),
            0 0 80px rgba(15, 118, 110, 0.08) inset;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(7px); }
          45% { transform: translateX(-5px); }
          60% { transform: translateX(4px); }
          75% { transform: translateX(-2px); }
        }

        .login-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 1.75rem;
        }

        .login-brand-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 118, 110, 0.1));
          border: 1px solid rgba(16, 185, 129, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.12);
          flex-shrink: 0;
        }

        .login-title {
          margin: 0 0 2px;
          font-size: 1.5rem;
          font-weight: 800;
          color: #f0fdf4;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .login-subtitle {
          margin: 0;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 400;
          letter-spacing: 0;
        }

        .login-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
          margin-bottom: 1.75rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        .login-field-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .login-label {
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.55);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon {
          position: absolute;
          left: 13px;
          color: rgba(255, 255, 255, 0.25);
          display: flex;
          align-items: center;
          pointer-events: none;
          z-index: 1;
        }

        .login-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 0.7rem 2.8rem 0.7rem 2.5rem;
          color: #f0fdf4;
          font-size: 0.92rem;
          font-weight: 500;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          outline: none;
        }

        .login-input::placeholder {
          color: rgba(255, 255, 255, 0.2);
          font-weight: 400;
        }

        .login-input:focus {
          border-color: rgba(16, 185, 129, 0.5);
          background: rgba(16, 185, 129, 0.05);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .login-eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          padding: 4px;
          color: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          border-radius: 4px;
          transition: color 0.15s;
          z-index: 1;
        }

        .login-eye-btn:hover {
          color: rgba(255, 255, 255, 0.7);
        }

        .login-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          padding: 0.65rem 0.9rem;
          font-size: 0.83rem;
          color: #fca5a5;
          font-weight: 500;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          width: 100%;
          padding: 0.8rem 1.5rem;
          margin-top: 0.4rem;
          background: linear-gradient(135deg, #059669, #0f766e);
          border: none;
          border-radius: 11px;
          color: #fff;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.25), 0 0 0 1px rgba(16, 185, 129, 0.15);
          position: relative;
          overflow: hidden;
        }

        .login-submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
          border-radius: inherit;
        }

        .login-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(16, 185, 129, 0.35), 0 0 0 1px rgba(16, 185, 129, 0.25);
        }

        .login-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-submit-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .login-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
          flex-shrink: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-footer {
          margin: 1.5rem 0 0;
          text-align: center;
          font-size: 0.73rem;
          color: rgba(255, 255, 255, 0.2);
          letter-spacing: 0.01em;
        }
      `}</style>
    </div>
  );
}
