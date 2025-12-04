import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getProducts, deleteProduct } from '../../../services/firestore';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import AnimatedButton from '../../../components/animations/AnimatedButton';
import AnimatedModal from '../../../components/animations/AnimatedModal';
import AnimatedCard from '../../../components/animations/AnimatedCard';
import { useErrorHandler } from '../../../hooks/useErrorHandler';

export default function ProductsList() {
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    if (!firestoreUser?.company_id) return;

    try {
      const data = await getProducts(firestoreUser.company_id);
      setProducts(data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      await deleteProduct(productId);
      toast.success('Producto eliminado');
      await loadProducts();
    } catch (error) {
      toast.error('Error al eliminar');
      handleError(error);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
              aria-label="Volver"
            >
              ←
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          </div>
          <Link
            to="/dashboard/products/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Nuevo producto
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, idx) => (
            <AnimatedCard 
              key={product.id} 
              delay={idx * 0.1}
              className="bg-white shadow rounded-lg overflow-hidden border border-gray-100"
            >
              <button
                type="button"
                onClick={() => setPreviewUrl(product.image_url || '')}
                className="w-full h-48 bg-gray-100 flex items-center justify-center group relative"
              >
                <img
                  src={product.image_url || 'https://placehold.co/600x400/EEF2FF/1F2937?text=Sin+imagen'}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain"
                />
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition flex items-center justify-center text-white text-lg opacity-0 group-hover:opacity-100">
                  🔍
                </span>
              </button>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-blue-600">${product.price.toLocaleString()}</span>
                  {product.weight && (
                    <span className="text-sm text-gray-500">{product.weight}g</span>
                  )}
                </div>
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {product.tags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs rounded border"
                        style={{
                          backgroundColor: '#f8fafc',
                          color: '#0f172a',
                          borderColor: '#cbd5e1',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Link
                    to={`/dashboard/products/edit/${product.id}`}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm text-center hover:bg-blue-700"
                  >
                    Editar
                  </Link>
                  <AnimatedButton
                    onClick={() => handleDelete(product.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Eliminar
                  </AnimatedButton>
                </div>
                <div className="mt-2">
                <span className={`inline-block px-2 py-1 text-xs rounded badge-light ${
                  product.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.status}
                </span>
                </div>
              </div>
            </AnimatedCard>
          ))}
          
          {products.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No hay productos creados. <Link to="/dashboard/products/new" className="text-blue-600 hover:underline">Crear uno</Link>
            </div>
          )}
        </div>
      </div>
      <AnimatedModal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        className="relative max-w-3xl p-0 bg-transparent shadow-none"
      >
        <button
          onClick={() => setPreviewUrl(null)}
          className="absolute -top-10 right-0 text-white text-2xl z-10"
          aria-label="Cerrar"
        >
          ×
        </button>
        <div className="bg-white rounded-lg overflow-hidden shadow-lg max-h-[80vh] flex items-center justify-center">
          <img src={previewUrl || ''} alt="Vista previa" className="max-h-[80vh] max-w-full object-contain" />
        </div>
      </AnimatedModal>
    </div>
  );
}
