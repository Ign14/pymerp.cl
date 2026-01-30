import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedButton from '../../../components/animations/AnimatedButton';
import AnimatedCard from '../../../components/animations/AnimatedCard';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import { useAuth } from '../../../contexts/AuthContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import type { MenuCategory, Product } from '../../../types';
import { getProducts, updateProduct } from '../../../services/firestore';
import {
  createMenuCategory,
  deleteMenuCategory,
  getMenuCategories,
  updateMenuCategory,
} from '../../../services/menu';

const MenuCategoriesPage = () => {
  const { t } = useTranslation();
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!firestoreUser?.company_id) return;
      try {
        const [cats, prods] = await Promise.all([
          getMenuCategories(firestoreUser.company_id),
          getProducts(firestoreUser.company_id),
        ]);

        const sortedCats = [...cats].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setCategories(sortedCats);
        setProducts(prods);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [firestoreUser?.company_id, handleError]);

  const productsByCategory = useMemo(() => {
    return categories.reduce<Record<string, Product[]>>((acc, cat) => {
      acc[cat.id] = products
        .filter((p) => p.menuCategoryId === cat.id)
        .sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0));
      return acc;
    }, {});
  }, [categories, products]);

  const unassignedProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          !p.menuCategoryId &&
          (!productSearch ||
            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.description?.toLowerCase().includes(productSearch.toLowerCase()))
      ),
    [products, productSearch]
  );

  const handleCreateCategory = async () => {
    if (!firestoreUser?.company_id || !newCategoryName.trim()) return;
    try {
      const order = categories.length;
      await createMenuCategory({
        company_id: firestoreUser.company_id,
        name: newCategoryName.trim(),
        order,
        active: true,
      } as any);
      setNewCategoryName('');
      toast.success(t('menuCategories.created'));
      const cats = await getMenuCategories(firestoreUser.company_id);
      setCategories(cats.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    } catch (error) {
      handleError(error);
    }
  };

  const persistOrder = async (next: MenuCategory[]) => {
    await Promise.all(
      next.map((cat, idx) => updateMenuCategory(cat.id, { order: idx }))
    );
  };

  const moveCategory = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= categories.length) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, moved);
    setCategories(reordered);
    try {
      await persistOrder(reordered);
      toast.success(t('menuCategories.reordered'));
    } catch (error) {
      handleError(error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm(t('menuCategories.deleteConfirm'))) return;
    try {
      await deleteMenuCategory(categoryId);
      toast.success(t('menuCategories.deleted'));
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      setProducts((prev) =>
        prev.map((p) =>
          p.menuCategoryId === categoryId ? { ...p, menuCategoryId: undefined, menuOrder: undefined } : p
        )
      );
    } catch (error) {
      handleError(error);
    }
  };

  const handleRename = async (categoryId: string, name: string) => {
    try {
      await updateMenuCategory(categoryId, { name });
      setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, name } : c)));
      toast.success(t('menuCategories.updated'));
    } catch (error) {
      handleError(error);
    }
  };

  const handleAssignProduct = async (categoryId: string, productId: string) => {
    const categoryProducts = products.filter((p) => p.menuCategoryId === categoryId);
    const nextOrder = categoryProducts.length;
    try {
      await updateProduct(productId, { menuCategoryId: categoryId, menuOrder: nextOrder });
      toast.success(t('menuCategories.assigned'));
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, menuCategoryId: categoryId, menuOrder: nextOrder } : p))
      );
    } catch (error) {
      handleError(error);
    }
  };

  const handleToggleAvailability = async (product: Product) => {
    try {
      await updateProduct(product.id, { isAvailable: !(product as any).isAvailable });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isAvailable: !(product as any).isAvailable } : p))
      );
    } catch (error) {
      handleError(error);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard/products')}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
              aria-label={t('common.back')}
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{t('menuCategories.title')}</h1>
          </div>
          <div className="flex gap-2">
            <Link
              to="/dashboard/products/settings"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
            >
              <span>🎨</span>
              <span>Configurar Apariencia del Menú</span>
            </Link>
            <Link
              to="/dashboard/products"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {t('menuCategories.goProducts')}
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <label className="text-sm text-gray-600 block mb-1">{t('menuCategories.newCategory')}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={t('menuCategories.newCategoryPlaceholder')}
                className="flex-1 border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <AnimatedButton onClick={handleCreateCategory} className="px-4 py-2 bg-blue-600 text-white rounded">
                {t('menuCategories.create')}
              </AnimatedButton>
            </div>
          </div>
          <div className="w-full sm:w-72">
            <label className="text-sm text-gray-600 block mb-1">{t('menuCategories.searchProducts')}</label>
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder={t('common.search')}
              className="w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-6">
          {categories.map((category, idx) => (
            <AnimatedCard key={category.id} className="bg-white shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => setCategories((prev) => prev.map((c) => (c.id === category.id ? { ...c, name: e.target.value } : c)))}
                    onBlur={(e) => handleRename(category.id, e.target.value.trim())}
                    className="text-lg font-semibold text-gray-900 border border-transparent focus:border-blue-500 rounded px-2 py-1"
                  />
                  <span className="text-xs text-gray-400">#{category.order ?? idx + 1}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => moveCategory(idx, -1)}
                    className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-100 text-sm"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCategory(idx, 1)}
                    className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-100 text-sm"
                  >
                    ↓
                  </button>
                  <AnimatedButton
                    onClick={() => handleDeleteCategory(category.id)}
                    className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-sm hover:bg-red-100"
                  >
                    {t('common.delete')}
                  </AnimatedButton>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600">{t('menuCategories.assignProduct')}</span>
                  <select
                    className="border border-gray-200 rounded px-3 py-2"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignProduct(category.id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">{t('menuCategories.selectProduct')}</option>
                    {unassignedProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(productsByCategory[category.id] || []).map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded p-3 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(product)}
                          className={`px-2 py-1 text-xs rounded ${
                            (product as any).isAvailable === false
                              ? 'bg-gray-200 text-gray-700'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {(product as any).isAvailable === false
                            ? t('menuCategories.soldOut')
                            : t('menuCategories.available')}
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{product.price ? `$${product.price}` : t('common.notAvailable')}</span>
                        <span className="text-xs text-gray-400">{t('menuCategories.orderLabel', { order: product.menuOrder ?? 0 })}</span>
                      </div>
                    </div>
                  ))}
                  {(productsByCategory[category.id] || []).length === 0 && (
                    <p className="text-sm text-gray-500">{t('menuCategories.emptyCategory')}</p>
                  )}
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>

        <div className="mt-8 bg-white border border-gray-100 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">{t('menuCategories.unassigned')}</h2>
          {unassignedProducts.length === 0 ? (
            <p className="text-sm text-gray-500">{t('menuCategories.allAssigned')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {unassignedProducts.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded p-3">
                  <p className="font-semibold text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                  <p className="text-sm text-gray-600 mt-1">{product.price ? `$${product.price}` : t('common.notAvailable')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuCategoriesPage;
