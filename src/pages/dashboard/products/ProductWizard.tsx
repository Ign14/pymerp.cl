import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import ProductGeneralForm from './wizard/ProductGeneralForm';
import ProductTypePanel from './wizard/ProductTypePanel';
import PublicationPanel from './wizard/PublicationPanel';
import StepList from './wizard/StepList';
import StepEditor from './wizard/StepEditor';
import PreviewRenderer from './wizard/PreviewRenderer';
import type { ProductDraft, StepDraft, StepScopeKey } from './wizard/types';
import { scopeKeyForVariant } from './wizard/types';
import {
  createProduct,
  getModifierGroupItems,
  getProductEdit,
  saveProductSteps,
  searchModifierGroups,
  updateProductBase,
  type ApiErrorPayload,
  type ModifierGroupResponse,
  type ModifierItemResponse,
  type ModifierStepResponse,
} from '../../../services/gastroProducts';

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'type', label: 'Tipo' },
  { key: 'steps', label: 'Pasos' },
  { key: 'preview', label: 'Previsualización' },
  { key: 'publication', label: 'Publicación' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

interface BannerError {
  message: string;
  traceId?: string;
}

const emptyDraft = (): ProductDraft => ({
  name: '',
  description: '',
  skuInternal: '',
  isActive: true,
  productKind: 'SIMPLE',
  variants: [],
});

const normalizeOrders = (steps: StepDraft[]): StepDraft[] =>
  steps.map((step, index) => ({ ...step, stepOrder: index + 1 }));

const buildStepDrafts = (steps: ModifierStepResponse[]): Record<StepScopeKey, StepDraft[]> => {
  const grouped: Record<StepScopeKey, StepDraft[]> = {};
  steps.forEach((step) => {
    const key = scopeKeyForVariant(step.variantId ?? null);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push({
      id: step.id,
      localId: step.id,
      modifierGroupId: step.modifierGroupId,
      stepOrder: step.stepOrder,
      minSelection: step.minSelection,
      maxSelection: step.maxSelection,
      isRequired: step.required,
    });
  });
  Object.keys(grouped).forEach((key) => {
    grouped[key] = grouped[key].sort((a, b) => a.stepOrder - b.stepOrder);
  });
  return grouped;
};

export default function ProductWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { firestoreUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [productDraft, setProductDraft] = useState<ProductDraft>(emptyDraft());
  const [stepsDraftByScope, setStepsDraftByScope] = useState<Record<StepScopeKey, StepDraft[]>>({});
  const [selectedScopeVariantId, setSelectedScopeVariantId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [lookups, setLookups] = useState<{ groups: ModifierGroupResponse[]; itemsByGroupId: Record<string, ModifierItemResponse[]> }>({
    groups: [],
    itemsByGroupId: {},
  });
  const [previewSelectionsByScope, setPreviewSelectionsByScope] = useState<
    Record<StepScopeKey, Record<string, string[]>>
  >({});
  const [previewChannel, setPreviewChannel] = useState<'WEB' | 'QR' | 'POS'>('WEB');
  const [previewMode, setPreviewMode] = useState<'IN_HOUSE' | 'TAKEAWAY' | 'DELIVERY'>('IN_HOUSE');
  const [loading, setLoading] = useState(Boolean(id));
  const [savingBase, setSavingBase] = useState(false);
  const [savingSteps, setSavingSteps] = useState(false);
  const [errorBanner, setErrorBanner] = useState<BannerError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string }>({});
  const [productId, setProductId] = useState<string | null>(id ?? null);

  const companyId = firestoreUser?.company_id || '';
  const isEdit = Boolean(productId);

  const scopeKey = scopeKeyForVariant(selectedScopeVariantId);
  const currentSteps = stepsDraftByScope[scopeKey] || [];
  const selectedStep = currentSteps.find((step) => step.localId === selectedStepId) || null;
  const currentPreviewSelections = previewSelectionsByScope[scopeKey] || {};

  useEffect(() => {
    if (!productId || !companyId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const data = await getProductEdit(productId, companyId);
        setProductDraft({
          id: data.product.id,
          name: data.product.name || '',
          description: data.product.description || '',
          skuInternal: data.product.skuInternal || '',
          isActive: data.product.active,
          productKind: data.product.productKind,
          variants: data.variants || [],
        });
        setStepsDraftByScope(buildStepDrafts(data.steps || []));
        const itemsByGroupId: Record<string, ModifierItemResponse[]> = {};
        (data.modifierItems || []).forEach((item) => {
          const groupId = (item as any).modifierGroupId;
          if (!groupId) return;
          if (!itemsByGroupId[groupId]) {
            itemsByGroupId[groupId] = [];
          }
          itemsByGroupId[groupId].push(item);
        });
        setLookups({
          groups: data.modifierGroups || [],
          itemsByGroupId,
        });
      } catch (error) {
        const payload = error as ApiErrorPayload;
        setErrorBanner({
          message: payload.message || 'No se pudo cargar el producto',
          traceId: payload.traceId,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId, companyId]);

  useEffect(() => {
    if (productDraft.productKind !== 'CONFIGURABLE' && activeTab === 'preview') {
      setActiveTab('general');
    }
  }, [productDraft.productKind, activeTab]);

  const handleDraftChange = (next: Partial<ProductDraft>) => {
    setProductDraft((prev) => ({ ...prev, ...next }));
  };

  const validateGeneral = () => {
    const errors: { name?: string; description?: string } = {};
    if (!productDraft.name.trim()) {
      errors.name = 'El nombre es obligatorio';
    }
    if (productDraft.description.length > 160) {
      errors.description = 'La descripcion supera los 160 caracteres';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveBase = async () => {
    if (!companyId) return;
    setErrorBanner(null);
    if (!validateGeneral()) return;

    if (!isEdit) {
      if (productDraft.productKind === 'CONFIGURABLE' && currentSteps.length === 0) {
        setErrorBanner({ message: 'Agrega al menos un paso antes de guardar un producto configurable.' });
        setActiveTab('steps');
        return;
      }
    }

    setSavingBase(true);
    try {
      if (isEdit && productId) {
        await updateProductBase(
          productId,
          {
            name: productDraft.name,
            description: productDraft.description,
            skuInternal: productDraft.skuInternal || undefined,
            productKind: productDraft.productKind,
            isActive: productDraft.isActive,
          },
          companyId
        );
        toast.success('Producto actualizado');
      } else {
        const payload: any = {
          name: productDraft.name,
          description: productDraft.description,
          skuInternal: productDraft.skuInternal || undefined,
          productKind: productDraft.productKind,
          isActive: productDraft.isActive,
        };
        if (productDraft.productKind === 'CONFIGURABLE' && currentSteps.length > 0) {
          payload.modifierSteps = currentSteps.map((step, index) => ({
            modifierGroupId: step.modifierGroupId,
            stepOrder: index + 1,
            minSelection: step.minSelection,
            maxSelection: step.maxSelection,
            isRequired: step.isRequired,
          }));
        }
        const created = await createProduct(payload, companyId);
        toast.success('Producto creado');
        setProductId(created.id);
        navigate(`/dashboard/products/${created.id}/edit`, { replace: true });
      }
    } catch (error) {
      const payload = error as ApiErrorPayload;
      setErrorBanner({
        message: payload.message || 'Error al guardar producto',
        traceId: payload.traceId,
      });
    } finally {
      setSavingBase(false);
    }
  };

  const handleAddStep = () => {
    const localId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    const nextStep: StepDraft = {
      localId,
      modifierGroupId: '',
      stepOrder: currentSteps.length + 1,
      minSelection: 0,
      maxSelection: 1,
      isRequired: false,
    };
    const nextSteps = normalizeOrders([...currentSteps, nextStep]);
    setStepsDraftByScope((prev) => ({ ...prev, [scopeKey]: nextSteps }));
    setSelectedStepId(nextStep.localId);
  };

  const handleReorder = (nextSteps: StepDraft[]) => {
    const normalized = normalizeOrders(nextSteps);
    setStepsDraftByScope((prev) => ({ ...prev, [scopeKey]: normalized }));
  };

  const handleStepChange = (next: Partial<StepDraft>) => {
    if (!selectedStep) return;
    const updated = currentSteps.map((step) =>
      step.localId === selectedStep.localId ? { ...step, ...next } : step
    );
    setStepsDraftByScope((prev) => ({ ...prev, [scopeKey]: updated }));
  };

  const handleDeleteStep = (stepId: string) => {
    const next = currentSteps.filter((step) => step.localId !== stepId);
    setStepsDraftByScope((prev) => ({ ...prev, [scopeKey]: normalizeOrders(next) }));
    if (selectedStepId === stepId) {
      setSelectedStepId(null);
    }
  };

  const handleSaveSteps = async () => {
    if (!companyId || !productId) return;
    setErrorBanner(null);

    for (const step of currentSteps) {
      if (!step.modifierGroupId) {
        setErrorBanner({ message: 'Cada paso debe tener un grupo seleccionado.' });
        return;
      }
      if (step.minSelection > step.maxSelection) {
        setErrorBanner({ message: 'El minimo no puede ser mayor al maximo.' });
        return;
      }
      if (step.isRequired && step.minSelection < 1) {
        setErrorBanner({ message: 'Si el paso es obligatorio, el minimo debe ser 1 o mas.' });
        return;
      }
    }

    setSavingSteps(true);
    try {
      const payload = {
        variantId: selectedScopeVariantId,
        steps: currentSteps
          .filter((step): step is typeof step & { modifierGroupId: string } => Boolean(step.modifierGroupId))
          .map((step) => ({
            id: step.id || undefined,
            modifierGroupId: step.modifierGroupId,
            stepOrder: step.stepOrder,
            minSelection: step.minSelection,
            maxSelection: step.maxSelection,
            isRequired: step.isRequired,
          })),
      };
      const response = await saveProductSteps(productId, payload, companyId);
      const refreshed = response
        .sort((a, b) => a.stepOrder - b.stepOrder)
        .map((step) => ({
          id: step.id,
          localId: step.id,
          modifierGroupId: step.modifierGroupId,
          stepOrder: step.stepOrder,
          minSelection: step.minSelection,
          maxSelection: step.maxSelection,
          isRequired: step.required,
        }));
      setStepsDraftByScope((prev) => ({ ...prev, [scopeKey]: refreshed }));
      setSelectedStepId(refreshed[0]?.localId || null);
      toast.success('Pasos guardados');
    } catch (error) {
      const payload = error as ApiErrorPayload;
      setErrorBanner({
        message: payload.message || 'Error al guardar pasos',
        traceId: payload.traceId,
      });
    } finally {
      setSavingSteps(false);
    }
  };

  const handleSearchGroups = useCallback(
    async (query: string) => {
      if (!companyId) return;
      const groups = await searchModifierGroups(query, companyId);
      setLookups((prev) => ({ ...prev, groups }));
    },
    [companyId]
  );

  const handleSelectGroup = useCallback(
    async (groupId: string) => {
      if (!companyId || !groupId) return;
      if (lookups.itemsByGroupId[groupId]) return;
      try {
        const items = await getModifierGroupItems(groupId, companyId);
        setLookups((prev) => ({
          ...prev,
          itemsByGroupId: {
            ...prev.itemsByGroupId,
            [groupId]: items,
          },
        }));
      } catch (error) {
        const payload = error as ApiErrorPayload;
        setErrorBanner({
          message: payload.message || 'Error al cargar opciones',
          traceId: payload.traceId,
        });
      }
    },
    [companyId, lookups.itemsByGroupId]
  );

  useEffect(() => {
    if (selectedStep?.modifierGroupId) {
      handleSelectGroup(selectedStep.modifierGroupId);
    }
  }, [selectedStep?.modifierGroupId, handleSelectGroup]);

  const handlePreviewSelectionChange = (groupId: string, nextSelected: string[]) => {
    setPreviewSelectionsByScope((prev) => ({
      ...prev,
      [scopeKey]: {
        ...(prev[scopeKey] || {}),
        [groupId]: nextSelected,
      },
    }));
  };

  const handleScopeChange = (value: string) => {
    const nextVariantId = value === 'product' ? null : value;
    setSelectedScopeVariantId(nextVariantId);
    const nextScopeKey = scopeKeyForVariant(nextVariantId);
    setStepsDraftByScope((prev) => ({ ...prev, [nextScopeKey]: prev[nextScopeKey] || [] }));
    setPreviewSelectionsByScope((prev) => ({ ...prev, [nextScopeKey]: prev[nextScopeKey] || {} }));
    setSelectedStepId(null);
  };

  const canShowSteps = productDraft.productKind === 'CONFIGURABLE';
  const canShowPublication = Boolean(productId);
  const visibleTabs = TABS.filter((tab) => {
    if (tab.key === 'preview') return canShowSteps;
    if (tab.key === 'publication') return canShowPublication;
    return true;
  });

  const banner = errorBanner ? (
    <div className="mb-4 border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded-md">
      <p className="text-sm font-semibold">{errorBanner.message}</p>
      {errorBanner.traceId && (
        <p className="text-xs mt-1 text-red-500">traceId: {errorBanner.traceId}</p>
      )}
    </div>
  ) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse h-10 w-40 rounded bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Editar producto' : 'Nuevo producto'}
            </h1>
            <p className="text-sm text-gray-500">Wizard de producto gastro</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/products')}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Volver
          </button>
        </div>

        {banner}

        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex gap-4 px-4 sm:px-6">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 text-sm font-medium border-b-2 ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'general' && (
              <ProductGeneralForm
                draft={productDraft}
                errors={fieldErrors}
                saving={savingBase}
                onChange={handleDraftChange}
                onSave={handleSaveBase}
              />
            )}

            {activeTab === 'type' && (
              <ProductTypePanel
                draft={productDraft}
                isEdit={Boolean(id)}
                saving={savingBase}
                onChange={handleDraftChange}
                onSave={handleSaveBase}
              />
            )}

            {activeTab === 'steps' && (
              <div className="space-y-6">
                {!canShowSteps && (
                  <div className="border border-gray-200 rounded-md p-4 text-sm text-gray-500">
                    Este producto no es configurable. Cambia el tipo a Configurable para agregar pasos.
                  </div>
                )}

                {canShowSteps && !productId && (
                  <div className="border border-yellow-200 bg-yellow-50 rounded-md p-4 text-sm text-yellow-800">
                    Guarda el producto antes de configurar pasos.
                  </div>
                )}

                {canShowSteps && productId && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Pasos</h2>
                        <p className="text-xs text-gray-500">Arrastra para reordenar. Numeracion automatica.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddStep}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
                      >
                        Agregar paso
                      </button>
                    </div>

                    {productDraft.variants.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Editar pasos para variante
                        </label>
                        <select
                          value={selectedScopeVariantId ?? 'product'}
                          onChange={(e) => handleScopeChange(e.target.value)}
                          className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="product">Producto (general)</option>
                          {productDraft.variants.map((variant) => (
                            <option key={variant.id} value={variant.id}>
                              {variant.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <StepList
                        steps={currentSteps}
                        selectedStepId={selectedStepId}
                        onSelect={setSelectedStepId}
                        onReorder={handleReorder}
                        onDelete={handleDeleteStep}
                      />
                      <StepEditor
                        step={selectedStep}
                        groups={lookups.groups}
                        items={lookups.itemsByGroupId}
                        onSearchGroups={handleSearchGroups}
                        onSelectGroup={handleSelectGroup}
                        onChange={handleStepChange}
                      />
                    </div>

                    <div className="border border-yellow-200 bg-yellow-50 rounded-md p-3 text-sm text-yellow-800">
                      Esto afectara nuevas ordenes (no las ya creadas).
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveSteps}
                        disabled={savingSteps}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {savingSteps ? 'Guardando...' : 'Guardar pasos'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'publication' && (
              <PublicationPanel
                productId={productId!}
                productKind={productDraft.productKind}
                variants={productDraft.variants}
                companyId={companyId}
                onError={(message, traceId) =>
                  setErrorBanner({ message, traceId: traceId ?? undefined })
                }
              />
            )}

            {activeTab === 'preview' && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full sm:max-w-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Canal</label>
                      <select
                        value={previewChannel}
                        onChange={(e) => setPreviewChannel(e.target.value as 'WEB' | 'QR' | 'POS')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="WEB">WEB</option>
                        <option value="QR">QR</option>
                        <option value="POS">POS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Modo</label>
                      <select
                        value={previewMode}
                        onChange={(e) =>
                          setPreviewMode(e.target.value as 'IN_HOUSE' | 'TAKEAWAY' | 'DELIVERY')
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="IN_HOUSE">IN_HOUSE</option>
                        <option value="TAKEAWAY">TAKEAWAY</option>
                        <option value="DELIVERY">DELIVERY</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Simulación local. No afecta precios ni publicación.
                  </p>
                </div>

                {productDraft.variants.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Previsualizar para variante
                    </label>
                    <select
                      value={selectedScopeVariantId ?? 'product'}
                      onChange={(e) => handleScopeChange(e.target.value)}
                      className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="product">Producto (general)</option>
                      {productDraft.variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <PreviewRenderer
                  steps={currentSteps}
                  groups={lookups.groups}
                  itemsByGroupId={lookups.itemsByGroupId}
                  selectionsByGroup={currentPreviewSelections}
                  onSelectionChange={handlePreviewSelectionChange}
                  onLoadItems={handleSelectGroup}
                  scopeKey={scopeKey}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
