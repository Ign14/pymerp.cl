import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();


  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-800/95 backdrop-blur-xl border-b border-gray-700/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => navigate('/')}
            className="flex items-center relative"
            aria-label="Ir a inicio de PyM-ERP"
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative">
              <img 
                src="/logoapp.png" 
                alt="PyM-ERP Logo" 
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain relative z-10"
              />
            </div>
          </motion.button>

          {/* Desktop CTAs */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="hidden md:flex items-center space-x-3 lg:space-x-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-gray-100 font-medium hover:text-white transition-colors duration-200 text-sm lg:text-base"
            >
              Iniciar Sesión
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/request-access')}
              className="px-5 lg:px-6 py-2 bg-white text-gray-900 rounded-lg font-medium shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 text-sm lg:text-base"
            >
              Comenzar Gratis
            </motion.button>
          </motion.div>

          {/* Mobile Menu Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-700/50 active:bg-gray-600/50 transition-colors duration-200"
            aria-label={isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
            type="button"
            whileTap={{ scale: 0.98 }}
          >
            <svg
              className="w-6 h-6 text-gray-100"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
        id="mobile-nav"
        className="md:hidden overflow-hidden bg-gray-800/95 backdrop-blur-xl border-t border-gray-700/50 shadow-lg"
      >
        <div className="px-4 py-4 space-y-2">
          <button
            onClick={() => {
              navigate('/login');
              setIsOpen(false);
            }}
            className="block w-full text-center px-4 py-2.5 text-gray-100 font-medium border border-gray-600 rounded-lg hover:bg-gray-700/50 hover:border-gray-500 hover:text-white transition-all duration-200 active:scale-[0.98] bg-gray-800 shadow-sm"
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => {
              navigate('/request-access');
              setIsOpen(false);
            }}
            className="block w-full text-center px-4 py-2.5 bg-white text-gray-900 rounded-lg font-medium shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 active:scale-[0.98]"
          >
            Comenzar Gratis
          </button>
        </div>
      </motion.div>
    </nav>
  );
};
