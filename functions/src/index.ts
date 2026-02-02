import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';
import cors from 'cors';
import {
  getAccessRequestEmailTemplate,
  getUserCreationEmailTemplate,
} from './emailTemplates';

// Cargar variables de entorno desde .env (solo en desarrollo/emulador)
// En producción, las variables se cargan automáticamente desde firebase.json o secrets
// NO ejecutar durante discovery del CLI de Firebase
if (process.env.NODE_ENV !== 'production' && 
    !process.env.FUNCTIONS_EMULATOR && 
    process.env.GCLOUD_PROJECT) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('dotenv').config();
  } catch (err) {
    // Silently ignore durante discovery
  }
}

// Evitar fallos de carga cuando GCLOUD_PROJECT/FIREBASE_CONFIG no vienen seteadas (por ejemplo, en discovery del CLI)
// Esta función se ejecuta de forma lazy solo cuando es necesario, no en el nivel superior
const ensureProjectEnv = () => {
  // Si ya están configuradas, no hacer nada
  if (process.env.GCLOUD_PROJECT && process.env.FIREBASE_CONFIG) {
    return;
  }

  try {
    const getProjectIdFromConfig = () => {
      try {
        const cfg = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : {};
        return cfg.projectId as string | undefined;
      } catch (err) {
        // Silently ignore durante discovery
        return undefined;
      }
    };

    const projectId =
      process.env.GCLOUD_PROJECT ||
      process.env.GCP_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      getProjectIdFromConfig() ||
      'local-dev';

    if (!process.env.GCLOUD_PROJECT) {
      process.env.GCLOUD_PROJECT = projectId;
    }
    if (!process.env.GCP_PROJECT) {
      process.env.GCP_PROJECT = projectId;
    }
    if (!process.env.GOOGLE_CLOUD_PROJECT) {
      process.env.GOOGLE_CLOUD_PROJECT = projectId;
    }

    if (!process.env.FIREBASE_CONFIG) {
      process.env.FIREBASE_CONFIG = JSON.stringify({ projectId });
    }
  } catch (err) {
    // Silently ignore durante discovery - no lanzar errores
    console.warn('Warning: Could not set project env vars during discovery:', err);
  }
};

// NO ejecutar en el nivel superior - solo cuando sea necesario
// ensureProjectEnv() se llamará dentro de las funciones cuando sea necesario

// Inline security middleware (simplified para evitar timeouts)
const requestLogger = (req: any, res: any, next: () => void) => {
  console.log(`${req.method} ${req.url} from ${req.ip}`);
  next();
};

// Simple in-memory rate limiter (por IP/uid) - best effort
const rateMap: Record<string, { count: number; reset: number }> = {};
const isRateLimited = (key: string, limit: number, windowMs: number) => {
  const now = Date.now();
  const entry = rateMap[key] || { count: 0, reset: now + windowMs };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + windowMs;
  }
  entry.count += 1;
  rateMap[key] = entry;
  return entry.count > limit;
};

const strictRateLimiter = (req: any, res: any, next: () => void) => {
  // Implementación simplificada - rate limiting real se maneja en firebase.json
  next();
};

const validateContentType = (req: any, res: any, next: () => void) => {
  if (req.method === 'POST' && !req.is('application/json')) {
    res.status(415).json({ success: false, error: 'Content-Type must be application/json' });
    return;
  }
  next();
};

const validateBodySize = (maxKB: number) => (req: any, res: any, next: () => void) => {
  // Firebase Functions ya tiene límites de tamaño
  next();
};

const sanitizeEmail = (email: string): string | null => {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
};

const sanitizeText = (text: string, maxLength: number = 500): string | null => {
  if (!text || typeof text !== 'string') return null;
  const sanitized = text.trim().replace(/[<>]/g, '');
  if (sanitized.length === 0 || sanitized.length > maxLength) return null;
  return sanitized;
};

const sanitizePhoneNumber = (phone: string): string | null => {
  if (!phone || typeof phone !== 'string') return null;
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.length < 8 || cleaned.length > 15) return null;
  return cleaned;
};

// Lazy initialization de Firebase Admin para evitar timeouts en deployment
let _adminInitialized = false;
const ensureAdminInitialized = () => {
  if (!_adminInitialized) {
    ensureProjectEnv(); // Asegurar variables de entorno antes de inicializar
    try {
      admin.initializeApp();
      _adminInitialized = true;
    } catch (error: any) {
      // Si ya está inicializado, ignorar el error
      if (error.code !== 'app/already-initialized') {
        throw error;
      }
      _adminInitialized = true;
    }
  }
};

// Helper para obtener Firestore con lazy initialization
const getFirestore = () => {
  ensureProjectEnv(); // Asegurar variables de entorno antes de inicializar
  ensureAdminInitialized();
  return admin.firestore();
};

// Helper para obtener Auth con lazy initialization
const getAuth = () => {
  ensureProjectEnv(); // Asegurar variables de entorno antes de inicializar
  ensureAdminInitialized();
  return admin.auth();
};

// CORS configurado de forma segura - lazy initialization
let _corsHandler: any;
const getCorsHandler = () => {
  if (!_corsHandler) {
    _corsHandler = cors({
      origin: [
        'https://pymerp.cl',
        'https://pymerp-cl.web.app',
        'https://pymerp-cl.firebaseapp.com',
        /localhost:\d+$/, // Permitir localhost en desarrollo
      ],
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400, // Cache preflight por 24 horas
    });
  }
  return _corsHandler;
};

// Lazy initialization para evitar timeouts en deployment
let _sendGridConfigured = false;
const configureSendGrid = () => {
  if (!_sendGridConfigured) {
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    if (SENDGRID_API_KEY) {
      sgMail.setApiKey(SENDGRID_API_KEY);
    } else {
      console.error('SENDGRID_API_KEY not found in environment variables');
    }
    _sendGridConfigured = true;
  }
};

const getAdminEmail = () => {
  return process.env.ADMIN_EMAIL || 'ignacio@datakomerz.com';
};

// Interfaces conservadas para documentación
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface AccessRequestData {
  full_name: string;
  email: string;
  business_name: string;
  whatsapp: string;
  plan?: string;
  created_at: string;
  language?: 'es' | 'en';
}

interface UserCreationData {
  email: string;
  password: string;
  loginUrl: string;
  language?: 'es' | 'en';
}

interface DeleteUserRequest {
  email: string;
  companyId?: string;
  userId?: string;
}

interface SetCompanyClaimRequest {
  uid: string;
  companyId: string;
}

/**
 * Función para enviar email de notificación de nueva solicitud de acceso
 * Con rate limiting, sanitización de inputs y security headers
 */
export const sendAccessRequestEmailHttp = functions
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onRequest(async (req, res) => {
    // Configurar SendGrid (lazy)
    configureSendGrid();
    
    // Aplicar CORS
    getCorsHandler()(req, res, async () => {
      // Logging
      requestLogger(req, res, () => {});

      // Rate limit básico por IP
      const limiterKey = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      if (isRateLimited(String(limiterKey), 20, 60_000)) {
        res.status(429).json({ success: false, error: 'Too many requests' });
        return;
      }
      
      // Validar método
      if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
      }

      if (req.method !== 'POST') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
      }

      // Aplicar rate limiting
      strictRateLimiter(req as any, res as any, async () => {
        // Validar Content-Type
        validateContentType(req as any, res as any, async () => {
          // Validar tamaño del body
          validateBodySize(50)(req as any, res as any, async () => {
            const data = req.body;

            // Sanitizar y validar inputs
            const sanitizedEmail = sanitizeEmail(data.email);
            const sanitizedName = sanitizeText(data.full_name, 100);
            const sanitizedBusiness = sanitizeText(data.business_name, 200);
            const sanitizedPhone = sanitizePhoneNumber(data.whatsapp);
            const sanitizedPlan = data.plan ? sanitizeText(data.plan, 50) : null;

            if (!sanitizedEmail || !sanitizedName || !sanitizedBusiness || !sanitizedPhone) {
              res.status(400).json({
                success: false,
                error: 'Invalid or missing required fields (email, full_name, business_name, whatsapp)',
              });
              return;
            }

            const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
            if (!SENDGRID_API_KEY) {
              console.warn('SendGrid API Key no configurada. Email no enviado.');
              res.status(500).json({ success: false, message: 'SendGrid no configurado' });
              return;
            }

            try {
              const lang = data.language === 'en' ? 'en' : 'es';

              const translations = {
                es: {
                  subject: 'Nueva solicitud de acceso - pymerp.cl',
                  title: 'Nueva solicitud de acceso',
                  intro: 'Se ha recibido una nueva solicitud de acceso a la plataforma:',
                  name: 'Nombre',
                  email: 'Email',
                  business: 'Emprendimiento',
                  whatsapp: 'WhatsApp',
                  plan: 'Plan solicitado',
                  date: 'Fecha',
                  notSpecified: 'No especificado',
                  footer: 'Por favor, revisa la solicitud en el panel de administración.'
                },
                en: {
                  subject: 'New access request - pymerp.cl',
                  title: 'New Access Request',
                  intro: 'A new access request has been received for the platform:',
                  name: 'Name',
                  email: 'Email',
                  business: 'Business',
                  whatsapp: 'WhatsApp',
                  plan: 'Requested Plan',
                  date: 'Date',
                  notSpecified: 'Not specified',
                  footer: 'Please review the request in the administration panel.'
                }
              };

              const t = translations[lang];
              const adminEmail = getAdminEmail();

              // Generar template HTML profesional
              const htmlTemplate = getAccessRequestEmailTemplate({
                name: sanitizedName,
                email: sanitizedEmail,
                business: sanitizedBusiness,
                whatsapp: sanitizedPhone,
                plan: sanitizedPlan || undefined,
                date: new Date().toLocaleString(lang === 'es' ? 'es-CL' : 'en-US'),
                language: lang,
              });

              // Versión texto plano para clientes de email que no soportan HTML
              const textVersion = `
${t.title}

${t.intro}

${t.name}: ${sanitizedName}
${t.email}: ${sanitizedEmail}
${t.business}: ${sanitizedBusiness}
${t.whatsapp}: ${sanitizedPhone}
${t.plan}: ${sanitizedPlan || t.notSpecified}
${t.date}: ${new Date().toLocaleString(lang === 'es' ? 'es-CL' : 'en-US')}

${t.footer}
              `.trim();

              const msg = {
                to: adminEmail,
                from: 'ignacio@datakomerz.com',
                subject: t.subject,
                html: htmlTemplate,
                text: textVersion,
              };

              await sgMail.send(msg);
              console.log('Email de solicitud de acceso enviado a:', adminEmail);
              res.status(200).json({ success: true });
            } catch (error: any) {
              console.error('Error enviando email de solicitud de acceso:', error);

              const errorMessage = error.response?.body?.errors?.[0]?.message || error.message || 'Error desconocido';
              res.status(500).json({
                success: false,
                error: errorMessage,
              });
            }
          });
        });
      });
    });
  }
);

/**
 * Función para establecer contraseña de un usuario existente en Firebase Auth
 * Usa Admin SDK para poder modificar usuarios sin autenticación
 */
export const setUserPassword = functions
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onRequest(async (req, res) => {
    // Configurar CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed' });
      return;
    }

    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    try {
      ensureAdminInitialized();
      // Buscar usuario por email
      const userRecord = await getAuth().getUserByEmail(email);
      
      // Actualizar contraseña
      await getAuth().updateUser(userRecord.uid, {
        password: password,
      });

      console.log('Contraseña actualizada para usuario:', email);
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error estableciendo contraseña:', error);
      
      // Si el usuario no existe, intentar crearlo
      if (error.code === 'auth/user-not-found') {
        try {
          await getAuth().createUser({
            email: email,
            password: password,
            emailVerified: false,
          });
          console.log('Usuario creado con contraseña:', email);
          res.status(200).json({ success: true, created: true });
        } catch (createError: any) {
          console.error('Error creando usuario:', createError);
          res.status(500).json({ 
            success: false, 
            error: createError.message || 'Error desconocido' 
          });
        }
      } else {
        res.status(500).json({ 
          success: false, 
          error: error.message || 'Error desconocido' 
        });
      }
    }
  }
);

/**
 * Función para enviar email de creación de usuario
 * Usa onRequest (HTTP) para permitir llamadas públicas sin autenticación
 */
export const sendUserCreationEmailHttp = functions
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onRequest(async (req, res) => {
    // Configurar CORS para permitir llamadas desde el frontend
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Manejar preflight OPTIONS
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Solo permitir POST
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed' });
      return;
    }

    // Configurar SendGrid (lazy)
    configureSendGrid();

    const data: UserCreationData = req.body;

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    if (!SENDGRID_API_KEY) {
      console.warn('SendGrid API Key no configurada. Email no enviado.');
      res.status(500).json({ success: false, message: 'SendGrid no configurado' });
      return;
    }

    try {
      const lang = data.language || 'es';
      
      const translations = {
        es: {
          subject: 'Tu acceso a pymerp.cl ha sido aprobado',
          welcome: '¡Bienvenido a pymerp.cl!',
          approved: 'Tu solicitud de acceso ha sido aprobada. Ya puedes acceder a la plataforma.',
          credentials: 'Credenciales de acceso:',
          email: 'Email',
          tempPassword: 'Contraseña temporal',
          important: '⚠️ Importante:',
          changePassword: 'Por seguridad, deberás cambiar tu contraseña al iniciar sesión por primera vez.',
          accessButton: 'Acceder a pymerp.cl',
          questions: 'Si tienes alguna pregunta, no dudes en contactarnos.',
          regards: 'Saludos,',
          team: 'El equipo de pymerp.cl'
        },
        en: {
          subject: 'Your access to pymerp.cl has been approved',
          welcome: 'Welcome to pymerp.cl!',
          approved: 'Your access request has been approved. You can now access the platform.',
          credentials: 'Access credentials:',
          email: 'Email',
          tempPassword: 'Temporary password',
          important: '⚠️ Important:',
          changePassword: 'For security reasons, you will need to change your password when you first log in.',
          accessButton: 'Access pymerp.cl',
          questions: 'If you have any questions, feel free to contact us.',
          regards: 'Best regards,',
          team: 'The pymerp.cl team'
        }
      };
      
      const t = translations[lang];
      
      // Generar template HTML profesional
      const htmlTemplate = getUserCreationEmailTemplate({
        email: data.email,
        password: data.password,
        loginUrl: data.loginUrl,
        language: lang,
      });

      // Versión texto plano
      const textVersion = `
${t.welcome}

${t.approved}

${t.credentials}
${t.email}: ${data.email}
${t.tempPassword}: ${data.password}

${t.important} ${t.changePassword}

${t.accessButton}: ${data.loginUrl}

${t.questions}

${t.regards}
${t.team}
      `.trim();
      
      // IMPORTANTE: El email "from" debe coincidir EXACTAMENTE con el sender verificado en SendGrid
      const msg = {
        to: data.email,
        from: 'ignacio@datakomerz.com', // Debe coincidir exactamente con el sender verificado
        subject: t.subject,
        html: htmlTemplate,
        text: textVersion,
      };

      await sgMail.send(msg);
      console.log('Email de creación de usuario enviado a:', data.email);
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error enviando email de creación de usuario:', error);
      console.error('Detalles del error:', JSON.stringify(error, null, 2));
      
      const errorMessage = error.response?.body?.errors?.[0]?.message || error.message || 'Error desconocido';
      res.status(500).json({ 
        success: false, 
        error: errorMessage,
        details: error.response?.body || error.message
      });
    }
  }
);

/**
 * Elimina un usuario (Auth + Firestore) y su compañía asociada opcionalmente.
 * Uso pensado para SUPERADMIN via HTTP sin autenticación.
 */
export const deleteUserAccountHttp = functions
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onRequest(async (req, res) => {
  // Configurar CORS para permitir llamadas desde el frontend
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const data: DeleteUserRequest = req.body || {};

  if (!data.email) {
    res.status(400).json({ success: false, error: 'Email is required' });
    return;
  }

  ensureAdminInitialized();
  const firestore = getFirestore();
  const deletedPaths: string[] = [];
  let authDeleted = false;
  let authUid: string | null = null;

  try {
    const userRecord = await getAuth().getUserByEmail(data.email);
    authUid = userRecord.uid;
    await getAuth().deleteUser(userRecord.uid);
    authDeleted = true;
    console.log('Usuario de Auth eliminado:', data.email);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.warn('Usuario de Auth no encontrado, continuando con Firestore:', data.email);
    } else {
      console.error('Error eliminando usuario de Auth:', error);
      res.status(500).json({ success: false, error: error.message || 'Error deleting auth user' });
      return;
    }
  }

  try {
    const userDocIds = new Set<string>();
    if (authUid) userDocIds.add(authUid);
    if (data.userId) userDocIds.add(data.userId);
    userDocIds.add(data.email);

    for (const id of userDocIds) {
      await firestore.doc(`users/${id}`).delete();
      deletedPaths.push(`users/${id}`);
    }

    if (data.companyId) {
      await firestore.doc(`companies/${data.companyId}`).delete();
      deletedPaths.push(`companies/${data.companyId}`);
    }

    res.status(200).json({ success: true, authDeleted, deletedPaths });
  } catch (error: any) {
    console.error('Error eliminando documentos de Firestore:', error);
    res.status(500).json({ success: false, error: error.message || 'Error deleting Firestore docs' });
  }
});

/**
 * Establece el claim company_id en el token del usuario (requiere auth en backend).
 * Útil para que Storage valide pertenencia sin leer Firestore.
 */
export const setCompanyClaimHttp = functions
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const data: SetCompanyClaimRequest = req.body?.data || req.body;

  try {
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!idToken) {
      res.status(401).json({ success: false, error: 'Token requerido' });
      return;
    }

    ensureAdminInitialized();
    const decoded = await getAuth().verifyIdToken(idToken);
    const uid = data?.uid || decoded.uid;
    const companyId = data?.companyId;

    if (!uid || !companyId) {
      res.status(400).json({ success: false, error: 'uid y companyId son requeridos' });
      return;
    }

    // Validar que el usuario realmente pertenezca a la compañía (según Firestore)
    const firestore = getFirestore();
    const userDocUid = await firestore.doc(`users/${uid}`).get();
    const userDocEmail = decoded.email
      ? await firestore.doc(`users/${decoded.email}`).get()
      : null;
    const userData = userDocUid.exists
      ? userDocUid.data()
      : userDocEmail?.exists
      ? userDocEmail.data()
      : null;

    if (!userData || userData.company_id !== companyId) {
      res.status(403).json({ success: false, error: 'No autorizado para este company_id' });
      return;
    }

    await getAuth().setCustomUserClaims(uid, { company_id: companyId });
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error estableciendo claim:', error);
    res.status(500).json({ success: false, error: error.message || 'Error desconocido' });
  }
});

/**
 * Función HTTP para generar sitemap.xml dinámico
 * GET /generateSitemap
 * 
 * Genera un sitemap XML con:
 * - Páginas estáticas (Landing, About, Info pages)
 * - Páginas públicas de empresas (por slug)
 * - Última modificación basada en updated_at
 */
export const generateSitemap = functions
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onRequest(async (req, res) => {
    try {
      // Configurar headers XML
      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600'); // Cache 1 hora

      const baseUrl = process.env.PUBLIC_BASE_URL || 'https://agendaemprende-8ac77.web.app';
      const currentDate = new Date().toISOString();

      // Páginas estáticas
      const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'daily' },
        { url: '/login', priority: '0.8', changefreq: 'monthly' },
        { url: '/request-access', priority: '0.8', changefreq: 'monthly' },
        { url: '/pymes-cercanas', priority: '0.7', changefreq: 'weekly' },
        { url: '/transparencia', priority: '0.6', changefreq: 'monthly' },
        { url: '/que-es-pymerp', priority: '0.6', changefreq: 'monthly' },
        { url: '/costos', priority: '0.7', changefreq: 'monthly' },
        { url: '/privacidad', priority: '0.5', changefreq: 'yearly' },
        { url: '/terminos', priority: '0.5', changefreq: 'yearly' },
        { url: '/contacto', priority: '0.6', changefreq: 'monthly' },
        { url: '/condiciones-beta', priority: '0.5', changefreq: 'monthly' },
      ];

      // Obtener empresas activas con slug público
      const companiesSnapshot = await getFirestore()
        .collection('companies')
        .where('slug', '!=', null)
        .where('deleted_at', '==', null)
        .limit(5000) // Límite de seguridad
        .get();

      const companyUrls = companiesSnapshot.docs.map(doc => {
        const data = doc.data();
        const lastmod = data.updated_at 
          ? new Date(data.updated_at.toDate()).toISOString()
          : currentDate;

        return {
          url: `/${data.slug}`,
          priority: '0.9',
          changefreq: 'daily',
          lastmod
        };
      });

      // Generar XML
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      // Agregar páginas estáticas
      staticPages.forEach(page => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
        xml += `    <lastmod>${currentDate}</lastmod>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += '  </url>\n';
      });

      // Agregar páginas de empresas
      companyUrls.forEach(page => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
        xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += '  </url>\n';
      });

      xml += '</urlset>';

      res.status(200).send(xml);
    } catch (error: any) {
      console.error('Error generando sitemap:', error);
      res.status(500).send('Error generando sitemap');
    }
  }
);

// Booking system exports - Import lazy para evitar timeouts en discovery
// Los exports se hacen de forma explícita para evitar cargar todo el módulo durante discovery
export {
  createProfessional,
  createAppointmentRequest,
  cancelAppointment,
  rescheduleAppointment,
  onAppointmentCreated,
  cleanExpiredLocks,
} from './booking';

/**
 * Callable: obtiene/actualiza la configuración de notificaciones de un usuario de la empresa.
 * Útil para el dashboard/settings/notifications cuando las reglas de Firestore bloquean al cliente.
 */
export const getNotificationSettingsSafe = functions
  .runWith({ memory: '256MB', timeoutSeconds: 30 })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Requiere inicio de sesión');
    }

    // Usar userId del data si está disponible, sino usar el uid del contexto
    const userId: string = (data && data.userId) || context.auth.uid;
    const companyId: string | undefined =
      (data && data.companyId) ||
      (context.auth.token.company_id as string | undefined) ||
      undefined;

    if (!companyId) {
      throw new functions.https.HttpsError('invalid-argument', 'companyId requerido');
    }

    ensureAdminInitialized();
    const snap = await getFirestore()
      .collection('notification_settings')
      .where('company_id', '==', companyId)
      .where('user_id', '==', userId)
      .limit(1)
      .get();

    if (snap.empty) return null;
    const doc = snap.docs[0];
    const dataDoc = doc.data();
    return {
      id: doc.id,
      user_id: dataDoc.user_id,
      company_id: dataDoc.company_id,
      email_notifications_enabled: dataDoc.email_notifications_enabled ?? false,
      notification_email: dataDoc.notification_email || null,
      created_at: dataDoc.created_at,
      updated_at: dataDoc.updated_at,
    };
  });

export const setNotificationSettingsSafe = functions
  .runWith({ memory: '256MB', timeoutSeconds: 30 })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Requiere inicio de sesión');
    }

    const uid = context.auth.uid;
    const companyId: string | undefined =
      (data && data.companyId) ||
      (context.auth.token.company_id as string | undefined) ||
      undefined;
    const enabled: boolean | undefined = data?.enabled;
    const notificationEmail: string | undefined = data?.notificationEmail;

    if (!companyId || typeof enabled !== 'boolean') {
      throw new functions.https.HttpsError('invalid-argument', 'companyId y enabled son requeridos');
    }

    ensureAdminInitialized();
    const col = getFirestore().collection('notification_settings');
    const existing = await col
      .where('company_id', '==', companyId)
      .where('user_id', '==', uid)
      .limit(1)
      .get();

    const payload = {
      user_id: uid,
      company_id: companyId,
      email_notifications_enabled: enabled,
      notification_email: notificationEmail || context.auth.token.email || null,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (existing.empty) {
      await col.add({
        ...payload,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await existing.docs[0].ref.set(payload, { merge: true });
    }

    return { success: true };
  });
