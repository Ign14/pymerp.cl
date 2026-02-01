import { useEffect, useMemo, useState } from 'react';
import type { ModifierGroupResponse } from '../../../../services/gastroProducts';
import type { StepDraft } from './types';
import ItemList from './ItemList';

interface StepEditorProps {
  step: StepDraft | null;
  groups: ModifierGroupResponse[];
  items: Record<string, { id: string; name: string; priceDelta: number; active: boolean }[]>;
  onSearchGroups: (query: string) => Promise<void>;
  onSelectGroup: (groupId: string) => void;
  onChange: (next: Partial<StepDraft>) => void;
}

export default function StepEditor({ step, groups, items, onSearchGroups, onSelectGroup, onChange }: StepEditorProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearchGroups(query).catch(() => undefined);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, onSearchGroups]);

  const validation = useMemo(() => {
    if (!step) return {} as Record<string, string>;
    const errors: Record<string, string> = {};
    if (step.minSelection > step.maxSelection) {
      errors.minSelection = 'El minimo no puede ser mayor al maximo';
      errors.maxSelection = 'El maximo no puede ser menor al minimo';
    }
    if (step.isRequired && step.minSelection < 1) {
      errors.minSelection = 'Si es obligatorio, el minimo debe ser 1 o mas';
    }
    if (!step.modifierGroupId) {
      errors.modifierGroupId = 'Selecciona un grupo';
    }
    return errors;
  }, [step]);

  if (!step) {
    return (
      <div className="border border-dashed border-gray-200 rounded-md p-4 text-sm text-gray-500">
        Selecciona un paso para editar sus reglas.
      </div>
    );
  }

  const groupItems = step.modifierGroupId ? items[step.modifierGroupId] || [] : [];

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Grupo de opciones</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar grupo..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
        />
        <select
          value={step.modifierGroupId || ''}
          onChange={(e) => {
            onChange({ modifierGroupId: e.target.value });
            onSelectGroup(e.target.value);
          }}
          className={`w-full px-3 py-2 border rounded-md ${
            validation.modifierGroupId ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Selecciona un grupo</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        {validation.modifierGroupId && (
          <p className="text-xs text-red-600 mt-1">{validation.modifierGroupId}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimo</label>
          <input
            type="number"
            min={0}
            value={step.minSelection}
            onChange={(e) => onChange({ minSelection: Number(e.target.value) })}
            className={`w-full px-3 py-2 border rounded-md ${
              validation.minSelection ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validation.minSelection && (
            <p className="text-xs text-red-600 mt-1">{validation.minSelection}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maximo</label>
          <input
            type="number"
            min={0}
            value={step.maxSelection}
            onChange={(e) => onChange({ maxSelection: Number(e.target.value) })}
            className={`w-full px-3 py-2 border rounded-md ${
              validation.maxSelection ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validation.maxSelection && (
            <p className="text-xs text-red-600 mt-1">{validation.maxSelection}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            id="required-toggle"
            type="checkbox"
            checked={step.isRequired}
            onChange={(e) => onChange({ isRequired: e.target.checked })}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="required-toggle" className="text-sm text-gray-700">Obligatorio</label>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Opciones del grupo</h4>
        <ItemList items={groupItems} />
      </div>
    </div>
  );
}
