import { motion } from 'framer-motion';
import { features } from './mockData';
import { FeatureCard } from './cards';

export const Features = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Todo lo que necesitas
          </h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto font-medium">
            Funcionalidades pensadas para que tu negocio funcione solo
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center mb-12">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              color={feature.color}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
