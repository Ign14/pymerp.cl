import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUser, getCompany, getServices, getProducts } from '../services/firestore';
import AnimatedButton from './animations/AnimatedButton';
import LoadingSpinner from './animations/LoadingSpinner';
import toast from 'react-hot-toast';
import { logger } from '../utils/logger';

export default function DataExport() {
  const [loading, setLoading] = useState(false);
  const { firestoreUser } = useAuth();

  const exportData = async () => {
    if (!firestoreUser) {
      toast.error('No hay usuario autenticado');
      return;
    }

    setLoading(true);

    try {
      // Recopilar todos los datos del usuario
      const userData = await getUser(firestoreUser.id);
      
      if (!userData) {
        toast.error('No se encontraron datos del usuario');
        return;
      }
      
      const companyData = firestoreUser.company_id 
        ? await getCompany(firestoreUser.company_id)
        : null;
      
      const servicesData = companyData 
        ? await getServices(companyData.id)
        : [];
      
      const productsData = companyData
        ? await getProducts(companyData.id)
        : [];

      // Estructura de datos GDPR-compliant
      const exportPackage = {
        metadata: {
          export_date: new Date().toISOString(),
          user_id: firestoreUser.id,
          version: '1.0',
          format: 'JSON',
        },
        personal_data: {
          user: {
            id: userData.id,
            email: userData.email,
            role: userData.role,
            status: userData.status,
            company_id: userData.company_id || null,
          },
          company: companyData ? {
            id: companyData.id,
            name: companyData.name,
            rut: companyData.rut || null,
            industry: companyData.industry || null,
            sector: companyData.sector || null,
            address: companyData.address || null,
            city: (companyData as any).ciudad || (companyData as any).comuna || null,
            region: (companyData as any).region || null,
            whatsapp: companyData.whatsapp || null,
            slug: companyData.slug || null,
          } : null,
          services: servicesData.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description || null,
            price: s.price,
            status: s.status,
            image_url: s.image_url || null,
          })),
          products: productsData.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description || null,
            price: p.price,
            status: p.status,
            stock: (p as any).stock || 0,
            image_url: p.image_url || null,
          })),
        },
        legal_basis: {
          purpose: 'Gestión de negocio y servicios',
          lawful_basis: 'Consentimiento del usuario',
          retention_period: 'Mientras la cuenta esté activa + 2 años',
          data_controller: 'AgendaWeb / PYM-ERP',
        },
      };

      // Crear archivo JSON
      const json = JSON.stringify(exportPackage, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Descargar
      const a = document.createElement('a');
      a.href = url;
      a.download = `agendaweb-data-export-${firestoreUser.id}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('✅ Tus datos se han descargado correctamente');
      logger.info('Datos exportados para usuario:', firestoreUser.id);

    } catch (error) {
      logger.error('Error exportando datos:', error);
      toast.error('❌ No se pudieron exportar los datos. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        📥 Descargar Mis Datos
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Descarga una copia completa de toda tu información personal almacenada en AgendaWeb.
        Este es tu derecho garantizado por la RGPD (Reglamento General de Protección de Datos).
      </p>

      <AnimatedButton
        onClick={exportData}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner size="sm" color="#ffffff" />
            Exportando...
          </span>
        ) : (
          'Descargar Mis Datos'
        )}
      </AnimatedButton>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        <strong>Incluye:</strong> perfil de usuario, información de empresa, servicios, productos y metadatos.
        <br/>
        <strong>No incluye:</strong> datos de Google Analytics (debes solicitarlos directamente a Google).
      </p>
    </div>
  );
}

