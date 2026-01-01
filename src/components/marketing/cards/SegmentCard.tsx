import { motion } from 'framer-motion';

export interface SegmentCardProps {
  title: string;
  description: string;
  features: string[];
  icon: string;
  color?: string;
  delay?: number;
  ctaText?: string;
  onCtaClick?: () => void;
}

export const SegmentCard = ({
  title,
  description,
  features,
  icon,
  color = 'from-blue-600 to-indigo-700',
  delay = 0,
  ctaText = 'Más Información',
  onCtaClick
}: SegmentCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, x: delay % 2 === 0 ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="relative overflow-hidden"
    >
      <div className={`h-full bg-gradient-to-br ${color} rounded-2xl p-6 md:p-8 border-2 border-white/20 transition-all duration-300 shadow-lg hover:shadow-2xl text-center flex flex-col items-center`}>
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div 
            className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center text-4xl mb-4 shadow-lg"
            aria-hidden="true"
          >
            {icon}
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
            {title}
          </h3>
          <p className="text-white/90 text-sm md:text-base font-medium">
            {description}
          </p>
        </div>

        {/* Features List */}
        <ul className="space-y-2.5 mb-6 w-full max-w-xl" role="list">
          {features.map((feature, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: delay + 0.2 + idx * 0.1 }}
              className="flex items-start justify-center text-left"
            >
              <svg
                className="w-5 h-5 text-white mr-3 flex-shrink-0 mt-0.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-white/90 text-sm md:text-base font-medium">{feature}</span>
            </motion.li>
          ))}
        </ul>

        {/* CTA */}
        {onCtaClick && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCtaClick}
            className="w-full py-3 bg-white/15 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow duration-300 border border-white/20"
          >
            {ctaText} →
          </motion.button>
        )}

        {/* Background gradient */}
        <div 
          className="absolute top-0 right-0 w-40 h-40 bg-white/10 opacity-30 rounded-full blur-3xl"
          aria-hidden="true"
        />
      </div>
    </motion.article>
  );
};
