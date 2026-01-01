/**
 * Templates de email profesionales para pymerp.cl
 * Diseñados con branding consistente y responsive
 */

export interface EmailTemplateData {
  title: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
  footerText?: string;
  language?: 'es' | 'en';
}

/**
 * Genera el template base HTML con branding de pymerp.cl
 */
export function getEmailTemplate(data: EmailTemplateData): string {
  const isSpanish = data.language !== 'en';
  
  const defaultFooter = isSpanish
    ? 'Este es un email automático, por favor no respondas a este mensaje.'
    : 'This is an automated email, please do not reply to this message.';

  return `
<!DOCTYPE html>
<html lang="${data.language || 'es'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${data.title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Contenedor principal -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header con logo y gradiente -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                PyM-ERP
              </h1>
              <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px; font-weight: 400;">
                Sistema de Gestión para PYMES
              </p>
            </td>
          </tr>
          
          <!-- Contenido principal -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600; line-height: 1.3;">
                ${data.title}
              </h2>
              
              <div style="color: #374151; font-size: 16px; line-height: 1.6;">
                ${data.content}
              </div>
              
              ${data.buttonText && data.buttonUrl ? `
              <!-- Botón CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.buttonUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                      ${data.buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                ${data.footerText || defaultFooter}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                © ${new Date().getFullYear()} PyM-ERP. Todos los derechos reservados.<br>
                <a href="https://www.pymerp.cl" style="color: #2563eb; text-decoration: none;">www.pymerp.cl</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Template para email de nueva solicitud de acceso (admin)
 */
export function getAccessRequestEmailTemplate(data: {
  name: string;
  email: string;
  business: string;
  whatsapp: string;
  plan?: string;
  date: string;
  language?: 'es' | 'en';
}): string {
  const isSpanish = data.language !== 'en';
  
  const translations = {
    es: {
      title: 'Nueva solicitud de acceso',
      intro: 'Se ha recibido una nueva solicitud de acceso a la plataforma PyM-ERP:',
      name: 'Nombre completo',
      email: 'Correo electrónico',
      business: 'Emprendimiento',
      whatsapp: 'WhatsApp',
      plan: 'Plan solicitado',
      date: 'Fecha de solicitud',
      notSpecified: 'No especificado',
      footer: 'Por favor, revisa la solicitud en el panel de administración para aprobar o rechazar el acceso.',
    },
    en: {
      title: 'New access request',
      intro: 'A new access request has been received for the PyM-ERP platform:',
      name: 'Full name',
      email: 'Email address',
      business: 'Business',
      whatsapp: 'WhatsApp',
      plan: 'Requested plan',
      date: 'Request date',
      notSpecified: 'Not specified',
      footer: 'Please review the request in the administration panel to approve or reject access.',
    }
  };
  
  const t = translations[isSpanish ? 'es' : 'en'];
  
  const content = `
    <p style="margin: 0 0 24px 0;">${t.intro}</p>
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <tr>
        <td>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151; font-size: 14px;">${t.name}:</strong>
                <span style="color: #6b7280; font-size: 14px; margin-left: 8px;">${data.name}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151; font-size: 14px;">${t.email}:</strong>
                <span style="color: #6b7280; font-size: 14px; margin-left: 8px;">${data.email}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151; font-size: 14px;">${t.business}:</strong>
                <span style="color: #6b7280; font-size: 14px; margin-left: 8px;">${data.business}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151; font-size: 14px;">${t.whatsapp}:</strong>
                <span style="color: #6b7280; font-size: 14px; margin-left: 8px;">${data.whatsapp}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151; font-size: 14px;">${t.plan}:</strong>
                <span style="color: #6b7280; font-size: 14px; margin-left: 8px;">${data.plan || t.notSpecified}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <strong style="color: #374151; font-size: 14px;">${t.date}:</strong>
                <span style="color: #6b7280; font-size: 14px; margin-left: 8px;">${data.date}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px;">${t.footer}</p>
  `;
  
  return getEmailTemplate({
    title: t.title,
    content,
    footerText: t.footer,
    language: data.language,
  });
}

/**
 * Template para email de creación de usuario/aprobación
 */
export function getUserCreationEmailTemplate(data: {
  email: string;
  password: string;
  loginUrl: string;
  language?: 'es' | 'en';
}): string {
  const isSpanish = data.language !== 'en';
  
  const translations = {
    es: {
      title: '¡Bienvenido a PyM-ERP!',
      welcome: 'Tu solicitud de acceso ha sido aprobada',
      intro: 'Estamos emocionados de darte la bienvenida a PyM-ERP. Tu cuenta ha sido creada y ya puedes comenzar a gestionar tu negocio.',
      credentials: 'Tus credenciales de acceso:',
      emailLabel: 'Correo electrónico',
      passwordLabel: 'Contraseña temporal',
      important: '⚠️ Importante',
      changePassword: 'Por seguridad, deberás cambiar tu contraseña al iniciar sesión por primera vez.',
      buttonText: 'Acceder a PyM-ERP',
      questions: 'Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. Estamos aquí para ayudarte.',
      regards: 'Saludos,',
      team: 'El equipo de PyM-ERP',
      footer: 'Este email contiene información confidencial. Si no solicitaste este acceso, por favor ignora este mensaje.',
    },
    en: {
      title: 'Welcome to PyM-ERP!',
      welcome: 'Your access request has been approved',
      intro: 'We are excited to welcome you to PyM-ERP. Your account has been created and you can now start managing your business.',
      credentials: 'Your access credentials:',
      emailLabel: 'Email address',
      passwordLabel: 'Temporary password',
      important: '⚠️ Important',
      changePassword: 'For security reasons, you will need to change your password when you first log in.',
      buttonText: 'Access PyM-ERP',
      questions: 'If you have any questions or need help, feel free to contact us. We are here to help you.',
      regards: 'Best regards,',
      team: 'The PyM-ERP team',
      footer: 'This email contains confidential information. If you did not request this access, please ignore this message.',
    }
  };
  
  const t = translations[isSpanish ? 'es' : 'en'];
  
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 18px; color: #059669; font-weight: 600;">
      ${t.welcome}
    </p>
    
    <p style="margin: 0 0 24px 0;">${t.intro}</p>
    
    <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; margin: 24px 0; border-radius: 6px;">
      <p style="margin: 0 0 16px 0; font-weight: 600; color: #1e40af; font-size: 16px;">
        ${t.credentials}
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #374151; font-size: 14px;">${t.emailLabel}:</strong>
            <span style="color: #6b7280; font-size: 14px; margin-left: 8px; font-family: 'Courier New', monospace;">${data.email}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #374151; font-size: 14px;">${t.passwordLabel}:</strong>
            <span style="color: #6b7280; font-size: 14px; margin-left: 8px; font-family: 'Courier New', monospace; background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${data.password}</span>
          </td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 6px;">
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
        <strong>${t.important}</strong><br>
        ${t.changePassword}
      </p>
    </div>
    
    <p style="margin: 24px 0 0 0;">${t.questions}</p>
    
    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px;">
      ${t.regards}<br>
      <strong style="color: #111827;">${t.team}</strong>
    </p>
  `;
  
  return getEmailTemplate({
    title: t.title,
    content,
    buttonText: t.buttonText,
    buttonUrl: data.loginUrl,
    footerText: t.footer,
    language: data.language,
  });
}

/**
 * Template para email de recuperación de contraseña
 */
export function getPasswordResetEmailTemplate(data: {
  resetUrl: string;
  language?: 'es' | 'en';
}): string {
  const isSpanish = data.language !== 'en';
  
  const translations = {
    es: {
      title: 'Recuperar tu contraseña',
      greeting: 'Hola!',
      intro: 'Haz clic en el siguiente enlace para cambiar la contraseña de tu cuenta en PyM-ERP.',
      buttonText: 'Recuperar contraseña',
      warning: 'Si no has solicitado este cambio',
      ignore: 'Si no has solicitado este cambio, ignora este correo electrónico de forma segura. Tu contraseña no será modificada.',
      expires: 'Este enlace expirará en 1 hora por seguridad.',
      regards: 'Gracias,',
      team: 'El equipo de PyM-ERP',
      footer: 'Este enlace es válido por 1 hora. Si no solicitaste este cambio, ignora este email.',
    },
    en: {
      title: 'Reset your password',
      greeting: 'Hello!',
      intro: 'Click the following link to change the password for your PyM-ERP account.',
      buttonText: 'Reset password',
      warning: 'If you did not request this change',
      ignore: 'If you did not request this change, you can safely ignore this email. Your password will not be changed.',
      expires: 'This link will expire in 1 hour for security reasons.',
      regards: 'Thanks,',
      team: 'The PyM-ERP team',
      footer: 'This link is valid for 1 hour. If you did not request this change, please ignore this email.',
    }
  };
  
  const t = translations[isSpanish ? 'es' : 'en'];
  
  const content = `
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">${t.greeting}</p>
    
    <p style="margin: 0 0 24px 0; color: #374151; line-height: 1.6;">${t.intro}</p>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 6px;">
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
        <strong>${t.warning}</strong><br>
        ${t.ignore}
      </p>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
      ${t.expires}
    </p>
    
    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px;">
      ${t.regards}<br>
      <strong style="color: #111827;">${t.team}</strong>
    </p>
  `;
  
  return getEmailTemplate({
    title: t.title,
    content,
    buttonText: t.buttonText,
    buttonUrl: data.resetUrl,
    footerText: t.footer,
    language: data.language,
  });
}

/**
 * Template para email de verificación de email
 */
export function getEmailVerificationTemplate(data: {
  verificationUrl: string;
  displayName?: string;
  language?: 'es' | 'en';
}): string {
  const isSpanish = data.language !== 'en';
  
  const translations = {
    es: {
      title: 'Verifica tu correo electrónico',
      greeting: (name?: string) => name ? `Hola, ${name}:` : 'Hola:',
      intro: 'Haz clic en este enlace para verificar tu dirección de correo electrónico.',
      buttonText: 'Verificar correo electrónico',
      warning: 'Si no has emitido esta solicitud',
      ignore: 'Si no has emitido esta solicitud, ignora este mensaje de forma segura.',
      regards: 'Gracias,',
      team: 'El equipo de PyM-ERP',
      footer: 'Este enlace es válido por 24 horas. Si no solicitaste esta verificación, ignora este email.',
    },
    en: {
      title: 'Verify your email address',
      greeting: (name?: string) => name ? `Hello, ${name}:` : 'Hello:',
      intro: 'Click this link to verify your email address.',
      buttonText: 'Verify email address',
      warning: 'If you did not make this request',
      ignore: 'If you did not make this request, you can safely ignore this message.',
      regards: 'Thanks,',
      team: 'The PyM-ERP team',
      footer: 'This link is valid for 24 hours. If you did not request this verification, please ignore this email.',
    }
  };
  
  const t = translations[isSpanish ? 'es' : 'en'];
  
  const content = `
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">${t.greeting(data.displayName)}</p>
    
    <p style="margin: 0 0 24px 0; color: #374151; line-height: 1.6;">${t.intro}</p>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 6px;">
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
        <strong>${t.warning}</strong><br>
        ${t.ignore}
      </p>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px;">
      ${t.regards}<br>
      <strong style="color: #111827;">${t.team}</strong>
    </p>
  `;
  
  return getEmailTemplate({
    title: t.title,
    content,
    buttonText: t.buttonText,
    buttonUrl: data.verificationUrl,
    footerText: t.footer,
    language: data.language,
  });
}

/**
 * Template para email de nueva solicitud de cita (dueño de PYME)
 */
export function getAppointmentRequestEmailTemplate(data: {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceName: string;
  professionalName: string;
  date: string;
  startTime: string;
  endTime: string;
  companyName: string;
  dashboardUrl: string;
  notes?: string;
  language?: 'es' | 'en';
}): string {
  const isSpanish = data.language !== 'en';
  
  const translations = {
    es: {
      title: 'Nueva solicitud de cita',
      greeting: 'Hola,',
      intro: 'Has recibido una nueva solicitud de cita en tu negocio. Revisa los detalles a continuación:',
      client: 'Cliente',
      service: 'Servicio',
      professional: 'Profesional',
      date: 'Fecha',
      time: 'Horario',
      contact: 'Contacto',
      phone: 'Teléfono',
      email: 'Correo',
      notes: 'Notas adicionales',
      noNotes: 'Sin notas adicionales',
      action: 'Revisa y gestiona esta cita en tu dashboard para confirmarla o cancelarla.',
      buttonText: 'Ir al Dashboard',
      footer: 'Recuerda confirmar la cita para que el cliente reciba la notificación de confirmación.',
    },
    en: {
      title: 'New appointment request',
      greeting: 'Hello,',
      intro: 'You have received a new appointment request for your business. Review the details below:',
      client: 'Client',
      service: 'Service',
      professional: 'Professional',
      date: 'Date',
      time: 'Time',
      contact: 'Contact',
      phone: 'Phone',
      email: 'Email',
      notes: 'Additional notes',
      noNotes: 'No additional notes',
      action: 'Review and manage this appointment in your dashboard to confirm or cancel it.',
      buttonText: 'Go to Dashboard',
      footer: 'Remember to confirm the appointment so the client receives the confirmation notification.',
    }
  };
  
  const t = translations[isSpanish ? 'es' : 'en'];
  
  const content = `
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">${t.greeting}</p>
    
    <p style="margin: 0 0 24px 0; color: #374151; line-height: 1.6;">${t.intro}</p>
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <tr>
        <td>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151; font-size: 14px;">${t.client}:</strong>
                <span style="color: #6b7280; font-size: 14px; margin-left: 8px;">${data.clientName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151; font-size: 14px;">${t.service}:</strong>
                <span style="color: #6b7280; font-size: 14px; margin-left: 8px;">${data.serviceName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151; font-size: 14px;">${t.professional}:</strong>
                <span style="color: #6b7280; font-size: 14px; margin-left: 8px;">${data.professionalName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151; font-size: 14px;">${t.date}:</strong>
                <span style="color: #6b7280; font-size: 14px; margin-left: 8px;">${data.date}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151; font-size: 14px;">${t.time}:</strong>
                <span style="color: #6b7280; font-size: 14px; margin-left: 8px;">${data.startTime} - ${data.endTime}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151; font-size: 14px;">${t.contact}:</strong>
                <div style="margin-left: 8px; margin-top: 4px;">
                  <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">
                    <strong style="color: #374151;">${t.phone}:</strong> ${data.clientPhone}
                  </div>
                  ${data.clientEmail ? `
                  <div style="color: #6b7280; font-size: 14px;">
                    <strong style="color: #374151;">${t.email}:</strong> ${data.clientEmail}
                  </div>
                  ` : ''}
                </div>
              </td>
            </tr>
            ${data.notes ? `
            <tr>
              <td style="padding: 12px 0;">
                <strong style="color: #374151; font-size: 14px;">${t.notes}:</strong>
                <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0; line-height: 1.5;">${data.notes}</p>
              </td>
            </tr>
            ` : `
            <tr>
              <td style="padding: 12px 0;">
                <strong style="color: #374151; font-size: 14px;">${t.notes}:</strong>
                <span style="color: #9ca3af; font-size: 14px; margin-left: 8px; font-style: italic;">${t.noNotes}</span>
              </td>
            </tr>
            `}
          </table>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0 0; color: #374151; line-height: 1.6;">${t.action}</p>
  `;
  
  return getEmailTemplate({
    title: t.title,
    content,
    buttonText: t.buttonText,
    buttonUrl: data.dashboardUrl,
    footerText: t.footer,
    language: data.language,
  });
}

