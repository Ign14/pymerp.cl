import { motion } from 'framer-motion';

export interface StepCardProps {
  number: number;
  title: string;
  description: string;
  icon: string;
  delay?: number;
}

export const StepCard = ({ 
  number, 
  title, 
  description, 
  icon,
  delay = 0
}: StepCardProps) => {
  return (
    <div className="relative">
      <motion.article
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay }}
        className="relative h-full flex flex-col items-center text-center w-full max-w-sm"
      >
        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-md hover:shadow-xl transition-shadow duration-300 h-full border-2 border-gray-200 flex flex-col items-center">
          {/* Number Badge */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: delay + 0.3 }}
            className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg z-10 mt-2 mb-6"
            aria-label={`Paso ${number}`}
          >
            {number}
          </motion.div>

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div 
              className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center text-4xl md:text-5xl shadow-md"
              aria-hidden="true"
            >
              {icon}
            </div>
          </div>

          {/* Content */}
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-white leading-relaxed text-base md:text-lg font-medium">
            {description}
          </p>
        </div>
      </motion.article>
    </div>
  );
};
