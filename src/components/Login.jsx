import { useState } from 'react';
import { login, register, errorMessage } from '../api.js';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setNotice(''); setBusy(true);
    try {
      if (mode === 'register') {
        await register(form);
        setNotice('Account created. You can now Log in.');
        setMode('login');
      } else {
        onLogin(await login(form.username, form.password));
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setError('');
    setNotice('');
    setMode(mode === 'login' ? 'register' : 'login');
  };

  return (
    <main className="auth-layout">
      <section className="auth-visual" aria-label="Stockroom warehouse">
        <a className="brand-lockup" href="#" aria-label="Stockroom home">
          <span className="brand-mark">s</span>
          <span><strong>stockroom</strong><small>PRODUCT DESK</small></span>
        </a>
        <div className="visual-caption">
          <p>YOUR INVENTORY, IN FOCUS</p>
          <h2>Good decisions start with a clear picture.</h2>
          <span />
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <p className="auth-eyebrow">STOCKROOM / ACCOUNT</p>
          <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="auth-subtitle">{mode === 'login' ? 'Sign in to view and manage your product catalog.' : 'Register for a read-only product catalog account.'}</p>

          {error && <div className="alert error" role="alert">{error}</div>}
          {notice && <div className="alert success" role="status">{notice}</div>}

          <form className="auth-form" onSubmit={submit}>
            <label>Username
              <input autoComplete="username" placeholder="Your username" value={form.username} onChange={set('username')} required autoFocus />
            </label>
            {mode === 'register' && (
              <label>Email address
                <input type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
              </label>
            )}
            <label>Password
              <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Enter your password" value={form.password} onChange={set('password')} required minLength={6} />
            </label>
            <button className="auth-submit" disabled={busy}><span aria-hidden="true">↗</span>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
          </form>

          <p className="auth-switch">{mode === 'login' ? 'No account yet? ' : 'Already registered? '}<button type="button" onClick={switchMode}>{mode === 'login' ? 'Register' : 'Sign in'}</button></p>
          <p className="auth-foot">PRODUCT CATALOG <span aria-hidden="true">·</span> INVENTORY WORKSPACE</p>
        </div>
      </section>
    </main>
  );
}
