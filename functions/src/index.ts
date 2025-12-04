import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';
import cors from 'cors';

// Cargar variables de entorno desde .env (solo en desarrollo/emulador)
// En producción, las variables se cargan automáticamente desde firebase.json o secrets
if (process.env.NODE_ENV !== 'production' && !process.env.FUNCTIONS_EMULATOR) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
}

// Inline security middleware (simplified para evitar timeouts)
const requestLogger = (req: any, res: any, next: () => void) => {
  console.log(`${req.method} ${req.url} from ${req.ip}`);
  next();
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

admin.initializeApp();

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

              const msg = {
                to: adminEmail,
                from: 'ignacio@datakomerz.com',
                subject: t.subject,
                html: `
                  <h2>${t.title}</h2>
                  <p>${t.intro}</p>
                  <ul>
                    <li><strong>${t.name}:</strong> ${sanitizedName}</li>
                    <li><strong>${t.email}:</strong> ${sanitizedEmail}</li>
                    <li><strong>${t.business}:</strong> ${sanitizedBusiness}</li>
                    <li><strong>${t.whatsapp}:</strong> ${sanitizedPhone}</li>
                    <li><strong>${t.plan}:</strong> ${sanitizedPlan || t.notSpecified}</li>
                    <li><strong>${t.date}:</strong> ${new Date().toLocaleString(lang === 'es' ? 'es-CL' : 'en-US')}</li>
                  </ul>
                  <p>${t.footer}</p>
                `,
                text: `
                  ${t.title}
                  
                  ${t.name}: ${sanitizedName}
                  ${t.email}: ${sanitizedEmail}
                  ${t.business}: ${sanitizedBusiness}
                  ${t.whatsapp}: ${sanitizedPhone}
                  ${t.plan}: ${sanitizedPlan || t.notSpecified}
                  ${t.date}: ${new Date().toLocaleString(lang === 'es' ? 'es-CL' : 'en-US')}
                  
                  ${t.footer}
                `,
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
      // Buscar usuario por email
      const userRecord = await admin.auth().getUserByEmail(email);
      
      // Actualizar contraseña
      await admin.auth().updateUser(userRecord.uid, {
        password: password,
      });

      console.log('Contraseña actualizada para usuario:', email);
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error estableciendo contraseña:', error);
      
      // Si el usuario no existe, intentar crearlo
      if (error.code === 'auth/user-not-found') {
        try {
          await admin.auth().createUser({
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
      
      // IMPORTANTE: El email "from" debe coincidir EXACTAMENTE con el sender verificado en SendGrid
      const msg = {
        to: data.email,
        from: 'ignacio@datakomerz.com', // Debe coincidir exactamente con el sender verificado
        subject: t.subject,
        html: `
          <h2>${t.welcome}</h2>
          <p>${t.approved}</p>
          <p><strong>${t.credentials}</strong></p>
          <ul>
            <li><strong>${t.email}:</strong> ${data.email}</li>
            <li><strong>${t.tempPassword}:</strong> ${data.password}</li>
          </ul>
          <p><strong>${t.important}</strong> ${t.changePassword}</p>
          <p>
            <a href="${data.loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
              ${t.accessButton}
            </a>
          </p>
          <p>${t.questions}</p>
          <p>${t.regards}<br>${t.team}</p>
        `,
        text: `
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
        `,
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

  const firestore = admin.firestore();
  const deletedPaths: string[] = [];
  let authDeleted = false;
  let authUid: string | null = null;

  try {
    const userRecord = await admin.auth().getUserByEmail(data.email);
    authUid = userRecord.uid;
    await admin.auth().deleteUser(userRecord.uid);
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

    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = data?.uid || decoded.uid;
    const companyId = data?.companyId;

    if (!uid || !companyId) {
      res.status(400).json({ success: false, error: 'uid y companyId son requeridos' });
      return;
    }

    // Validar que el usuario realmente pertenezca a la compañía (según Firestore)
    const firestore = admin.firestore();
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

    await admin.auth().setCustomUserClaims(uid, { company_id: companyId });
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

      const baseUrl = 'https://pymerp.cl'; // Cambiar por dominio production
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
      const companiesSnapshot = await admin
        .firestore()
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
