import type { Trip, Plan } from '../types';
import type { TripFilters } from '../store/tripStore';

export type Row = { type: 'trip'; data: Trip } | { type: 'plan'; data: Plan };

const inPrice = (n: number, band: TripFilters['price']) =>
  band === 'any' || (band === 'under10' ? n < 10000 : band === '10to20' ? n >= 10000 && n <= 20000 : n > 20000);
const inDays = (d: number, band: TripFilters['days']) =>
  band === 'any' || (band === '1to3' ? d <= 3 : band === '4to6' ? d >= 4 && d <= 6 : d >= 7);

export function applyFilters(trips: Trip[], plans: Plan[], f: TripFilters): Row[] {
  let rows: Row[] = [];
  if (f.runBy !== 'traveller') rows.push(...trips.map((d) => ({ type: 'trip' as const, data: d })));
  if (f.runBy !== 'operator') rows.push(...plans.map((d) => ({ type: 'plan' as const, data: d })));

  rows = rows.filter((r) => {
    const price = r.type === 'trip' ? r.data.price : r.data.costEach;
    if (!inPrice(price, f.price)) return false;
    if (!inDays(r.data.days, f.days)) return false;
    if (f.month !== 'any' && r.data.month !== f.month) return false;
    if (f.place !== 'any' && r.data.place !== f.place) return false;
    if (r.type === 'trip') {
      if (f.type !== 'any' && r.data.type !== f.type) return false;
      if (f.difficulty !== 'any' && r.data.difficulty !== f.difficulty) return false;
      if (f.rating !== 'any' && r.data.rating < Number(f.rating)) return false;
    } else if (f.type !== 'any' || f.difficulty !== 'any' || f.rating !== 'any') {
      return false; // plans have no type/difficulty/rating — excluded when those are set
    }
    return true;
  });

  const price = (r: Row) => (r.type === 'trip' ? r.data.price : r.data.costEach);
  const activity = (r: Row) => (r.type === 'trip' ? r.data.waitlist : r.data.joined);
  const sorters: Record<TripFilters['sort'], (a: Row, b: Row) => number> = {
    fastest: (a, b) => activity(b) - activity(a),
    priceLow: (a, b) => price(a) - price(b),
    priceHigh: (a, b) => price(b) - price(a),
    rating: (a, b) => (b.type === 'trip' ? b.data.rating : 0) - (a.type === 'trip' ? a.data.rating : 0),
    shortest: (a, b) => a.data.days - b.data.days,
  };
  return rows.sort(sorters[f.sort]);
}
