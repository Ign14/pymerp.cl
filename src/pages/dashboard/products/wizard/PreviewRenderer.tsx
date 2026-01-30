import React, { useEffect, useMemo } from 'react';
import type { ModifierGroupResponse, ModifierItemResponse } from '../../../../services/gastroProducts';
import type { StepDraft } from './types';
import { canSelectMore, getEffectiveMin, getSelectedCount, isInvalidConfig, remainingToMin } from './previewRules';

interface PreviewRendererProps {
  steps: StepDraft[];
  groups: ModifierGroupResponse[];
  itemsByGroupId: Record<string, ModifierItemResponse[]>;
  selectionsByGroup: Record<string, string[]>;
  onSelectionChange: (groupId: string, nextSelected: string[]) => void;
  onLoadItems: (groupId: string) => void;
  scopeKey: string;
}

const getGroupName = (groups: ModifierGroupResponse[], groupId?: string | null) => {
  if (!groupId) return 'Paso';
  return groups.find((group) => group.id === groupId)?.name || 'Paso';
};

export default function PreviewRenderer({
  steps,
  groups,
  itemsByGroupId,
  selectionsByGroup,
  onSelectionChange,
  onLoadItems,
  scopeKey,
}: PreviewRendererProps) {
  const orderedSteps = useMemo(() => {
    return [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
  }, [steps]);

  useEffect(() => {
    orderedSteps.forEach((step) => {
      const groupId = step.modifierGroupId;
      if (!groupId) return;
      if (!itemsByGroupId[groupId]) {
        onLoadItems(groupId);
      }
    });
  }, [orderedSteps, itemsByGroupId, onLoadItems]);

  useEffect(() => {
    orderedSteps.forEach((step) => {
      if (step.maxSelection > 1) return;
      const groupId = step.modifierGroupId || '';
      if (!groupId) return;
      const selectedIds = selectionsByGroup[groupId] || [];
      if (selectedIds.length <= 1) return;
      onSelectionChange(groupId, [selectedIds[0]]);
    });
  }, [orderedSteps, selectionsByGroup, onSelectionChange]);

  if (orderedSteps.length === 0) {
    return (
      <div className="border border-dashed border-gray-200 rounded-md p-4 text-sm text-gray-500">
        No hay pasos configurados para este scope.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {orderedSteps.map((step) => {
        const groupId = step.modifierGroupId || '';
        const groupName = getGroupName(groups, step.modifierGroupId);
        const items = groupId ? itemsByGroupId[groupId] : undefined;
        const selectedIds = selectionsByGroup[groupId] || [];
        const selectedCount = getSelectedCount(selectedIds);
        const effectiveMin = getEffectiveMin(step.minSelection, step.isRequired);
        const remaining = remainingToMin(effectiveMin, selectedCount);
        const atMax = step.maxSelection > 0 && selectedCount >= step.maxSelection;
        const invalidConfig = isInvalidConfig(step.maxSelection, effectiveMin);
        const showMaxReached = atMax && items?.some((item) => !selectedIds.includes(item.id));

        return (
          <div key={step.localId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{groupName}</h3>
                <p className="text-xs text-gray-500">
                  Mínimo {effectiveMin} / Máximo {step.maxSelection}
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {invalidConfig && (
                <p className="text-xs text-amber-600">
                  Configuración inválida: máximo no puede ser menor que mínimo
                </p>
              )}
              {!step.modifierGroupId && (
                <div className="text-xs text-gray-500">Este paso no tiene grupo asignado.</div>
              )}

              {step.modifierGroupId && !items && (
                <button
                  type="button"
                  onClick={() => onLoadItems(step.modifierGroupId || '')}
                  className="px-3 py-2 text-xs font-semibold rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cargar opciones
                </button>
              )}

              {items && items.length === 0 && (
                <div className="border border-dashed border-gray-200 rounded-md p-3 text-xs text-gray-500">
                  No hay opciones en este grupo.
                </div>
              )}

              {items && items.length > 0 && (
                <div className="space-y-2">
                  {items.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    const selectable = canSelectMore(step.maxSelection, selectedCount, isSelected);
                    const disabledByMax = atMax && !isSelected;
                    const isDisabled = invalidConfig || !item.active || !selectable || disabledByMax;
                    const inputType = step.maxSelection <= 1 ? 'radio' : 'checkbox';
                    const inputName = `preview-${scopeKey}-${step.localId}`;

                    const handleChange = () => {
                      if (inputType === 'radio') {
                        if (!isSelected) {
                          onSelectionChange(groupId, [item.id]);
                        }
                        return;
                      }
                      if (isSelected) {
                        onSelectionChange(
                          groupId,
                          selectedIds.filter((id) => id !== item.id)
                        );
                        return;
                      }
                      if (!selectable) return;
                      onSelectionChange(groupId, [...selectedIds, item.id]);
                    };

                    return (
                      <label
                        key={item.id}
                        className={`flex items-center justify-between gap-3 border rounded-md px-3 py-2 ${
                          isDisabled ? 'border-gray-200 bg-gray-100 text-gray-400' : 'border-gray-200 bg-white'
                        }`}
                        title={disabledByMax ? 'Máximo alcanzado' : undefined}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type={inputType}
                            name={inputName}
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 border-gray-300"
                          />
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            {!item.active && <p className="text-xs text-gray-400">Inactivo</p>}
                          </div>
                        </div>
                        {item.priceDelta > 0 && (
                          <span className="text-xs font-semibold text-gray-700">+ ${item.priceDelta}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
              {showMaxReached && !invalidConfig && (
                <p className="text-xs text-amber-600">Máximo alcanzado</p>
              )}
            </div>

            {(step.isRequired || effectiveMin > 0) && (
              <div className="mt-3">
                {remaining > 0 ? (
                  <p className="text-xs text-red-600">
                    Te falta seleccionar {remaining} opción(es)
                  </p>
                ) : (
                  <p className="text-xs text-green-600">Listo</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
