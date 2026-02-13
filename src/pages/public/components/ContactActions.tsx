import AnimatedButton from '../../../components/animations/AnimatedButton';
import { CartBadge } from '../../../components/animations/AnimatedCart';
import { ensureButtonContrast } from '../../../utils/colorContrast';
import { AppearanceTheme } from '../types';

interface ContactActionsProps {
  theme: AppearanceTheme;
  onWhatsApp: () => void;
  onOpenCart?: () => void;
  cartItems?: number;
  showCartCta?: boolean;
  showSocialIcons?: boolean;
  socialIconsMode?: 'light' | 'dark';
  socialUsernames?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };
  socialVisibility?: {
    facebook?: boolean;
    instagram?: boolean;
    tiktok?: boolean;
  };
}

const SOCIAL_BASE_URLS = {
  facebook: 'https://www.facebook.com/',
  instagram: 'https://www.instagram.com/',
  tiktok: 'https://www.tiktok.com/@',
} as const;

const sanitizeSocialHandle = (rawValue?: string): string => {
  if (!rawValue) return '';
  let value = rawValue.trim();
  if (!value) return '';

  value = value.replace(/^https?:\/\/(www\.)?/i, '');
  value = value.replace(/^facebook\.com\//i, '');
  value = value.replace(/^instagram\.com\//i, '');
  value = value.replace(/^tiktok\.com\//i, '');
  value = value.replace(/^@/, '');
  value = value.replace(/^\/+/, '');
  value = value.split(/[/?#]/)[0] || value;

  return value.trim();
};

const buildSocialUrl = (network: keyof typeof SOCIAL_BASE_URLS, rawValue?: string): string | null => {
  const handle = sanitizeSocialHandle(rawValue);
  if (!handle) return null;
  const normalizedHandle =
    network === 'tiktok' ? handle.replace(/^@/, '') : handle;
  return `${SOCIAL_BASE_URLS[network]}${normalizedHandle}`;
};

export function ContactActions({
  theme,
  onWhatsApp,
  onOpenCart,
  cartItems = 0,
  showCartCta,
  showSocialIcons = false,
  socialIconsMode = 'dark',
  socialUsernames,
  socialVisibility,
}: ContactActionsProps) {
  const iconColor = socialIconsMode === 'light' ? '#ffffff' : '#111111';
  const socialButtons = [
    {
      id: 'facebook',
      label: 'Facebook',
      href: buildSocialUrl('facebook', socialUsernames?.facebook),
      visible: socialVisibility?.facebook,
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.019 4.388 11.008 10.125 11.927v-8.437H7.078v-3.49h3.047V9.413c0-3.017 1.792-4.682 4.533-4.682 1.313 0 2.686.235 2.686.235V7.93h-1.514c-1.49 0-1.956.931-1.956 1.887v2.256h3.328l-.532 3.49h-2.796V24C19.611 23.081 24 18.092 24 12.073z" />
        </svg>
      ),
    },
    {
      id: 'instagram',
      label: 'Instagram',
      href: buildSocialUrl('instagram', socialUsernames?.instagram),
      visible: socialVisibility?.instagram,
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.75A4 4 0 0 0 3.75 7.75v8.5a4 4 0 0 0 4 4h8.5a4 4 0 0 0 4-4v-8.5a4 4 0 0 0-4-4h-8.5Zm8.75 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z" />
        </svg>
      ),
    },
    {
      id: 'tiktok',
      label: 'TikTok',
      href: buildSocialUrl('tiktok', socialUsernames?.tiktok),
      visible: socialVisibility?.tiktok,
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M14.5 3c.3 2 1.8 3.6 3.8 4v2.7a7.5 7.5 0 0 1-3.8-1v6.2a5.9 5.9 0 1 1-5.2-5.9v2.8a3.2 3.2 0 1 0 2.5 3.1V3h2.7Z" />
        </svg>
      ),
    },
  ].filter((item) => Boolean(showSocialIcons && item.visible && item.href));
  const hasSocialButtons = socialButtons.length > 0;

  return (
    <div
      className={`flex flex-col gap-3 sm:gap-4 items-center w-full ${
        hasSocialButtons ? '' : 'sm:flex-row sm:justify-center'
      }`}
    >
      <AnimatedButton
        onClick={onWhatsApp}
        style={{ backgroundColor: '#25D366', color: '#ffffff', fontFamily: theme.fontButton }}
        className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg font-semibold hover:opacity-90 w-full sm:w-auto min-w-[200px] sm:min-w-[240px] text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
        ariaLabel="Contactar por WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.52 3.48A11.82 11.82 0 0 0 12.07 0 11.86 11.86 0 0 0 1.07 12.17 11.7 11.7 0 0 0 3.5 20.5l-1 3.48 3.6-.94a11.93 11.93 0 0 0 5.94 1.52h.05A11.83 11.83 0 0 0 24 12.07 11.8 11.8 0 0 0 20.52 3.48ZM12.1 21a9.9 9.9 0 0 1-5.05-1.38l-.36-.22-2.14.55.57-2.08-.24-.34a9.83 9.83 0 0 1-1.7-5.54A10.08 10.08 0 0 1 12.06 2a9.92 9.92 0 0 1 7.07 2.93 9.92 9.92 0 0 1 2.92 7.12A10 10 0 0 1 12.1 21Zm5.47-7.3c-.3-.15-1.77-.87-2.04-.97s-.47-.15-.67.15-.77.97-.94 1.17-.35.22-.64.07A8.14 8.14 0 0 1 10 11.8a9.18 9.18 0 0 1-1.65-2 .55.55 0 0 1 .13-.76c.13-.14.3-.37.45-.55a2.54 2.54 0 0 0 .3-.52.67.67 0 0 0-.03-.63c-.08-.15-.67-1.62-.92-2.22-.24-.58-.5-.5-.67-.51H6.8a1.3 1.3 0 0 0-.94.44 3.93 3.93 0 0 0-1.24 2.9c0 1.7 1.26 3.34 1.43 3.57.17.22 2.47 3.78 5.98 5.13a19.4 19.4 0 0 0 2.02.6 4.86 4.86 0 0 0 2.25.14c.69-.1 2.1-.86 2.4-1.7a3 3 0 0 0 .21-1.7c-.09-.14-.27-.22-.57-.37Z" />
        </svg>
        Contactar por WhatsApp
      </AnimatedButton>
      {hasSocialButtons && (
        <div className="flex items-center justify-center gap-3 w-full sm:w-auto">
          {socialButtons.map((social) => (
            <a
              key={social.id}
              href={social.href || '#'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir ${social.label}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:opacity-85"
              style={{
                color: iconColor,
                border: `1px solid ${iconColor}`,
                backgroundColor: 'transparent',
                boxShadow:
                  socialIconsMode === 'light'
                    ? '0 2px 8px rgba(0, 0, 0, 0.35)'
                    : '0 2px 8px rgba(0, 0, 0, 0.12)',
              }}
            >
              {social.icon}
            </a>
          ))}
        </div>
      )}
      {showCartCta && onOpenCart && (
        <AnimatedButton
          onClick={onOpenCart}
          className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg font-semibold w-full sm:w-auto min-w-[200px] sm:min-w-[240px] relative text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-300 border-2"
          style={{
            color: ensureButtonContrast(theme.cardColor || '#ffffff', theme.buttonColor || theme.titleColor || '#1d4ed8'),
            borderColor: theme.buttonColor ? `${theme.buttonColor}99` : 'rgba(59, 130, 246, 0.5)',
            backgroundColor: theme.buttonColor ? `${theme.buttonColor}12` : 'rgba(59, 130, 246, 0.08)',
            fontFamily: theme.fontButton,
          }}
          ariaLabel={`Ver carrito con ${cartItems} productos`}
        >
          🛒 Ver carrito ({cartItems})
          <CartBadge count={cartItems} />
        </AnimatedButton>
      )}
    </div>
  );
}
