import { useMemo } from 'react';
import { getAllCategories, type CategoryConfig } from '../../config/categories';
import { useLanguage } from '../../contexts/LanguageContext';

const CATEGORY_EMOJIS: Record<string, string> = {
  clinicas_odontologicas: '🦷',
  clinicas_kinesiologicas: '🦴',
  centros_entrenamiento: '🏋️',
  actividad_entrenamiento_fisico: '🏃',
  centros_terapia: '🧘',
  psicologia: '🧠',
  nutricion: '🥗',
  masajes_spa: '💆',
  barberias: '💈',
  peluquerias: '💇',
  centros_estetica: '✨',
  unas: '💅',
  tatuajes_piercing: '🖊️',
  aseo_ornato: '🧽',
  chef_personal: '👨‍🍳',
  asesoria_hogar: '🧾',
  construccion_mantencion: '🛠️',
  construccion: '🏗️',
  taller_vehiculos: '🔧',
  cursos_capacitaciones: '📚',
  minimarket: '🛒',
  articulos_aseo: '🧴',
  productos_cuidado_personal: '🧼',
  ferreteria: '🔩',
  floreria: '💐',
  ropa_accesorios: '👗',
  libreria_papeleria: '📖',
  tecnologia: '💻',
  botillerias: '🍷',
  restaurantes_comida_rapida: '🍟',
  restaurantes: '🍽️',
  bares: '🍸',
  foodtruck: '🚚',
  panaderia_pasteleria: '🥐',
  centros_eventos: '🎪',
  deporte_aventura: '🧗',
  turismo: '🧭',
  fotografia: '📸',
  arriendo_cabanas_casas: '🏡',
  inmobiliaria_terrenos_casas: '🏘️',
  mascotas_veterinarias: '🐾',
  artesania: '🧵',
  talabarteria: '🧰',
  taller_artes: '🎨',
  agenda_profesionales: '🗓️',
  agenda_profesionales_independientes: '🧑‍💼',
  servicios_legales: '⚖️',
  contabilidad: '🧮',
  bodegas_logistica: '📦',
  agricultura_productores: '🌾',
  distribuidores: '🚛',
  otros: '✨',
};

const DISPLAY_ORDER: string[] = [
  'restaurantes',
  'barberias',
  'construccion',
  'agenda_profesionales',
  'peluquerias',
  'restaurantes_comida_rapida',
  'panaderia_pasteleria',
  'bares',
  'minimarket',
  'masajes_spa',
  'centros_estetica',
  'clinicas_odontologicas',
  'taller_vehiculos',
  'floreria',
  'ferreteria',
  'fotografia',
  'turismo',
  'mascotas_veterinarias',
  'agenda_profesionales_independientes',
  'servicios_legales',
  'contabilidad',
];

function sortCategories(categories: CategoryConfig[], t: (key: string) => string): CategoryConfig[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const ordered: CategoryConfig[] = [];
  for (const id of DISPLAY_ORDER) {
    const cat = byId.get(id as CategoryConfig['id']);
    if (cat) ordered.push(cat);
  }
  const remaining = categories.filter((c) => !DISPLAY_ORDER.includes(c.id));
  remaining.sort((a, b) => (t(a.labelKey) || a.id).localeCompare(t(b.labelKey) || b.id));
  return [...ordered, ...remaining];
}

export function CategoryCarousel() {
  const { t } = useLanguage();

  const categories = useMemo(() => {
    const all = getAllCategories();
    return sortCategories(all, t);
  }, [t]);

  const cardContent = categories.map((category) => {
    const label = t(category.labelKey) || category.id;
    const emoji = CATEGORY_EMOJIS[category.id] ?? '✨';
    return { id: category.id, label, emoji };
  });

  return (
    <section
      className="w-full py-8 bg-black"
      aria-label="Subcategorías disponibles"
    >
      <style>{`
        @keyframes category-carousel-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .category-carousel-track {
          animation: category-carousel-scroll 60s linear infinite;
        }
      `}</style>
      <div className="overflow-hidden w-full">
        <div
          className="category-carousel-track flex gap-4 w-max"
          style={{ willChange: 'transform' }}
        >
          {[1, 2].map((copy) => (
            <div key={copy} className="flex gap-4 flex-shrink-0">
              {cardContent.map((item) => (
                <div
                  key={`${item.id}-${copy}`}
                  className="flex flex-col items-center justify-center flex-shrink-0 min-w-[180px] h-[120px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg hover:shadow-xl hover:border-white/30 transition-all"
                >
                  <span className="text-3xl mb-2" aria-hidden>
                    {item.emoji}
                  </span>
                  <span className="text-sm font-semibold text-white text-center px-2 line-clamp-2">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
