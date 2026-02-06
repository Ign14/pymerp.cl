import { useState, useEffect } from 'react';

type WelcomeOverlayProps = {
  onContinue: () => void;
};

/** Overlay de bienvenida con puntero/spotlight animado (2-3 movimientos). */
export default function WelcomeOverlay({ onContinue }: WelcomeOverlayProps) {
  const [pointer, setPointer] = useState({ x: 50, y: 50 });
  const [step, setStep] = useState(0);

  useEffect(() => {
    const steps = [
      { x: 30, y: 40 },
      { x: 70, y: 35 },
      { x: 50, y: 55 },
    ];
    const t = setInterval(() => {
      setStep((s) => {
        const next = s + 1;
        if (next <= steps.length) {
          setPointer(steps[next - 1] ?? steps[0]);
          return next;
        }
        clearInterval(t);
        return s;
      });
    }, 800);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="welcome-overlay"
      style={{
        ['--pointer-x' as string]: `${pointer.x}%`,
        ['--pointer-y' as string]: `${pointer.y}%`,
      }}
    >
      <div className="welcome-overlay-backdrop" />
      <div className="welcome-overlay-card">
        <div className="welcome-overlay-spotlight" />
        <h2 className="welcome-overlay-title">Bienvenido a Minimarket ERP</h2>
        <p className="welcome-overlay-sub">Tu panel de operación listo para usar.</p>
        <button type="button" className="welcome-overlay-btn" onClick={onContinue}>
          Continuar
        </button>
      </div>
    </div>
  );
}
