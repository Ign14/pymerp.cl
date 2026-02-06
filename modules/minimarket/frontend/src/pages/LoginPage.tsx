import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loginWithFirestore,
  getSession,
  setStoredToken,
  isWelcomeDone,
  setWelcomeDone,
} from '../auth';
import WelcomeOverlay from './WelcomeOverlay';
import LogoModal from './LogoModal';

const API_BASE = import.meta.env.VITE_MINIMARKET_API || 'http://localhost:8088';
const USE_FIRESTORE = Boolean(import.meta.env.VITE_MINIMARKET_USE_FIRESTORE);

type Stage = 'form' | 'welcome' | 'logo' | 'done';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('form');

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      if (USE_FIRESTORE) {
        const session = await loginWithFirestore(email.trim(), password);
        if (!session) {
          setError('Credenciales inválidas');
          setLoading(false);
          return;
        }
        const welcomeDone = isWelcomeDone(session.userId);
        if (welcomeDone) {
          navigate('/minimarketerp', { replace: true });
          return;
        }
        setStage('welcome');
      } else {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        if (!response.ok) {
          setError('Credenciales inválidas');
          setLoading(false);
          return;
        }
        const data = await response.json();
        setStoredToken(data.token);
        const session = getSession();
        const userId = session?.userId ?? data.userId ?? email;
        const welcomeDone = isWelcomeDone(userId);
        if (welcomeDone) {
          navigate('/minimarketerp', { replace: true });
          return;
        }
        setStage('welcome');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    setStage('logo');
  };

  const handleLogoClose = () => {
    const session = getSession();
    const userId = session?.userId ?? email;
    setWelcomeDone(userId);
    setStage('done');
    navigate('/minimarketerp', { replace: true });
  };

  const handleStart = () => {
    const session = getSession();
    const userId = session?.userId ?? email;
    setWelcomeDone(userId);
    setStage('done');
    navigate('/minimarketerp', { replace: true });
  };

  if (stage === 'welcome') {
    return <WelcomeOverlay onContinue={handleContinue} />;
  }

  if (stage === 'logo') {
    return <LogoModal onClose={handleLogoClose} onStart={handleStart} />;
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-hero">
          <span className="kicker">Minimarket ERP</span>
          <h1>Acceso a operación</h1>
          <p>Ingresa con tu correo y contraseña. Las cuentas se gestionan desde el panel admin.</p>
        </div>

        <form className="login-card" onSubmit={handleSubmit}>
          <label>
            Correo
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@empresa.com"
              autoComplete="email"
              disabled={loading}
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
            />
          </label>
          <button
            type="submit"
            className="primary"
            disabled={!canSubmit}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
          {error && (
            <span className="status error" role="alert">
              {error}
            </span>
          )}
        </form>
      </div>
    </div>
  );
}
