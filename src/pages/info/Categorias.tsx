import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../../components/SEO';
import { getAllCategories, type CategoryGroup } from '../../config/categories';
import { useLanguage } from '../../contexts/LanguageContext';

const GROUP_EMOJIS: Record<CategoryGroup, string> = {
  SALUD: '💊',
  BELLEZA: '💅',
  HOGAR: '🏠',
  AUTOMOTRIZ: '🚗',
  EDUCACION: '🎓',
  RETAIL: '🛍️',
  ALIMENTOS: '🍔',
  TURISMO_EVENTOS: '🎉',
  MASCOTAS: '🐶',
  ARTES_OFICIOS: '🛠️',
  OTROS: '✨',
};

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

export default function Categorias() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const groupedCategories = useMemo(() => {
    const categories = getAllCategories();
    const byGroup = new Map<CategoryGroup, typeof categories>();

    categories.forEach((category) => {
      const groupCategories = byGroup.get(category.group) || [];
      groupCategories.push(category);
      byGroup.set(category.group, groupCategories);
    });

    return Array.from(byGroup.entries())
      .map(([group, groupCategories]) => ({
        group,
        label: t(`categories.groups.${group}`) || group,
        emoji: GROUP_EMOJIS[group] || '✨',
        categories: groupCategories.sort((a, b) =>
          (t(`categories.${a.id}`) || a.id).localeCompare(t(`categories.${b.id}`) || b.id)
        ),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [t]);

  return (
    <>
      <SEO
        title="Categorías de Emprendimientos | PyM-ERP"
        description="Explora categorías y subcategorías de emprendimientos en PyM-ERP. Encuentra el tipo de negocio ideal para tu PYME."
        canonical="/categorias"
      />
      <section className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex justify-center mb-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-white/20 transition"
            >
              ← Volver
            </button>
          </div>
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400 font-semibold">Explora emprendimientos</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mt-3">
              Categorías y subcategorías disponibles
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
              Encuentra PYMEs por rubro o descubre la categoría ideal para crear tu sitio web y sistema de gestión en pymerp.cl.
            </p>
          </div>

          <div className="space-y-12">
            {groupedCategories.map((group, groupIndex) => (
              <div key={group.group}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">{group.emoji}</span>
                  <h2 className="text-xl sm:text-2xl font-bold">{group.label}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.categories.map((category, index) => {
                    const emoji = CATEGORY_EMOJIS[category.id] || '✨';
                    return (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45, delay: (groupIndex * 0.02) + (index * 0.02) }}
                        className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 shadow-lg hover:shadow-xl hover:border-white/30 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{emoji}</span>
                          <div className="text-sm uppercase tracking-wide text-slate-400">
                            {group.label}
                          </div>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-white">
                          {t(`categories.${category.id}`) || category.labelKey}
                        </h3>
                        <p className="mt-2 text-sm text-slate-300">
                          Crea tu página, agenda y gestión empresarial adaptada a esta subcategoría.
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
