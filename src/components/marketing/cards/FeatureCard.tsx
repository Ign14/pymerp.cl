import { motion } from 'framer-motion';

export interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  color?: string;
  delay?: number;
}

export const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  color = 'from-blue-500 to-indigo-600',
  delay = 0 
}: FeatureCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8 }}
      className="relative group"
    >
      <div className={`h-full bg-gradient-to-br ${color} rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-white/20 flex flex-col items-center text-center`}>
        {/* Icon */}
        <div 
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/15 mb-6 text-3xl shadow-md"
          aria-hidden="true"
        >
          {icon}
        </div>

        {/* Content */}
        <h3 className="text-lg md:text-xl font-bold text-white mb-3">
          {title}
        </h3>
        <p className="text-white/90 leading-relaxed text-sm md:text-base font-medium">
          {description}
        </p>
      </div>
    </motion.article>
  );
};
