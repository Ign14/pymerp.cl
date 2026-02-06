import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import type { Product } from '../../../types';
import { getProduct, createProduct, updateProduct } from '../../../services/firestore';
import { uploadImage } from '../../../services/storage';
import toast from 'react-hot-toast';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import {
  DEFAULT_IMAGE_UPLOAD_CONFIG,
  IMAGE_UPLOAD_RECOMMENDATION,
} from '../../../utils/constants';

const PRODUCT_CATEGORIES = [
  '🥦 Frutas y Verduras',
  '🥩 Carnes y Pescados',
  '🍞 Panadería y Pastelería',
  '🥛 Lácteos y Refrigerados',
  '❄️ Congelados',
  '🍝 Abarrotes / Despensa',
  '🥤 Bebidas',
  '🍬 Snacks y Golosinas',
  '🧂 Condimentos, Salsas y Aceites',
  '🧼 Aseo y Limpieza del Hogar',
  '🧴 Higiene y Cuidado Personal',
  '👶 Bebé y Maternidad',
  '🐶 Mascotas',
  '🏠 Hogar y Menaje',
  '💊 Farmacia básica / Salud',
  '🍷 Licores y Alcohol (donde esté permitido)',
];

const toNullIfEmpty = (value: string) => value.trim() || null;

const normalizeOptionalText = (value: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      if (entry === undefined) return [key, null];
      if (typeof entry === 'string') return [key, toNullIfEmpty(entry)];
      return [key, entry];
    })
  );

export default function ProductNew() {
  const { id } = useParams();
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    detail: '',
    description: '',
    barcode: '',
    format: '',
    category: '',
    price_web: '',
    price_local: '',
    image_url: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Variables comentadas (no necesarias sin validación de límites)
  // const [company, setCompany] = useState<any | null>(null);
  // const [productCount, setProductCount] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!firestoreUser?.company_id) {
      setLoading(false);
      return;
    }

    try {
      // Carga de datos simplificada (sin validación de límites)
      // const [companyData, products] = await Promise.all([
      //   getCompany(firestoreUser.company_id),
      //   getProducts(firestoreUser.company_id),
      // ]);
      // setCompany(companyData);
      // setProductCount(products.length);

      if (id) {
        const product = await getProduct(id);
        if (product) {
          setFormData({
            name: product.name,
            brand: product.brand || '',
            model: product.model || '',
            detail: product.detail || '',
            description: product.description,
            barcode: product.barcode || '',
            format: product.format || '',
            category: product.category || '',
            price_web: String(product.price_web ?? product.price ?? ''),
            price_local: String(product.price_local ?? product.price ?? ''),
            image_url: product.image_url,
            status: product.status,
          });
        }
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!firestoreUser?.company_id) return;

    try {
      const path = `companies/${firestoreUser.company_id}/products/${Date.now()}`;
      const url = await uploadImage(file, path, DEFAULT_IMAGE_UPLOAD_CONFIG);
      setFormData({ ...formData, image_url: url });
      toast.success('Imagen subida correctamente');
    } catch (error) {
      toast.error('Error al subir imagen');
      handleError(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firestoreUser?.company_id) return;

    // LÍMITES DESHABILITADOS: Sin restricciones hasta implementar sistema de cobro
    /* VALIDACIÓN DE LÍMITES COMENTADA:
    const productLimit = getSubscriptionLimit('products', company?.subscription_plan);
    if (!id && productCount >= productLimit) {
      const planLabel = getPlanLabel(company?.subscription_plan);
      toast.error(`Tu plan ${planLabel} no permite más productos`);
      return;
    }
    */

    setSaving(true);
    try {
      const productData = normalizeOptionalText({
        company_id: firestoreUser.company_id,
        name: formData.name,
        brand: formData.brand,
        model: formData.model,
        detail: formData.detail,
        description: formData.description,
        barcode: formData.barcode,
        format: formData.format,
        category: formData.category,
        price_web: formData.price_web ? parseFloat(formData.price_web) : 0,
        price_local: formData.price_local ? parseFloat(formData.price_local) : 0,
        price: formData.price_web ? parseFloat(formData.price_web) : 0,
        image_url: formData.image_url,
        status: formData.status,
      }) as Omit<Product, 'id'>;

      if (id) {
        await updateProduct(id, productData);
        toast.success('Producto actualizado');
      } else {
        await createProduct(productData);
        toast.success('Producto creado');
      }

      navigate('/dashboard/products');
    } catch (error) {
      toast.error('Error al guardar');
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
            aria-label="Volver"
          >
            ←
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {id ? 'Editar producto' : 'Nuevo producto'}
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marca
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modelo
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detalle
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.detail}
              onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción *
            </label>
            <textarea
              rows={4}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código de barras
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Formato
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 1L, 500g, Pack 6"
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Selecciona una categoría</option>
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio local *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.price_local}
                onChange={(e) => setFormData({ ...formData, price_local: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio web *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.price_web}
                onChange={(e) => setFormData({ ...formData, price_web: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagen *
            </label>
            <p className="text-xs text-gray-500 mb-1">{IMAGE_UPLOAD_RECOMMENDATION}</p>
            {formData.image_url && (
              <img src={formData.image_url} alt="Preview" className="h-48 mb-2 rounded" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard/products')}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 w-full sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
