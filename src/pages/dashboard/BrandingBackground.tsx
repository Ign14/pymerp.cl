import { useEffect, useState, useRef, startTransition } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { getCompany, updateCompany } from '../../services/firestore';
import { uploadImage } from '../../services/storage';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useNavigate } from 'react-router-dom';
// Removed framer-motion import to avoid DOM conflicts

type Orientation = 'HORIZONTAL' | 'VERTICAL';
type ImageFit = 'cover' | 'contain' | 'fill' | 'scale-down';

interface ImageInfo {
  width: number;
  height: number;
  aspectRatio: number;
  sizeKB: number;
  format: string;
}

export default function BrandingBackground() {
  const { firestoreUser } = useAuth();
  const { handleError } = useErrorHandler();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [url, setUrl] = useState('');
  const [orientation, setOrientation] = useState<Orientation>('VERTICAL');
  const [imageFit, setImageFit] = useState<ImageFit>('cover');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [opacity, setOpacity] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewImgRef = useRef<HTMLImageElement>(null);
  const isMountedRef = useRef(true);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Limpiar object URL si existe
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      // Limpiar estados para evitar actualizaciones después del desmontaje
      setUploading(false);
      setSaving(false);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!firestoreUser?.company_id) {
        if (isMountedRef.current) setLoading(false);
        return;
      }
      try {
        const company = await getCompany(firestoreUser.company_id);
        if (company && isMountedRef.current) {
          setEnabled(Boolean(company.background_enabled));
          setUrl(company.background_url || '');
          // Forzamos vertical como orientación por defecto
          setOrientation('VERTICAL');
          setImageFit((company.background_fit as ImageFit) || 'cover');
          setOpacity(company.background_opacity ?? 100);
          if (company.background_url) {
            setPreviewUrl(company.background_url);
            loadImageInfo(company.background_url);
          }
        }
      } catch (error) {
        if (isMountedRef.current) {
          handleError(error, { customMessage: 'No se pudo cargar el fondo' });
        }
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    };
    load();
  }, [firestoreUser?.company_id, handleError]);

  const loadImageInfo = (imageUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!isMountedRef.current) return;
      const aspectRatio = img.width / img.height;
      
      setImageInfo({
        width: img.width,
        height: img.height,
        aspectRatio,
        sizeKB: 0, // No podemos obtener el tamaño sin fetch
        format: imageUrl.split('.').pop()?.toUpperCase() || 'UNKNOWN',
      });
    };
    img.onerror = () => {
      if (isMountedRef.current) {
        setImageInfo(null);
      }
    };
    img.src = imageUrl;
  };

  const handleFileSelect = async (file: File) => {
    if (!file || !firestoreUser?.company_id) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no soportado. Usa JPG, PNG, WebP o AVIF');
      return;
    }

    // Validar tamaño (máx 10MB)
    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`La imagen es muy grande. Máximo ${maxSizeMB}MB`);
      return;
    }

    // Crear preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!isMountedRef.current) return;
      const preview = e.target?.result as string;
      setPreviewUrl(preview);
      
      // Cargar info de la imagen
      const img = new Image();
      img.onload = () => {
        if (!isMountedRef.current) return;
        const aspectRatio = img.width / img.height;
        
        setImageInfo({
          width: img.width,
          height: img.height,
          aspectRatio,
          sizeKB: Math.round(file.size / 1024),
          format: file.type.split('/')[1].toUpperCase(),
        });
      };
      img.src = preview;
    };
    reader.readAsDataURL(file);

    // Subir imagen
    setUploading(true);
    try {
      const path = `backgrounds/${firestoreUser.company_id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // Limpiar object URL anterior si existe
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      
      // Optimización inteligente según orientación y tamaño original
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;
      
      img.onload = () => {
        if (!isMountedRef.current) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        
        const aspectRatio = img.width / img.height;
        const isHorizontal = aspectRatio > 1;
        
        // Calcular dimensiones óptimas manteniendo aspect ratio
        let targetWidth = isHorizontal ? 2560 : 1440; // 2K para horizontal, Full HD para vertical
        let targetHeight = isHorizontal ? 1440 : 2560;
        
        // Si la imagen es más pequeña, no la agrandamos
        if (img.width < targetWidth) {
          targetWidth = img.width;
          targetHeight = Math.round(img.height * (targetWidth / img.width));
        } else if (img.height < targetHeight) {
          targetHeight = img.height;
          targetWidth = Math.round(img.width * (targetHeight / img.height));
        }
        
        // Calidad según tamaño original
        const quality = img.width > 2000 ? 0.85 : 0.92; // Menos compresión para imágenes grandes
        
        const resizeOpts = {
          width: targetWidth,
          height: targetHeight,
          maxSizeKB: 2000, // Permitir hasta 2MB para fondos de alta calidad
          format: 'image/jpeg' as const,
          quality,
        };
        
        uploadImage(file, path, resizeOpts)
          .then((uploadedUrl) => {
            if (!isMountedRef.current) return;
            setUrl(uploadedUrl);
            setPreviewUrl(uploadedUrl);
            toast.success('Imagen subida y optimizada correctamente');
          })
          .catch((error) => {
            if (isMountedRef.current) {
              toast.error('No se pudo subir la imagen');
              handleError(error);
            }
          })
          .finally(() => {
            if (isMountedRef.current) {
              setUploading(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }
            // Limpiar object URL después de usarlo
            URL.revokeObjectURL(objectUrl);
            if (objectUrlRef.current === objectUrl) {
              objectUrlRef.current = null;
            }
          });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        if (objectUrlRef.current === objectUrl) {
          objectUrlRef.current = null;
        }
        if (isMountedRef.current) {
          setUploading(false);
          toast.error('Error al cargar la imagen');
        }
      };
      img.src = objectUrl;
    } catch (error) {
      if (isMountedRef.current) {
        toast.error('Error al procesar la imagen');
        handleError(error);
        setUploading(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestoreUser?.company_id) return;
    setSaving(true);
    try {
      await updateCompany(firestoreUser.company_id, {
        background_enabled: enabled,
        background_url: url.trim(),
        background_orientation: orientation,
        background_fit: imageFit,
        background_opacity: opacity,
      });
      toast.success('✅ Fondo actualizado correctamente');
    } catch (error) {
      toast.error('❌ No se pudo guardar el fondo');
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🎨 Fondo de la Ficha Pública
              </h1>
              <p className="text-sm text-gray-600">
                Personaliza el fondo de tu página pública con una imagen de alta calidad.
                El sistema optimizará automáticamente la imagen para mantener la mejor resolución en todos los dispositivos.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Volver
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📐</span>
                <h3 className="font-semibold text-blue-900">Formatos Soportados</h3>
              </div>
              <p className="text-xs text-blue-700">
                JPG, PNG, WebP, AVIF. Hasta 10MB. Se optimizará automáticamente.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🖼️</span>
                <h3 className="font-semibold text-green-900">Resoluciones Recomendadas</h3>
              </div>
              <p className="text-xs text-green-700">
                Horizontal: 2560x1440px (2K) o superior. Vertical: 1440x2560px o superior.
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⚡</span>
                <h3 className="font-semibold text-purple-900">Optimización Automática</h3>
              </div>
              <p className="text-xs text-purple-700">
                La imagen se redimensiona y comprime manteniendo la máxima calidad visual.
              </p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <form className="space-y-6" onSubmit={handleSave}>
            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <label className="inline-flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-base font-semibold text-gray-900 block">
                    Mostrar fondo en la ficha pública
                  </span>
                  <span className="text-xs text-gray-500">
                    Activa esta opción para mostrar la imagen de fondo
                  </span>
                </div>
              </label>
            </div>

            {enabled && (
              <div className="space-y-6">
                {/* Preview Section */}
                {previewUrl && (
                  <div className="relative bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-300">
                    <div className="relative h-64 sm:h-96 overflow-hidden">
                      <img
                        ref={previewImgRef}
                        src={previewUrl}
                        alt="Preview del fondo"
                        className="w-full h-full transition-all duration-300"
                        style={{
                          opacity: opacity / 100,
                          objectFit: imageFit,
                          objectPosition: 'center',
                        }}
                        onError={() => {
                          if (isMountedRef.current) {
                            setPreviewUrl('');
                            toast.error('No se pudo cargar la imagen');
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </div>
                    {imageInfo && (
                      <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white text-xs p-2 rounded backdrop-blur-sm">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <span className="text-gray-300">Dimensiones:</span>
                            <span className="ml-1 font-semibold">
                              {imageInfo.width} × {imageInfo.height}px
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-300">Aspect Ratio:</span>
                            <span className="ml-1 font-semibold">
                              {imageInfo.aspectRatio.toFixed(2)}:1
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-300">Formato:</span>
                            <span className="ml-1 font-semibold">{imageInfo.format}</span>
                          </div>
                          {imageInfo.sizeKB > 0 && (
                            <div>
                              <span className="text-gray-300">Tamaño:</span>
                              <span className="ml-1 font-semibold">{imageInfo.sizeKB} KB</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* URL Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    URL de la imagen
                  </label>
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={url}
                    onChange={(e) => {
                      if (!isMountedRef.current) return;
                      const newUrl = e.target.value.trim();
                      startTransition(() => {
                        setUrl(newUrl);
                        if (newUrl) {
                          setPreviewUrl(newUrl);
                          loadImageInfo(newUrl);
                        } else {
                          setPreviewUrl('');
                          setImageInfo(null);
                        }
                      });
                    }}
                    disabled={uploading}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Ingresa una URL directa a la imagen. Asegúrate de que sea accesible públicamente.
                  </p>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    O sube una imagen desde tu dispositivo
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
                        disabled={uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                        className="hidden"
                      />
                      <div className="px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center">
                        {uploading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-gray-600">Subiendo y optimizando...</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-blue-600 font-medium">📁 Click para seleccionar</span>
                            <p className="text-xs text-gray-500 mt-1">
                              JPG, PNG, WebP, AVIF (máx 10MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Image Fit */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Ajuste de la imagen
                  </label>
                  <select
                    value={imageFit}
                    onChange={(e) => {
                      if (!isMountedRef.current) return;
                      startTransition(() => {
                        setImageFit(e.target.value as ImageFit);
                      });
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="cover">
                      🖼️ Cover - Cubre todo el espacio (puede recortar)
                    </option>
                    <option value="contain">
                      📦 Contain - Muestra toda la imagen (puede dejar espacios)
                    </option>
                    <option value="fill">
                      🔲 Fill - Estira para llenar (puede distorsionar)
                    </option>
                    <option value="scale-down">
                      ⬇️ Scale Down - Reduce si es necesario (mantiene proporción)
                    </option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    <strong>Cover:</strong> Mejor para fondos decorativos. 
                    <strong> Contain:</strong> Mejor para preservar toda la imagen.
                  </p>
                </div>

                {/* Opacity */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Opacidad: {opacity}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={opacity}
                    onChange={(e) => {
                      if (!isMountedRef.current) return;
                      startTransition(() => {
                        setOpacity(Number(e.target.value));
                      });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10% (Muy transparente)</span>
                    <span>100% (Completamente opaco)</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Ajusta la opacidad para que el contenido sea más legible sobre el fondo.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || (enabled && !url.trim())}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin inline-block rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>💾</span>
                    Guardar Configuración
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
