import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

type ResizeOptions = {
  width: number;
  height: number;
  maxSizeKB?: number;
  format?: 'image/jpeg' | 'image/png';
  quality?: number; // 0-1
};

/**
 * Redimensiona y comprime una imagen a las dimensiones y tamaño especificados
 * 
 * Usa canvas para redimensionar la imagen manteniendo proporciones (contain).
 * Aplica compresión iterativa si excede el tamaño máximo permitido.
 * 
 * @param file - Archivo de imagen a procesar
 * @param options - Opciones de redimensionamiento y compresión
 * @param options.width - Ancho objetivo en píxeles
 * @param options.height - Alto objetivo en píxeles
 * @param options.maxSizeKB - Tamaño máximo en KB (default: 1000)
 * @param options.format - Formato de salida (default: 'image/jpeg')
 * @param options.quality - Calidad de compresión 0-1 (default: 0.9)
 * @returns Archivo procesado con las dimensiones y tamaño especificados
 * @throws {Error} Si no se puede generar la imagen o contexto de canvas
 * 
 * @example
 * ```typescript
 * const resizedFile = await resizeAndCompress(originalFile, {
 *   width: 800,
 *   height: 600,
 *   maxSizeKB: 500,
 *   format: 'image/jpeg',
 *   quality: 0.85
 * });
 * ```
 */
const resizeAndCompress = async (file: File, options: ResizeOptions): Promise<File> => {
  const { width, height, maxSizeKB = 1000, format = 'image/jpeg', quality = 0.9 } = options;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo obtener contexto de canvas');

  // Fondo blanco para JPEG, transparente para PNG
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  // Ajustar sin recortar (contain)
  const scale = Math.min(width / img.width, height / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const dx = (width - drawWidth) / 2;
  const dy = (height - drawHeight) / 2;
  ctx.drawImage(img, dx, dy, drawWidth, drawHeight);

  let currentQuality = quality;
  let blob: Blob | null = null;

  for (let i = 0; i < 3; i++) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, format, currentQuality)
    );
    if (!blob) break;
    const sizeKB = blob.size / 1024;
    if (sizeKB <= maxSizeKB) break;
    currentQuality = Math.max(0.5, currentQuality - 0.15); // reduce quality if too large
  }

  if (!blob) throw new Error('No se pudo generar la imagen procesada');
  return new File([blob], file.name, { type: format, lastModified: Date.now() });
};

/**
 * Sube una imagen a Firebase Storage con opciones de redimensionamiento
 * 
 * @param file - Archivo de imagen a subir
 * @param path - Ruta en Storage donde se guardará el archivo
 * @param resizeOptions - Opciones opcionales para redimensionar y comprimir
 * @returns URL pública de descarga del archivo subido
 * @throws {Error} Si falla la subida o no se puede obtener la URL
 * 
 * @example
 * ```typescript
 * // Subir logo redimensionado
 * const url = await uploadImage(logoFile, 'logos/company-123/logo.png', {
 *   width: 400,
 *   height: 400,
 *   maxSizeKB: 200,
 *   format: 'image/png'
 * });
 * 
 * // Subir imagen sin redimensionar
 * const url = await uploadImage(bannerFile, 'banners/company-123/banner.jpg');
 * ```
 */
export const uploadImage = async (
  file: File,
  path: string,
  resizeOptions?: ResizeOptions
): Promise<string> => {
  const processedFile = resizeOptions ? await resizeAndCompress(file, resizeOptions) : file;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, processedFile);
  return await getDownloadURL(storageRef);
};
