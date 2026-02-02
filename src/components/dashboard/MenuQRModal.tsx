import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Company } from '../../types';
import { updateCompany } from '../../services/firestore';
import { env } from '../../config/env';

interface MenuQRModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onCompanyUpdate?: (updates: Partial<Company>) => void;
}

export default function MenuQRModal({ company, isOpen, onClose, onCompanyUpdate }: MenuQRModalProps) {
  const [copied, setCopied] = useState(false);
  const [menuUrl, setMenuUrl] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundName, setBackgroundName] = useState<string | null>(null);
  const [tableCount, setTableCount] = useState<number>(0);
  const [savingTables, setSavingTables] = useState(false);
  const qrRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (company && isOpen) {
      // Generar URL del menú público (dominio canónico Firebase agendaemprende)
      const baseUrl = env.publicBaseUrl;
      const url = company.slug 
        ? `${baseUrl}/${company.slug}/menu`
        : `${baseUrl}/${company.id}/menu`;
      setMenuUrl(url);
      const normalizedCount = Math.max(0, Math.min(40, Math.floor(company.menu_qr_table_count ?? 0)));
      setTableCount(normalizedCount);
    }
  }, [company, isOpen]);

  const handleCopyUrl = async () => {
    if (!menuUrl) return;
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      toast.success('URL copiada al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar la URL');
    }
  };

  const handleBackgroundChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setBackgroundImage(null);
      setBackgroundName(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBackgroundImage(reader.result);
        setBackgroundName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExportPdf = () => {
    if (!qrRef.current || !menuUrl) {
      toast.error('No se pudo generar el QR');
      return;
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(qrRef.current);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      URL.revokeObjectURL(url);
      toast.error('No se pudo abrir la ventana de exportación');
      return;
    }

    const backgroundMarkup = backgroundImage
      ? `<img class="bg" src="${backgroundImage}" alt="Fondo QR" />`
      : '';

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>QR ${company?.name || ''}</title>
          <style>
            html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
            body { background: #ffffff; }
            .page {
              position: relative;
              width: 100vw;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            .bg {
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              object-fit: cover;
              z-index: 0;
            }
            .qr {
              position: relative;
              width: 256px;
              height: 256px;
              z-index: 1;
            }
          </style>
        </head>
        <body>
          <div class="page">
            ${backgroundMarkup}
            <img class="qr" src="${url}" alt="QR ${company?.name || ''}" />
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
            window.onafterprint = function() {
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen || !company) return null;

  const qrTableCategories = new Set(['restaurantes_comida_rapida', 'restaurantes', 'bares', 'foodtruck']);
  const isRestaurant = qrTableCategories.has(company.category_id ?? '');
  const tableOptions = Array.from({ length: 41 }, (_, idx) => idx);

  const handleSaveTables = async () => {
    if (!company) return;
    const normalizedCount = Math.max(0, Math.min(40, Math.floor(tableCount)));
    setSavingTables(true);
    try {
      const updates: Partial<Company> = {
        menu_qr_table_count: normalizedCount,
      };
      await updateCompany(company.id, updates);
      onCompanyUpdate?.(updates);
      toast.success(
        normalizedCount > 0
          ? `Mesas configuradas: ${normalizedCount}`
          : 'Se desactivó la selección de mesas'
      );
    } catch (error) {
      toast.error('No se pudieron guardar las mesas');
      console.error('[MenuQRModal] Error guardando mesas:', error);
    } finally {
      setSavingTables(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 relative">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Menú QR</h2>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Escanea el código QR para acceder al menú digital de {company.name}
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-lg border-2 border-gray-200 dark:border-slate-600 w-full max-w-[320px]">
            <QRCodeSVG
              value={menuUrl}
              size={256}
              level="H"
              includeMargin={true}
              ref={qrRef}
              className="w-full h-auto max-w-[256px] mx-auto"
            />
          </div>
        </div>

        {/* URL Display */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
            URL del Menú
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              type="text"
              value={menuUrl}
              readOnly
              className="w-full sm:flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={handleCopyUrl}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              aria-label="Copiar URL"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>

        {isRestaurant && (
          <div className="mb-5 border border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4">
            <div className="flex flex-col gap-2 mb-3">
              <h3 className="text-sm font-semibold text-teal-900 dark:text-teal-100">Configuración de mesas (Menú QR)</h3>
              <p className="text-xs text-teal-800 dark:text-teal-200">
                Si configuras mesas, el carrito del menú QR exigirá seleccionar una antes de enviar el pedido.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-teal-900 dark:text-teal-100 mb-1">Cantidad de mesas</label>
                <select
                  value={tableCount}
                  onChange={(e) => setTableCount(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-teal-300 dark:border-teal-700 rounded-md bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-slate-100"
                >
                  {tableOptions.map((value) => (
                    <option key={value} value={value}>
                      {value === 0 ? 'Sin mesas configuradas' : `${value} mesa${value === 1 ? '' : 's'}`}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleSaveTables}
                disabled={savingTables}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium"
              >
                {savingTables ? 'Guardando...' : 'Guardar mesas'}
              </button>
            </div>
          </div>
        )}

        {isRestaurant && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
              Fondo para PDF (formato vertical)
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleBackgroundChange}
              className="block w-full text-sm text-gray-700 dark:text-slate-100 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 dark:file:bg-slate-700 dark:file:text-slate-100 dark:hover:file:bg-slate-600"
            />
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
              Recomendado: 1080×1920 px o 1240×1754 px (A4 a 150 dpi).
            </p>
            {backgroundName && (
              <p className="text-xs text-gray-600 dark:text-slate-300 mt-1">
                Archivo seleccionado: {backgroundName}
              </p>
            )}
          </div>
        )}

        {/* Export QR */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleExportPdf}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            aria-label="Exportar código QR en PDF"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Exportar código QR
          </button>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
            Se abrirá la vista de impresión para que puedas guardar el QR como PDF o imprimirlo.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Instrucciones:</strong>
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
            <li>Imprime este código QR o muéstralo en pantalla</li>
            <li>Tus clientes pueden escanearlo con su teléfono</li>
            <li>Serán dirigidos automáticamente a tu menú digital</li>
          </ul>
        </div>

        {/* Close button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-100 rounded-md hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
