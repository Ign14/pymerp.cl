/**
 * Dashboard de Métricas y Analytics
 * 
 * Componente para visualizar:
 * - Web Vitals actuales
 * - Eventos de analytics
 * - Estadísticas de errores de Sentry
 * - Métricas de rendimiento
 */

import { useState, useEffect } from 'react';
import { useWebVitals } from '../hooks/useWebVitals';

export default function MetricsDashboard() {
  const { 
    vitals: storedVitals, 
    averages: calculatedAverages, 
    loading: vitalsLoading,
    clearMetrics 
  } = useWebVitals();
  
  const [vitals, setVitals] = useState<any[]>([]);
  const [averages, setAverages] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vitalsLoading) {
      setVitals(storedVitals);
      if (calculatedAverages) {
        setAverages(calculatedAverages);
      }
      setLoading(false);
    }
  }, [vitalsLoading, storedVitals, calculatedAverages]);

  const handleClearMetrics = () => {
    if (confirm('¿Desea limpiar todas las métricas almacenadas?')) {
      clearMetrics();
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'text-green-600 bg-green-50';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-50';
      case 'poor':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatValue = (name: string, value: number) => {
    if (name === 'CLS') {
      return value.toFixed(3);
    }
    return `${Math.round(value)}ms`;
  };

  const getVitalDescription = (name: string) => {
    const descriptions: Record<string, string> = {
      LCP: 'Largest Contentful Paint - Tiempo hasta que el contenido principal es visible',
      FID: 'First Input Delay - Tiempo hasta que la página responde a la primera interacción',
      CLS: 'Cumulative Layout Shift - Estabilidad visual de la página',
      FCP: 'First Contentful Paint - Tiempo hasta que aparece el primer contenido',
      TTFB: 'Time to First Byte - Tiempo hasta recibir el primer byte del servidor',
      INP: 'Interaction to Next Paint - Tiempo de respuesta a interacciones',
    };
    return descriptions[name] || name;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Métricas de Rendimiento</h2>
          <p className="text-sm text-gray-600 mt-1">
            Core Web Vitals y estadísticas de la aplicación
          </p>
        </div>
        <button
          onClick={handleClearMetrics}
          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
        >
          Limpiar métricas
        </button>
      </div>

      {/* Web Vitals Promedio */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Promedios de Core Web Vitals
        </h3>
        
        {Object.keys(averages).length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay métricas disponibles. Navega por la aplicación para recopilar datos.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(averages).map(([name, data]: [string, any]) => {
              const total = data.good + data.needsImprovement + data.poor;
              const goodPercent = total > 0 ? (data.good / total) * 100 : 0;
              const needsImprovementPercent = total > 0 ? (data.needsImprovement / total) * 100 : 0;
              const poorPercent = total > 0 ? (data.poor / total) * 100 : 0;

              return (
                <div key={name} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{name}</h4>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatValue(name, data.average)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-3">
                    {getVitalDescription(name)}
                  </p>

                  {/* Rating distribution */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-green-600">✓ Good</span>
                      <span className="font-medium">{goodPercent.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-600">⚠ Needs Improvement</span>
                      <span className="font-medium">{needsImprovementPercent.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-red-600">✗ Poor</span>
                      <span className="font-medium">{poorPercent.toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-green-500" 
                      style={{ width: `${goodPercent}%` }}
                    />
                    <div 
                      className="bg-yellow-500" 
                      style={{ width: `${needsImprovementPercent}%` }}
                    />
                    <div 
                      className="bg-red-500" 
                      style={{ width: `${poorPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Últimas métricas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Últimas Métricas Registradas
        </h3>

        {vitals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay métricas recientes
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Métrica
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Página
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vitals.map((vital, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {vital.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatValue(vital.name, vital.value)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRatingColor(vital.rating)}`}>
                        {vital.rating}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {vital.url}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(vital.timestamp).toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Analytics Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Google Analytics 4</h4>
          <p className="text-sm text-blue-700">
            Tracking de eventos, conversiones y pageviews habilitado
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-900 mb-2">Sentry</h4>
          <p className="text-sm text-purple-700">
            Monitoreo de errores y performance activo con source maps
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">Web Vitals</h4>
          <p className="text-sm text-green-700">
            Core Web Vitals siendo recolectados en tiempo real
          </p>
        </div>
      </div>
    </div>
  );
}
