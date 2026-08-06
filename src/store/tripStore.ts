import { create } from 'zustand';

export type SortKey = 'fastest' | 'priceLow' | 'priceHigh' | 'rating' | 'shortest';
export type RunBy = 'any' | 'operator' | 'traveller';

export interface TripFilters {
  sort: SortKey;
  runBy: RunBy;
  price: 'any' | 'under10' | '10to20' | 'over20';
  days: 'any' | '1to3' | '4to6' | '7plus';
  month: string | 'any';
  type: string | 'any';
  place: string | 'any';
  difficulty: string | 'any';
  rating: 'any' | '4' | '4.5';
}

export const DEFAULT_FILTERS: TripFilters = {
  sort: 'fastest', runBy: 'any', price: 'any', days: 'any', month: 'any',
  type: 'any', place: 'any', difficulty: 'any', rating: 'any',
};

export const SORT_LABEL: Record<SortKey, string> = {
  fastest: 'Filling fastest', priceLow: 'Price: low first', priceHigh: 'Price: high first',
  rating: 'Rating', shortest: 'Shortest',
};

// Operator chosen from the comparison, per trip → drives the "Switched to…" banner.
export interface OperatorOverride {
  name: string;
  price: number;
}

interface TripState {
  filters: TripFilters;
  overrides: Record<string, OperatorOverride>;
  setFilters: (f: Partial<TripFilters>) => void;
  reset: () => void;
  activeCount: () => number;
  chooseOperator: (tripId: string, op: OperatorOverride) => void;
}

export const useTripStore = create<TripState>((set, get) => ({
  filters: DEFAULT_FILTERS,
  overrides: {},
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  chooseOperator: (tripId, op) => set((s) => ({ overrides: { ...s.overrides, [tripId]: op } })),
  reset: () => set({ filters: DEFAULT_FILTERS }),
  activeCount: () => {
    const f = get().filters;
    return (Object.keys(f) as (keyof TripFilters)[])
      .filter((k) => k !== 'sort' && f[k] !== 'any' && f[k] !== DEFAULT_FILTERS[k]).length;
  },
}));
