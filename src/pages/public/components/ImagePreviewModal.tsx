import AnimatedModal from '../../../components/animations/AnimatedModal';

interface ImagePreviewModalProps {
  url: string | null;
  onClose: () => void;
}

export function ImagePreviewModal({ url, onClose }: ImagePreviewModalProps) {
  return (
    <AnimatedModal
      isOpen={!!url}
      onClose={onClose}
      className="relative max-w-4xl p-0 bg-transparent shadow-none"
      ariaLabel="Vista previa de imagen"
    >
      <button
        onClick={onClose}
        className="absolute -top-10 right-0 text-white text-3xl z-10"
        aria-label="Cerrar vista previa"
      >
        ×
      </button>
      <div className="bg-white rounded-lg overflow-hidden shadow-lg max-h-[80vh] flex items-center justify-center">
        {url ? (
          <img src={url} alt="Vista previa ampliada de la imagen" className="max-h-[80vh] max-w-full object-contain" />
        ) : null}
      </div>
    </AnimatedModal>
  );
}
