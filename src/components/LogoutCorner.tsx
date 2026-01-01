import { useNavigate } from 'react-router-dom';
import { logOut } from '../services/auth';
import toast from 'react-hot-toast';

export default function LogoutCorner() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('No se pudo cerrar sesión');
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="fixed top-4 right-4 z-30 px-4 py-2 text-sm font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow"
    >
      Cerrar sesión
    </button>
  );
}
