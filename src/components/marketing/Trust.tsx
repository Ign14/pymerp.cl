import { motion } from 'framer-motion';

export const Trust = () => {
  return (
    <section className="py-16 bg-white border-y border-gray-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="text-4xl md:text-5xl">🇨🇱</div>
            <div className="text-4xl md:text-5xl">🌎</div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Hecho para emprendedores en Chile y el mundo
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            PyM-ERP nació porque vimos cómo emprendedores y PYMEs luchan con plataformas 
            complejas y costosas. Creamos algo simple, accesible y que realmente funciona para negocios en toda Latinoamérica y el mundo.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="text-3xl mb-3">⚡</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">5 min</div>
              <div className="text-sm text-gray-600">Para estar online</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="text-3xl mb-3">💰</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">$0 CLP</div>
              <div className="text-sm text-gray-600">Plan básico gratis</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="text-3xl mb-3">💬</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">WhatsApp</div>
              <div className="text-sm text-gray-600">Todo integrado</div>
            </motion.div>
          </div>

          {/* Testimonial Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 bg-white rounded-2xl p-8 shadow-md border border-gray-200 max-w-2xl mx-auto"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-2xl">
                👤
              </div>
              <div className="text-left flex-1">
                <p className="text-gray-700 italic mb-4 leading-relaxed">
                  "Testimonios de usuarios reales próximamente. Estamos en fase de lanzamiento 
                  y queremos que seas de los primeros en probarlo."
                </p>
                <div className="text-sm text-gray-500">
                  <div className="font-semibold text-gray-900">Únete al beta</div>
                  <div>Primeros usuarios · Chile</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

