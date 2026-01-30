export const getSelectedCount = (selectedIds: string[] = []): number => {
  return selectedIds.length;
};

export const getEffectiveMin = (min: number, isRequired: boolean): number => {
  if (min > 0) return min;
  return isRequired ? 1 : 0;
};

export const isInvalidConfig = (max: number, effectiveMin: number): boolean => {
  return max < effectiveMin;
};

export const remainingToMin = (min: number, selectedCount: number): number => {
  if (min <= 0) return 0;
  return Math.max(0, min - selectedCount);
};

export const canSelectMore = (
  max: number,
  selectedCount: number,
  isAlreadySelected: boolean
): boolean => {
  if (isAlreadySelected) return true;
  if (max <= 0) return false;
  return selectedCount < max;
};
