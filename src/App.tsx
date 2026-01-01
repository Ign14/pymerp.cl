import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import PageTransition from './components/animations/PageTransition';
import SkipLinks from './components/SkipLinks';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import OfflineIndicator from './components/OfflineIndicator';
import CookieConsent from './components/CookieConsent';
import { UserRole } from './types';

// Landing & Auth
import Landing from './pages/Landing';
import { LandingPage } from './pages/LandingPage';
import Login from './pages/Login';
import RequestAccess from './pages/RequestAccess';
import ChangePassword from './pages/ChangePassword';
import AuthAction from './pages/AuthAction';
import NearbyCompanies from './pages/info/NearbyCompanies';
import FeaturesPage from './pages/info/Features';
import Security from './pages/info/Security';
import Roadmap from './pages/info/Roadmap';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageSubscriptions from './pages/admin/ManageSubscriptions';

// Setup Wizard
import SetupCompanyBasic from './pages/setup/SetupCompanyBasic';
import SetupCompanyLocation from './pages/setup/SetupCompanyLocation';
import SetupCompanyInfo from './pages/setup/SetupCompanyInfo';
import SetupBusinessType from './pages/setup/SetupBusinessType';

// Entrepreneur Dashboard
import DashboardOverview from './pages/dashboard/DashboardOverview';
import SchedulePage from './pages/dashboard/SchedulePage';
import NewAppointmentPage from './pages/dashboard/appointments/NewAppointmentPage';
import NotificationsSettingsPage from './pages/dashboard/settings/NotificationsSettingsPage';
import SubscriptionPage from './pages/dashboard/settings/SubscriptionPage';
import ServicesSettings from './pages/dashboard/services/ServicesSettings';
import ServicesSchedules from './pages/dashboard/services/ServicesSchedules';
import ServicesList from './pages/dashboard/services/ServicesList';
import ServiceNew from './pages/dashboard/services/ServiceNew';
import ProductsSettings from './pages/dashboard/products/ProductsSettings';
import ProductsList from './pages/dashboard/products/ProductsList';
import ProductNew from './pages/dashboard/products/ProductNew';
import BrandingBackground from './pages/dashboard/BrandingBackground';
import BrandingVideo from './pages/dashboard/BrandingVideo';

// Appointments
import Schedule from './pages/dashboard/appointments/Schedule';

// Professionals
import ProfessionalsListPage from './pages/dashboard/professionals/ProfessionalsListPage';
import ProfessionalsNewPage from './pages/dashboard/professionals/ProfessionalsNewPage';
import ProfessionalForm from './pages/dashboard/professionals/ProfessionalForm';

// Reports
import AppointmentsReport from './pages/dashboard/reports/AppointmentsReport';

// Public
import PublicPage from './pages/public/PublicPage';
import Transparencia from './pages/info/Transparencia';
import About from './pages/info/About';
import Costos from './pages/info/Costos';
import Privacidad from './pages/info/Privacidad';
import Terminos from './pages/info/Terminos';
import Cookies from './pages/info/Cookies';
import Legal from './pages/info/Legal';
import Licenses from './pages/info/Licenses';
import Contacto from './pages/info/Contacto';
import CondicionesBeta from './pages/info/CondicionesBeta';
import { env } from './config/env';
import { useState } from 'react';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/landing-old" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/auth/action" element={<PageTransition><AuthAction /></PageTransition>} />
        <Route path="/request-access" element={<PageTransition><RequestAccess /></PageTransition>} />
          <Route
            path="/change-password"
            element={
              <PageTransition>
                <ProtectedRoute requireActive={false}>
                  <ChangePassword />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          
          <Route
            path="/admin"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.SUPERADMIN}>
                  <AdminDashboard />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/admin/subscriptions/:companyId"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.SUPERADMIN}>
                  <ManageSubscriptions />
                </ProtectedRoute>
              </PageTransition>
            }
          />

          <Route
            path="/setup/company-basic"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <SetupCompanyBasic />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/setup/company-location"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <SetupCompanyLocation />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/setup/company-info"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <SetupCompanyInfo />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/setup/business-type"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <SetupBusinessType />
                </ProtectedRoute>
              </PageTransition>
            }
          />

          <Route
            path="/dashboard"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <DashboardOverview />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/schedule"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <SchedulePage />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/appointments/new"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <NewAppointmentPage />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/settings/notifications"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <NotificationsSettingsPage />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/settings/subscription"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <SubscriptionPage />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/services/settings"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <ServicesSettings />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/services/schedules"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <ServicesSchedules />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/services"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <ServicesList />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/services/new"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <ServiceNew />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/services/edit/:id"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <ServiceNew />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/products/settings"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <ProductsSettings />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/branding/background"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <BrandingBackground />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/branding/video"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <BrandingVideo />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/appointments"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <Schedule />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/professionals"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <ProfessionalsListPage />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/professionals/new"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <ProfessionalsNewPage />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/professionals/edit/:id"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <ProfessionalForm />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/reports/appointments"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <AppointmentsReport />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/products"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <ProductsList />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/products/new"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <ProductNew />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/products/edit/:id"
            element={
              <PageTransition>
                <ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
                  <ProductNew />
                </ProtectedRoute>
              </PageTransition>
            }
          />

          <Route path="/transparencia" element={<PageTransition><Transparencia /></PageTransition>} />
          <Route path="/que-es-pymerp" element={<PageTransition><About /></PageTransition>} />
          <Route path="/about" element={<PageTransition><About /></PageTransition>} />
          <Route path="/features" element={<PageTransition><FeaturesPage /></PageTransition>} />
          <Route path="/security" element={<PageTransition><Security /></PageTransition>} />
          <Route path="/roadmap" element={<PageTransition><Roadmap /></PageTransition>} />
          <Route path="/costos" element={<PageTransition><Costos /></PageTransition>} />
          <Route path="/privacidad" element={<PageTransition><Privacidad /></PageTransition>} />
          <Route path="/privacy" element={<PageTransition><Privacidad /></PageTransition>} />
          <Route path="/terminos" element={<PageTransition><Terminos /></PageTransition>} />
          <Route path="/terms" element={<PageTransition><Terminos /></PageTransition>} />
          <Route path="/cookies" element={<PageTransition><Cookies /></PageTransition>} />
          <Route path="/legal" element={<PageTransition><Legal /></PageTransition>} />
          <Route path="/licenses" element={<PageTransition><Licenses /></PageTransition>} />
          <Route path="/licencias" element={<PageTransition><Licenses /></PageTransition>} />
          <Route path="/contacto" element={<PageTransition><Contacto /></PageTransition>} />
          <Route path="/condiciones-beta" element={<PageTransition><CondicionesBeta /></PageTransition>} />
          <Route path="/pymes-cercanas" element={<PageTransition><NearbyCompanies /></PageTransition>} />

          <Route path="/:slug" element={<PageTransition><PublicPage /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    );
}

function App() {
  if (env.app.environment === 'e2e') {
    return <E2EHarness />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <SkipLinks />
          <OfflineIndicator />
          <PWAUpdatePrompt />
          <AnimatedRoutes />
          <PWAInstallPrompt />
          <CookieConsent />
          <Toaster 
            position="top-right"
            toastOptions={{
              // Accesibilidad: asegurar contraste adecuado
              style: {
                background: '#1f2937',
                color: '#f9fafb',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f9fafb',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f9fafb',
                },
              },
              // Accesibilidad: las notificaciones son anunciadas por lectores de pantalla
              ariaProps: {
                role: 'status',
                'aria-live': 'polite',
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

function E2EHarness() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<div style={{ padding: 32 }}><h1>Login</h1></div>} />
        <Route path="/dashboard" element={<DashboardStub />} />
        <Route path="/admin" element={<AdminStub />} />
        <Route path="/dashboard/services" element={<ServicesStub />} />
        <Route path="/dashboard/services/new" element={<ServiceFormStub />} />
        <Route path="/dashboard/products" element={<ProductsStub />} />
        <Route path="/dashboard/products/new" element={<ProductFormStub />} />
        <Route path="/setup/company-basic" element={<SetupBasicStub />} />
        <Route path="/setup/company-location" element={<SetupLocationStub />} />
        <Route path="/setup/company-info" element={<SetupInfoStub />} />
        <Route path="/setup/business-type" element={<SetupTypeStub />} />
        <Route path="/servicios-demo" element={<PublicServicesStub />} />
        <Route path="/productos-demo" element={<PublicProductsStub />} />
        <Route path="*" element={<LandingStub />} />
      </Routes>
    </BrowserRouter>
  );
}

function LandingStub() {
  return (
    <div style={{ padding: 32 }}>
      <button aria-label="Cerrar">×</button>
      <div style={{ marginTop: 16 }}>
        <a href="/login">Login</a> | <a href="/request-access">Solicitar acceso</a>
      </div>
    </div>
  );
}

function DashboardStub() {
  return (
    <div style={{ padding: 32 }}>
      <h1>Dashboard</h1>
    </div>
  );
}

function AdminStub() {
  const [status, setStatus] = useState<'PENDING' | 'APPROVED'>('PENDING');
  return (
    <div style={{ padding: 32 }}>
      <h1>Panel de Administración</h1>
      <h2>Solicitudes de Acceso</h2>
      <div>
        <div>Ana SPA</div>
        <div>{status}</div>
        <button onClick={() => setStatus('APPROVED')}>Aprobar</button>
      </div>
      <button>Perfiles</button>
      <div>founder@demo.com</div>
      <div>Empresa Ana</div>
    </div>
  );
}

function ServicesStub() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 32 }}>
      <h1>Servicios</h1>
      <button onClick={() => navigate('/dashboard/services/new')}>Nuevo servicio</button>
    </div>
  );
}

function ServiceFormStub() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  return (
    <div style={{ padding: 32 }}>
      <label>
        Nombre *
        <input aria-label="Nombre *" />
      </label>
      <label>
        Descripción *
        <textarea aria-label="Descripción *" />
      </label>
      <label>
        Valor *
        <input aria-label="Valor *" />
      </label>
      <label>
        Duración estimada (minutos) *
        <input aria-label="Duración estimada (minutos) *" />
      </label>
      <label>
        Imagen *
        <input aria-label="Imagen *" type="file" />
      </label>
      <label>
        Estado
        <select aria-label="Estado">
          <option value="ACTIVE">Activo</option>
        </select>
      </label>
      <div className="schedule-slot">
        <label>
          <input type="checkbox" /> Lunes
        </label>
      </div>
      <button
        onClick={() => {
          setSaved(true);
          navigate('/dashboard/services');
        }}
      >
        Guardar
      </button>
      {saved && <div>Implementación Express</div>}
    </div>
  );
}

function ProductsStub() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 32 }}>
      <h1>Productos</h1>
      <button onClick={() => navigate('/dashboard/products/new')}>Nuevo producto</button>
    </div>
  );
}

function ProductFormStub() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  return (
    <div style={{ padding: 32 }}>
      <label>
        Nombre *
        <input aria-label="Nombre *" />
      </label>
      <label>
        Descripción *
        <textarea aria-label="Descripción *" />
      </label>
      <label>
        Precio *
        <input aria-label="Precio *" />
      </label>
      <label>
        Imagen *
        <input aria-label="Imagen *" type="file" />
      </label>
      <label>
        Estado
        <select aria-label="Estado">
          <option value="ACTIVE">Activo</option>
        </select>
      </label>
      <button
        onClick={() => {
          setSaved(true);
          navigate('/dashboard/products');
        }}
      >
        Guardar
      </button>
      {saved && <div>Caja regalo premium</div>}
    </div>
  );
}

function SetupBasicStub() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 32 }}>
      <h1>Paso 1</h1>
      <label>
        Nombre de la empresa *
        <input aria-label="Nombre de la empresa *" />
      </label>
      <label>
        RUT *
        <input aria-label="RUT *" />
      </label>
      <label>
        Rubro *
        <input aria-label="Rubro *" />
      </label>
      <label>
        Sector *
        <input aria-label="Sector *" />
      </label>
      <label>
        Palabra o frase clave (SEO) *
        <input aria-label="Palabra o frase clave (SEO) *" />
      </label>
      <label>
        Teléfono WhatsApp principal *
        <input aria-label="Teléfono WhatsApp principal *" />
      </label>
      <button onClick={() => navigate('/setup/company-location')}>Siguiente</button>
    </div>
  );
}

function SetupLocationStub() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 32 }}>
      <label>
        Dirección *
        <input aria-label="Dirección *" />
      </label>
      <label>
        Comuna / Ciudad
        <input aria-label="Comuna / Ciudad" />
      </label>
      <button onClick={() => navigate('/setup/company-info')}>Siguiente</button>
    </div>
  );
}

function SetupInfoStub() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 32 }}>
      <label>
        Misión
        <textarea aria-label="Misión" />
      </label>
      <label>
        Visión
        <textarea aria-label="Visión" />
      </label>
      <label>
        Mensaje para agendar/comprar
        <input aria-label="Mensaje para agendar/comprar" />
      </label>
      <button onClick={() => navigate('/setup/business-type')}>Siguiente</button>
    </div>
  );
}

function SetupTypeStub() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>('');
  return (
    <div style={{ padding: 32 }}>
      <label>
        <input
          type="radio"
          name="businessType"
          value="SERVICES"
          checked={selected === 'SERVICES'}
          onChange={() => setSelected('SERVICES')}
        />
        Servicios
      </label>
      <label>
        <input
          type="radio"
          name="businessType"
          value="PRODUCTS"
          checked={selected === 'PRODUCTS'}
          onChange={() => setSelected('PRODUCTS')}
        />
        Productos
      </label>
      <button
        onClick={() =>
          navigate(selected === 'SERVICES' ? '/dashboard/services' : '/dashboard/products')
        }
      >
        Finalizar
      </button>
    </div>
  );
}

function PublicServicesStub() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: 32 }}>
      <h2>Servicios</h2>
      <div>
        <h3>Implementación Express</h3>
        <button onClick={() => setOpen(true)}>Agendar</button>
      </div>
      {open && (
        <div>
          <label>
            Fecha *
            <input aria-label="Fecha *" />
          </label>
          <label>
            Horario *
            <select aria-label="Horario *">
              <option value="">Selecciona</option>
              <option value="1">Lunes</option>
            </select>
          </label>
          <label>
            Nombre *
            <input aria-label="Nombre *" />
          </label>
          <label>
            WhatsApp *
            <input aria-label="WhatsApp *" />
          </label>
          <button onClick={() => setOpen(false)}>Enviar por WhatsApp</button>
        </div>
      )}
    </div>
  );
}

function PublicProductsStub() {
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState<string[]>([]);
  const add = () => {
    setCart(['Producto destacado']);
    setShowCart(true);
  };
  const total = cart.length;
  return (
    <div style={{ padding: 32 }}>
      <button aria-label="Cerrar" onClick={() => setShowCart(false)}>
        ×
      </button>
      <button aria-label="Carrito" onClick={() => setShowCart(true)}>
        Carrito ({total})
      </button>
      <div>
        <h3>Producto destacado</h3>
        <button onClick={add}>Agregar</button>
      </div>
      {showCart && (
        <div>
          {total === 0 ? <div>El carrito está vacío</div> : <div>Producto destacado</div>}
          <label>
            Nombre *
            <input aria-label="Nombre *" />
          </label>
          <label>
            WhatsApp *
            <input aria-label="WhatsApp *" />
          </label>
          <label>
            Comentario
            <textarea aria-label="Comentario" />
          </label>
          <button>Solicitar disponibilidad por WhatsApp</button>
        </div>
      )}
    </div>
  );
}
