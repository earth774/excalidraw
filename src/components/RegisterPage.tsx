import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      setLoading(false);
      return;
    }

    const { error } = await signUp(email.trim(), password);

    if (error) {
      setError(error.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
      setLoading(false);
    } else {
      // On successful signup, Supabase may require email confirmation
      // For now, we'll redirect to home. If email confirmation is enabled,
      // you may want to show a message instead.
      navigate('/');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">
          <span className="auth-emoji">✨</span>
          สมัครสมาชิก
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
              placeholder="อย่างน้อย 6 ตัวอักษร"
              className="auth-input"
              disabled={loading}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="confirmPassword" className="auth-label">
              ยืนยันรหัสผ่าน
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="กรุณากรอกรหัสผ่านอีกครั้ง"
              className="auth-input"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim() || !confirmPassword.trim()}
            className="auth-submit-btn"
          >
            {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
          </button>
        </form>
        <div className="auth-footer">
          <p>
            มีบัญชีอยู่แล้ว?{' '}
            <Link to="/login" className="auth-link">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

