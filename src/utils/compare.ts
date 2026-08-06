import type { Trip } from '../types';

export interface CompareOp {
  name: string;
  price: number;
  perDay: number;
  rating: number;
  reviews: number;
  stay: string;
  meals: string;
  transport: string;
  permits: string;
  groupSize: number;
  solo: number;
  departs: string;
  cancel: string;
  quote: string;
  self: boolean; // the current listing
}

const NAMES = ['Trek Tribe', 'Voyage Valley', 'Zostel Travel', 'Coast & Co', 'Marwar Trails'];
const MEALS = ['All meals', 'Breakfast & dinner', 'Breakfast only', 'No meals'];
const TRANSPORT = ['Volvo + tempo', 'Tempo traveller', 'Shared SUVs', 'Train + cab'];
const CANCEL = ['Free till 15 days', 'Free till 7 days', '50% till 7 days', 'Non-refundable'];
const QUOTES = [
  'Rooms were exactly what the listing said.',
  'Started late on day one, smooth after.',
  'They seat solo travellers together on purpose.',
  'Permit cost was a surprise at the checkpoint.',
  'Driver knew every chai stop on the route.',
];

// Synthesize the route's operators around the listing (seed has one per trip).
// Deterministic in trip.id so the compare table and the switch banner agree.
export function operatorsFor(trip: Trip): CompareOp[] {
  const n = Math.max(2, trip.operators);
  const selfName = trip.operatorId.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  const others = NAMES.filter((nm) => nm !== selfName); // avoid colliding with the listing
  return Array.from({ length: n }).map((_, i) => {
    const price = Math.round((trip.price * (0.82 + i * 0.09)) / 100) * 100;
    return {
      name: i === 0 ? selfName : others[(i - 1) % others.length],
      price,
      perDay: Math.round(price / trip.days / 10) * 10,
      rating: Math.max(3.8, Math.min(4.9, Number((trip.rating - 0.2 + i * 0.15).toFixed(1)))),
      reviews: 40 + ((i * 23) % 80),
      stay: i % 3 === 0 ? trip.stay : 'Camps',
      meals: MEALS[i % MEALS.length],
      transport: TRANSPORT[i % TRANSPORT.length],
      permits: i % 2 === 0 ? 'Included' : 'You pay',
      groupSize: trip.groupSize + (i % 3) - 1,
      solo: 30 + ((i * 17) % 40),
      departs: trip.cities,
      cancel: CANCEL[i % CANCEL.length],
      quote: QUOTES[(i + trip.id.length) % QUOTES.length],
      self: i === 0,
    };
  });
}
