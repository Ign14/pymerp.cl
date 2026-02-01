import type { ProductDraft } from './types';

interface FieldErrors {
  name?: string;
  description?: string;
}

interface ProductGeneralFormProps {
  draft: ProductDraft;
  errors: FieldErrors;
  saving: boolean;
  onChange: (next: Partial<ProductDraft>) => void;
  onSave: () => void;
}

export default function ProductGeneralForm({ draft, errors, saving, onChange, onSave }: ProductGeneralFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre *
        </label>
        <input
          type="text"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripcion (max 160)
        </label>
        <textarea
          rows={4}
          maxLength={160}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{draft.description.length}/160</span>
          {errors.description && <span className="text-red-600">{errors.description}</span>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          SKU interno (opcional)
        </label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={draft.skuInternal}
          onChange={(e) => onChange({ skuInternal: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-3">
        <div>
          <p className="text-sm font-medium text-gray-700">Producto activo</p>
          <p className="text-xs text-gray-500">Disponible para nuevas ordenes</p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ isActive: !draft.isActive })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            draft.isActive ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              draft.isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar borrador'}
        </button>
      </div>
    </div>
  );
}
