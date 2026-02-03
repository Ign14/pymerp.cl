import type React from 'react';
import type {
  Company,
  CompanyAppearance,
  CartItem,
  Product,
  Professional,
  Property,
  ScheduleSlot,
  Service,
  ServiceSchedule,
} from '../../../types';
import type { AppearanceTheme } from '../types';
import type { PublicLayoutKey, PublicLayoutVariant } from '../../../services/publicPage';

export interface PublicLayoutSections {
  hero?: React.ReactNode;
  highlight?: React.ReactNode;
  services?: React.ReactNode;
  team?: React.ReactNode;
  products?: React.ReactNode;
  properties?: React.ReactNode;
  schedule?: React.ReactNode;
  /** Equipo + Horarios en grid 2 columnas desktop (barberías) */
  teamSchedule?: React.ReactNode;
  reviews?: React.ReactNode;
  faqs?: React.ReactNode;
  missionVision?: React.ReactNode;
  hours?: React.ReactNode;
  location?: React.ReactNode;
  media?: React.ReactNode;
  contact?: React.ReactNode;
}

export interface PublicLayoutProps {
  layoutKey: PublicLayoutKey;
  variant: PublicLayoutVariant;
  company: Company;
  appearance: CompanyAppearance | null;
  theme: AppearanceTheme;
  services?: Service[];
  products?: Product[];
  professionals?: Professional[];
  schedules?: ScheduleSlot[];
  serviceSchedules?: ServiceSchedule[];
  properties?: Property[];
  menuCategories?: Array<{ id: string; name: string; order?: number; active?: boolean; image_url?: string }>;
  cart?: CartItem[];
  cartItems?: number;
  cartTotal?: number;
  hasHiddenPrices?: boolean;
  sections: PublicLayoutSections;
  contactActions: React.ReactNode;
  floatingCta?: React.ReactNode;
  hideHeroLogoOnMobile?: boolean;
  onOpenCart?: () => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onProductClick?: (product: Product) => void;
  // Optional 2nd arg: preferred professional (pre-filtrado en UI pública)
  onBookService?: (service: Service, preferredProfessionalId?: string | null) => void;
  onWhatsAppClick?: () => void;
  onServiceClick?: (service: Service) => void;
  isLoading?: boolean;
}
