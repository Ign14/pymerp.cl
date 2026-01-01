import { motion } from 'framer-motion';

export interface TestimonialCardProps {
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating?: number;
  delay?: number;
}

export const TestimonialCard = ({
  name,
  role,
  company,
  content,
  avatar,
  rating = 5,
  delay = 0
}: TestimonialCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8 }}
      className="relative"
    >
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md hover:shadow-xl transition-shadow duration-300 h-full flex flex-col border border-gray-200">
        {/* Quote Icon */}
        <div className="text-indigo-600 text-4xl mb-3 leading-none" aria-hidden="true">
          "
        </div>

        {/* Stars */}
        {rating > 0 && (
          <div className="flex mb-4" role="img" aria-label={`${rating} estrellas de 5`}>
            {[...Array(rating)].map((_, i) => (
              <svg
                key={i}
                className="w-5 h-5 text-yellow-500 fill-current"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
          </div>
        )}

        {/* Content */}
        <blockquote className="text-gray-800 leading-relaxed mb-6 flex-grow text-sm md:text-base font-medium">
          {content}
        </blockquote>

        {/* Author */}
        <footer className="flex items-center border-t border-gray-200 pt-6">
          {avatar ? (
            <img
              src={avatar}
              alt={`Foto de ${name}`}
              width={48}
              height={48}
              loading="lazy"
              decoding="async"
              className="w-12 h-12 rounded-full mr-4 object-cover"
            />
          ) : (
            <div 
              className="w-12 h-12 rounded-full mr-4 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-2xl"
              aria-hidden="true"
            >
              👤
            </div>
          )}
          <div>
            <cite className="font-semibold text-gray-900 not-italic">
              {name}
            </cite>
            <div className="text-sm text-gray-600">
              {role} en {company}
            </div>
          </div>
        </footer>
      </div>
    </motion.article>
  );
};

