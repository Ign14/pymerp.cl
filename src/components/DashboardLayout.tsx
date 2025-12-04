import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logOut } from '../services/auth';
import { getCompany } from '../services/firestore';
import { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (firestoreUser?.company_id) {
      loadCompany();
    }
  }, [firestoreUser]);

  const loadCompany = async () => {
    if (!firestoreUser?.company_id) return;
    try {
      const companyData = await getCompany(firestoreUser.company_id);
      setCompany(companyData);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/dashboard" className="flex items-center px-4 text-xl font-bold text-blue-600">
                {t('brand')}
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-blue-500"
                >
                  Dashboard
                </Link>
                {company?.business_type === 'SERVICES' && (
                  <>
                    <Link
                      to="/dashboard/services"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    >
                      Servicios
                    </Link>
                    <Link
                      to="/dashboard/services/schedules"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    >
                      Horarios
                    </Link>
                    <Link
                      to="/dashboard/services/settings"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    >
                      Configuración
                    </Link>
                  </>
                )}
                {company?.business_type === 'PRODUCTS' && (
                  <>
                    <Link
                      to="/dashboard/products"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    >
                      Productos
                    </Link>
                    <Link
                      to="/dashboard/products/settings"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    >
                      Configuración
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="fixed top-4 right-4 z-40 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 rounded-md shadow"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
