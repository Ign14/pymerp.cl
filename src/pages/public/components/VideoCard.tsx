import { Company } from '../../../types';
import { AppearanceTheme } from '../types';
import { extractYouTubeVideoId } from '../../../utils/videoHelpers';

interface VideoCardProps {
  company: Company;
  theme: AppearanceTheme;
}

export function VideoCard({ company, theme }: VideoCardProps) {
  if (!company.video_enabled || !company.video_url) {
    return null;
  }

  // Build embed URL - si ya es una URL embed, usarla directamente, sino extraer ID y construirla
  let embedUrl: string;
  
  if (company.video_url.includes('youtube.com/embed/')) {
    // Ya es una URL embed, limpiar parámetros y agregar los nuestros
    const baseUrl = company.video_url.split('?')[0];
    embedUrl = `${baseUrl}?rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
  } else {
    // Extract video ID from regular URL
    const videoId = extractYouTubeVideoId(company.video_url);
    if (!videoId) {
      console.warn('[VideoCard] Could not extract video ID from:', company.video_url);
      return null;
    }
    // Construir URL embed desde el video ID con parámetros necesarios
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://pymerp.cl';
    embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`;
  }

  return (
    <div
      className="mb-4 sm:mb-6 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm sm:shadow-md w-full"
      style={{ backgroundColor: theme.cardColor, color: theme.textColor, fontFamily: theme.fontBody }}
    >
      <div className="space-y-2 sm:space-y-3">
        <h2 
          className="font-semibold text-sm sm:text-base md:text-lg lg:text-xl mb-2 sm:mb-3" 
          style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
        >
          🎥 Video
        </h2>
        <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedUrl}
            className="absolute top-0 left-0 w-full h-full"
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

