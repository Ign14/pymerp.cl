type LogoModalProps = {
  onClose: () => void;
  onStart: () => void;
};

export default function LogoModal({ onClose, onStart }: LogoModalProps) {
  return (
    <div className="logo-modal-overlay">
      <div className="logo-modal-card">
        <button
          type="button"
          className="logo-modal-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>
        <div className="logo-modal-mark">
          <span className="logo-modal-kicker">PyM-ERP</span>
          <strong className="logo-modal-brand">Minimarket</strong>
        </div>
        <button type="button" className="logo-modal-start" onClick={onStart}>
          Comenzar
        </button>
      </div>
    </div>
  );
}
