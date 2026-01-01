import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { getCompany, updateCompany } from '../../services/firestore';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { processYouTubeUrl, getYouTubeThumbnail, type VideoInfo } from '../../utils/videoHelpers';
import LoadingSpinner from '../../components/animations/LoadingSpinner';

type VideoPlacement = 'MODAL' | 'HERO' | 'FOOTER';

export default function BrandingVideo() {
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [placement, setPlacement] = useState<VideoPlacement>('HERO');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

  // Process video URL when it changes
  useEffect(() => {
    if (!videoUrl.trim()) {
      setVideoInfo(null);
      return;
    }
    const info = processYouTubeUrl(videoUrl);
    setVideoInfo(info);
  }, [videoUrl]);

  useEffect(() => {
    const load = async () => {
      if (!firestoreUser?.company_id) {
        setLoading(false);
        return;
      }
      try {
        const company = await getCompany(firestoreUser.company_id);
        if (company) {
          setEnabled(Boolean(company.video_enabled));
          const url = company.video_url || '';
          setVideoUrl(url);
          if (url) {
            const info = processYouTubeUrl(url);
            setVideoInfo(info);
          }
          setPlacement((company.video_placement as VideoPlacement) || 'HERO');
        }
      } catch (error) {
        handleError(error, { customMessage: 'No se pudo cargar el video' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [firestoreUser?.company_id, handleError]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestoreUser?.company_id) return;

    // Validate video URL if enabled
    if (enabled) {
      if (!videoUrl.trim()) {
        toast.error('Por favor ingresa una URL de YouTube');
        return;
      }
      if (!videoInfo?.isValid) {
        toast.error(videoInfo?.error || 'URL de YouTube no válida');
        return;
      }
    }

    setSaving(true);
    try {
      // Save the processed embed URL or original URL
      // Si tenemos un videoId válido, guardar solo el embed URL
      // Si no, guardar la URL original para que el usuario pueda corregirla
      let urlToSave: string;
      if (videoInfo?.isValid && videoInfo.videoId) {
        // Guardar el embed URL completo
        urlToSave = videoInfo.embedUrl;
      } else if (enabled) {
        // Si está habilitado pero no es válido, guardar la URL original para debugging
        urlToSave = videoUrl.trim();
      } else {
        // Si está deshabilitado, guardar vacío o la URL anterior
        urlToSave = videoUrl.trim();
      }
      
      console.log('[BrandingVideo] Saving video:', {
        enabled,
        placement,
        urlToSave,
        videoInfo,
      });
      
      await updateCompany(firestoreUser.company_id, {
        video_enabled: enabled,
        video_url: urlToSave,
        video_placement: placement,
      });
      toast.success('Video actualizado correctamente');
    } catch (error) {
      toast.error('No se pudo guardar el video');
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  const thumbnailUrl = useMemo(() => {
    if (videoInfo?.isValid && videoInfo.videoId) {
      return getYouTubeThumbnail(videoInfo.videoId, 'high');
    }
    return null;
  }, [videoInfo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Video en ficha pública</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Agrega un enlace de YouTube para mostrar en tu ficha pública. Puedes activar/desactivar el video y elegir cómo se presenta.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </button>
          </div>
        </div>

        <form className="bg-white shadow rounded-xl p-6 space-y-6" onSubmit={handleSave}>
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="video-enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="video-enabled" className="text-sm font-semibold text-gray-900 cursor-pointer">
                Mostrar video en la ficha pública
              </label>
            </div>
            {enabled && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                Activo
              </span>
            )}
          </div>

          {/* Video URL Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Enlace de YouTube
            </label>
            <input
              type="text"
              placeholder="https://youtu.be/VIDEO_ID o https://www.youtube.com/watch?v=VIDEO_ID"
              className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                videoInfo && !videoInfo.isValid && videoUrl.trim()
                  ? 'border-red-300 focus:border-red-500'
                  : videoInfo?.isValid
                  ? 'border-green-300 focus:border-green-500'
                  : 'border-gray-300 focus:border-indigo-500'
              }`}
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              disabled={!enabled}
              required={enabled}
            />
            {videoInfo && !videoInfo.isValid && videoUrl.trim() && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {videoInfo.error}
              </p>
            )}
            {videoInfo?.isValid && (
              <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                URL de YouTube válida
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Acepta enlaces de YouTube en formato: <code className="bg-gray-100 px-1 rounded">youtu.be/VIDEO_ID</code> o <code className="bg-gray-100 px-1 rounded">youtube.com/watch?v=VIDEO_ID</code>
            </p>
          </div>

          {/* Video Preview */}
          {enabled && videoInfo?.isValid && videoInfo.embedUrl && (
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Vista previa del video</h3>
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={videoInfo.embedUrl}
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Vista previa del video"
                />
              </div>
              {thumbnailUrl && (
                <p className="mt-2 text-xs text-gray-500">
                  Video ID: <code className="bg-gray-200 px-1 rounded">{videoInfo.videoId}</code>
                </p>
              )}
            </div>
          )}

          {/* Placement Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Ubicación del video
            </label>
            <select
              value={placement}
              onChange={(e) => setPlacement(e.target.value as VideoPlacement)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              disabled={!enabled}
            >
              <option value="MODAL">Ventana emergente al iniciar (con botón cerrar)</option>
              <option value="HERO">Tarjeta destacada al inicio del contenido</option>
              <option value="FOOTER">Tarjeta al final del contenido</option>
            </select>
            <p className="mt-2 text-xs text-gray-500">
              Elige dónde se mostrará el video en tu ficha pública
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setVideoUrl('');
                setVideoInfo(null);
                setEnabled(false);
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={saving || (enabled && !videoInfo?.isValid)}
              className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  Guardando...
                </>
              ) : (
                'Guardar video'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
