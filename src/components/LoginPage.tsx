import { useState, FormEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      setLoading(false);
      return;
    }

    const { error } = await signIn(email.trim(), password);

    if (error) {
      setError(error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      setLoading(false);
    } else {
      // Redirect to the intended page or home
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">
          <span className="auth-emoji">🔐</span>
          เข้าสู่ระบบ
        </h1>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="auth-field">
            <label htmlFor="email" className="auth-label">
              อีเมล
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="auth-input"
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="auth-field">
            <label htmlFor="password" className="auth-label">
              รหัสผ่าน
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="auth-input"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="auth-submit-btn"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
        <div className="auth-footer">
          <p>
            ยังไม่มีบัญชี?{' '}
            <Link to="/register" className="auth-link">
              สมัครสมาชิก
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

