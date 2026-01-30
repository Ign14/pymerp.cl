import { useState } from 'react';
import AnimatedModal from '../../../components/animations/AnimatedModal';

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderCode: string;
  trackingLink: string;
}

export function OrderSuccessModal({ isOpen, onClose, orderCode, trackingLink }: OrderSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trackingLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} ariaLabel="Pedido creado">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Pedido</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">✅ Pedido creado con éxito</h2>
            <p className="mt-2 text-sm text-slate-600">
              Número de pedido: <span className="font-semibold text-slate-900">#{orderCode}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Link de seguimiento</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-600 break-all">{trackingLink}</p>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <a
            href={trackingLink}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Seguir pedido en tiempo real
          </a>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </AnimatedModal>
  );
}
