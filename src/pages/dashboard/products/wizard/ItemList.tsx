import React from 'react';
import type { ModifierItemResponse } from '../../../../services/gastroProducts';

interface ItemListProps {
  items: ModifierItemResponse[];
}

export default function ItemList({ items }: ItemListProps) {
  if (!items || items.length === 0) {
    return (
      <div className="border border-dashed border-gray-200 rounded-md p-3 text-xs text-gray-500">
        No hay opciones en este grupo.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between border border-gray-200 rounded-md p-2">
          <div>
            <p className="text-sm font-medium text-gray-900">{item.name}</p>
            <p className="text-xs text-gray-500">{item.active ? 'Activo' : 'Inactivo'}</p>
          </div>
          <span className="text-xs font-semibold text-gray-700">+{item.priceDelta}</span>
        </div>
      ))}
    </div>
  );
}
