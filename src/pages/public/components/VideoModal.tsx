import { useState, useEffect } from 'react';
import { Company } from '../../../types';
import { AppearanceTheme } from '../types';
import { extractYouTubeVideoId } from '../../../utils/videoHelpers';

interface VideoModalProps {
  company: Company;
  theme: AppearanceTheme;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoModal({ company, isOpen, onClose }: VideoModalProps) {
  const [hasSeenModal, setHasSeenModal] = useState(false);

  useEffect(() => {
    // Check if user has already seen the modal in this session
    const seenKey = `video_modal_seen_${company.id}`;
    const seen = sessionStorage.getItem(seenKey);
    if (seen === 'true') {
      setHasSeenModal(true);
    }
  }, [company.id]);

  useEffect(() => {
    if (isOpen && !hasSeenModal) {
      // Mark as seen when modal opens
      const seenKey = `video_modal_seen_${company.id}`;
      sessionStorage.setItem(seenKey, 'true');
      setHasSeenModal(true);
    }
  }, [isOpen, hasSeenModal, company.id]);

  if (!isOpen || !company.video_enabled || !company.video_url) {
    return null;
  }

  const videoId = extractYouTubeVideoId(company.video_url);
  if (!videoId) {
    return null;
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://pymerp.cl';
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
    >
      <div
        className="relative w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Solo X con transparencia */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black bg-opacity-30 hover:bg-opacity-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
          aria-label="Cerrar video"
        >
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white opacity-80 hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Video Container - Pantalla completa */}
        <div className="relative w-full h-full max-w-[95vw] max-h-[95vh]">
          <iframe
            src={embedUrl}
            className="w-full h-full rounded-lg"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title={`Video de ${company.name}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}

