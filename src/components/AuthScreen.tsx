import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AuthScreen.css';

export default function AuthScreen() {
  const { signIn, signUp, signInWithGoogle, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
    } catch {
      // Error is handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {
      // Error is handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    clearError();
    setPassword('');
  };

  return (
    <div className="auth-screen">
      {/* Animated background particles */}
      <div className="auth-bg-particles">
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
        <div className="particle particle-4" />
        <div className="particle particle-5" />
      </div>

      <div className="auth-container animate-fade-in">
        {/* Logo / Brand */}
        <div className="auth-brand">
          <div className="auth-logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5Z" />
              <path d="m2 17 10 5 10-5" />
              <path d="m2 12 10 5 10-5" />
            </svg>
          </div>
          <h1 className="auth-title">CyberVault</h1>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Welcome back. Access your secure vault.'
              : 'Create your secure personal space.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="auth-card glass-panel">
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Mode tabs */}
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => toggleMode()}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => toggleMode()}
              >
                Register
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="auth-error animate-fade-in">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Display name field (register only) */}
            {mode === 'register' && (
              <div className="auth-field animate-fade-in">
                <label className="auth-label" htmlFor="auth-name">Full Name</label>
                <div className="auth-input-wrapper">
                  <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="auth-name"
                    type="text"
                    className="auth-input"
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-email">Email Address</label>
              <div className="auth-input-wrapper">
                <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  id="auth-email"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-password">Password</label>
              <div className="auth-input-wrapper">
                <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="auth-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password strength indicator (register only) */}
              {mode === 'register' && password.length > 0 && (
                <div className="password-strength animate-fade-in">
                  <div className="strength-bars">
                    <div className={`strength-bar ${passwordStrength >= 1 ? `strength-${passwordStrength}` : ''}`} />
                    <div className={`strength-bar ${passwordStrength >= 2 ? `strength-${passwordStrength}` : ''}`} />
                    <div className={`strength-bar ${passwordStrength >= 3 ? `strength-${passwordStrength}` : ''}`} />
                    <div className={`strength-bar ${passwordStrength >= 4 ? `strength-${passwordStrength}` : ''}`} />
                  </div>
                  <span className={`strength-text strength-text-${passwordStrength}`}>
                    {['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength]}
                  </span>
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="auth-submit btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <span className="auth-spinner" />
              ) : mode === 'login' ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Sign In
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogleSignIn}
            disabled={submitting}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>

        {/* Footer */}
        <p className="auth-footer">
          Your documents are stored securely in your vault.
          <br />
          <span className="auth-privacy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Privacy-first. Always.
          </span>
        </p>
      </div>
    </div>
  );
}

function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}
