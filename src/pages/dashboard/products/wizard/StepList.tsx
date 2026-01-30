import React, { useState } from 'react';
import type { StepDraft } from './types';

interface StepListProps {
  steps: StepDraft[];
  selectedStepId: string | null;
  onSelect: (stepId: string) => void;
  onReorder: (next: StepDraft[]) => void;
  onDelete: (stepId: string) => void;
}

export default function StepList({ steps, selectedStepId, onSelect, onReorder, onDelete }: StepListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => () => {
    setDragIndex(index);
  };

  const handleDragOver = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleDrop = (index: number) => () => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }
    const next = [...steps];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    onReorder(next);
    setDragIndex(null);
  };

  return (
    <div className="space-y-2">
      {steps.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded-md p-4 text-sm text-gray-500">
          No hay pasos creados.
        </div>
      )}
      {steps.map((step, index) => (
        <div
          key={step.localId}
          className={`flex items-center justify-between border rounded-md p-3 ${
            selectedStepId === step.localId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
        >
          <button
            type="button"
            draggable
            onDragStart={handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={handleDrop(index)}
            onClick={() => onSelect(step.localId)}
            className="flex items-center gap-3 text-left flex-1"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {step.modifierGroupId ? `Grupo: ${step.modifierGroupId.slice(0, 8)}...` : 'Selecciona un grupo'}
              </p>
              <p className="text-xs text-gray-500">Min {step.minSelection} / Max {step.maxSelection}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onDelete(step.localId)}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Eliminar
          </button>
        </div>
      ))}
    </div>
  );
}
