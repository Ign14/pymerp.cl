import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { segments } from './mockData';
import { SegmentCard } from './cards';

export const Segmentation = () => {
  const [activeTab, setActiveTab] = useState<'service' | 'product'>('service');
  const navigate = useNavigate();

  const filteredSegments = segments.filter(s => s.type === activeTab);

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Soluciones a tu Medida
          </h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto font-medium">
            Elige según el tipo de negocio que tienes
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center mb-12"
          role="tablist"
          aria-label="Tipo de negocio"
        >
          <div className="inline-flex bg-gray-100 rounded-xl p-1">
            <button
              role="tab"
              aria-selected={activeTab === 'service'}
              aria-controls="servicios-panel"
              onClick={() => setActiveTab('service')}
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'service'
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Servicios
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'product'}
              aria-controls="productos-panel"
              onClick={() => setActiveTab('product')}
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'product'
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Productos
            </button>
          </div>
        </motion.div>

        {/* Segments Grid */}
        <div 
          role="tabpanel"
          id={activeTab === 'service' ? 'servicios-panel' : 'productos-panel'}
          className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto"
        >
          {filteredSegments.map((segment, index) => (
            <div key={segment.id} className="w-full md:w-[480px]">
              <SegmentCard
                title={segment.title}
                description={segment.description}
                features={segment.features}
                icon={segment.icon}
                color={segment.color}
                delay={index * 0.1}
                ctaText="Más Información"
                onCtaClick={() => navigate('/features')}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
