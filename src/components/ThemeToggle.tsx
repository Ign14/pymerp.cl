import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-sm"
      aria-label="Cambiar modo claro/oscuro"
    >
      {theme === 'light' ? '💡' : '🌙'}
    </button>
  );
}
