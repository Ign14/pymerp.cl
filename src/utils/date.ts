import { format } from 'date-fns';

export const formatLocalDate = (date: Date): string => format(date, 'yyyy-MM-dd');
