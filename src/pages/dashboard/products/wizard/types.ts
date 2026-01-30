import type { ModifierItemResponse, ModifierGroupResponse, ProductKind, VariantResponse } from '../../../../services/gastroProducts';

export type StepScopeKey = string; // 'product' or variantId

export interface StepDraft {
  id?: string | null;
  localId: string;
  modifierGroupId?: string | null;
  stepOrder: number;
  minSelection: number;
  maxSelection: number;
  isRequired: boolean;
}

export interface ProductDraft {
  id?: string | null;
  name: string;
  description: string;
  skuInternal: string;
  isActive: boolean;
  productKind: ProductKind;
  variants: VariantResponse[];
}

export interface LookupsState {
  groups: ModifierGroupResponse[];
  itemsByGroupId: Record<string, ModifierItemResponse[]>;
}

export const scopeKeyForVariant = (variantId?: string | null): StepScopeKey => {
  return variantId ?? 'product';
};
