import React from 'react';
import type { ProductDraft } from './types';
import type { ProductKind } from '../../../../services/gastroProducts';

interface ProductTypePanelProps {
  draft: ProductDraft;
  isEdit: boolean;
  saving: boolean;
  onChange: (next: Partial<ProductDraft>) => void;
  onSave: () => void;
}

const KIND_LABELS: Record<ProductKind, string> = {
  SIMPLE: 'Simple',
  CONFIGURABLE: 'Configurable',
  COMBO: 'Combo',
};

export default function ProductTypePanel({ draft, isEdit, saving, onChange, onSave }: ProductTypePanelProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Tipo de producto</label>
        {isEdit ? (
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <p className="text-sm font-semibold text-gray-900">{KIND_LABELS[draft.productKind]}</p>
            <p className="text-xs text-gray-500 mt-1">El tipo no se puede cambiar luego de creado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['SIMPLE', 'CONFIGURABLE', 'COMBO'] as ProductKind[]).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => onChange({ productKind: kind })}
                className={`border rounded-md p-4 text-left transition ${
                  draft.productKind === kind
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">{KIND_LABELS[kind]}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {kind === 'SIMPLE' && 'Sin pasos ni variantes'}
                  {kind === 'CONFIGURABLE' && 'Con pasos de modificadores'}
                  {kind === 'COMBO' && 'Incluye productos'}
                </p>
              </button>
            ))}
          </div>
        )}
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
