import { supabase, hasBackend } from './client';
import { TRIPS, PLANS, OPERATORS, REVIEWS, ITINERARIES, EXPLORE, PEOPLE } from '../data/seed';
import type { Trip, Plan, Review, ExploreRegion, Operator, Person } from '../types';

// People (travellers) = real profiles, RLS-gated: a verified user sees everyone's
// profile, an unverified one sees only their own (per the gating matrix). Falls
// back to seed with no backend.
function rowToPerson(r: Record<string, unknown>): Person {
  return {
    id: String(r.id),
    name: (r.first_name as string) ?? '',
    age: (r.age as number) ?? 0,
    city: (r.city as string) ?? '',
    trips: 0,
    handle: (r.instagram as string) ?? '',
    bio: (r.bio as string) ?? '',
    lead: ((r.lead as string) ?? 'women') as Person['lead'],
  };
}

// First photo per profile id (lowest slot), for avatars on the travellers board.
async function photosFor(ids: string[]): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  if (!supabase || ids.length === 0) return map;
  const { data } = await supabase.from('photos').select('profile_id,url,slot').in('profile_id', ids).order('slot');
  for (const r of (data ?? []) as { profile_id: string; url: string }[]) {
    if (!map[r.profile_id]) map[r.profile_id] = r.url;
  }
  return map;
}

export async function getPeople(): Promise<Person[]> {
  if (!hasBackend) return PEOPLE;
  const { data, error } = await supabase!.from('profiles').select('*');
  if (error) throw error;
  // Drop half-built rows (no first name yet) so the board only shows real people.
  const rows = (data ?? []).filter((r) => r.first_name);
  const photos = await photosFor(rows.map((r) => String(r.id)));
  return rows.map((r) => ({ ...rowToPerson(r), photo: photos[String(r.id)] }));
}
export async function getPerson(id: string): Promise<Person | null> {
  if (!hasBackend) return PEOPLE.find((p) => p.id === id) ?? null;
  const { data, error } = await supabase!.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const photos = await photosFor([id]);
  return { ...rowToPerson(data), photo: photos[id] };
}

// PostgREST returns snake_case columns; the app uses camelCase. Convert on read.
const toCamelKey = (k: string) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
function camel<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) out[toCamelKey(k)] = v;
  return out as T;
}
const camelAll = <T>(rows: Record<string, unknown>[]): T[] => rows.map((r) => camel<T>(r));

// Read-side catalog API. Uses Supabase when configured, else the seed. Screens
// and hooks never branch on this — they just await these functions.

// Operator-portal trips (stage17) arrive as one `trips` row per dated departure,
// grouped by product_id. The feed shows ONE card per product (the soonest
// upcoming departure represents it, annotated with departureCount); TripDetail
// offers the date picker via getDepartures(). Legacy rows (product_id null)
// pass through untouched. RLS already hides operator drafts.
function rollUpDepartures(rows: Trip[]): Trip[] {
  const legacy: Trip[] = [];
  const byProduct = new Map<string, Trip[]>();
  for (const r of rows) {
    if (r.productId) {
      const list = byProduct.get(r.productId) ?? [];
      list.push(r);
      byProduct.set(r.productId, list);
    } else legacy.push(r);
  }
  const today = new Date().toISOString().slice(0, 10);
  const cards: Trip[] = [];
  for (const sibs of byProduct.values()) {
    const sorted = [...sibs].sort((a, b) => (a.startsOn ?? '').localeCompare(b.startsOn ?? ''));
    const rep = sorted.find((d) => (d.startsOn ?? '') >= today) ?? sorted[sorted.length - 1];
    cards.push({ ...rep, departureCount: sibs.length });
  }
  return [...legacy, ...cards];
}

export async function getTrips(): Promise<Trip[]> {
  if (!hasBackend) return TRIPS;
  const { data, error } = await supabase!.from('trips').select('*');
  if (error) throw error;
  return rollUpDepartures(camelAll<Trip>(data ?? []));
}

// All published departures of a product, for TripDetail's date picker. Reads the
// stage17 marketplace projection view (the pinned app↔portal read contract).
export async function getDepartures(productId: string): Promise<Trip[]> {
  if (!hasBackend) return [];
  const { data, error } = await supabase!
    .from('v_marketplace_departures')
    .select('*')
    .eq('product_id', productId)
    .order('starts_on');
  if (error) throw error;
  return camelAll<Trip>(data ?? []);
}

export async function getTrip(id: string): Promise<Trip | null> {
  if (!hasBackend) return TRIPS.find((t) => t.id === id) ?? null;
  const { data, error } = await supabase!.from('trips').select('*').eq('id', id).single();
  if (error) throw error;
  return data ? camel<Trip>(data) : null;
}

export async function getPlans(): Promise<Plan[]> {
  if (!hasBackend) return PLANS;
  const { data, error } = await supabase!.from('plans').select('*');
  if (error) throw error;
  return camelAll<Plan>(data ?? []);
}

export async function getPlan(id: string): Promise<Plan | null> {
  if (!hasBackend) return PLANS.find((p) => p.id === id) ?? null;
  const { data, error } = await supabase!.from('plans').select('*').eq('id', id).single();
  if (error) throw error;
  return data ? camel<Plan>(data) : null;
}

export async function getOperator(id: string): Promise<Operator | null> {
  if (!hasBackend) return OPERATORS.find((o) => o.id === id) ?? null;
  const { data, error } = await supabase!.from('operators').select('*').eq('id', id).single();
  if (error) throw error;
  return data ? camel<Operator>(data) : null;
}

export async function getReviews(operatorId: string): Promise<Review[]> {
  if (!hasBackend) return REVIEWS.filter((r) => r.operatorId === operatorId);
  const { data, error } = await supabase!.from('reviews').select('*').eq('operator_id', operatorId);
  if (error) throw error;
  // DB column is when_label (when is reserved) → map to the type's `when`.
  return camelAll<Review & { whenLabel: string }>(data ?? []).map(({ whenLabel, ...r }) => ({ ...r, when: whenLabel }));
}

export async function getItinerary(tripId: string): Promise<string[]> {
  if (!hasBackend) return ITINERARIES[tripId] ?? [];
  const { data, error } = await supabase!
    .from('itineraries')
    .select('line')
    .eq('trip_id', tripId)
    .order('idx');
  if (error) throw error;
  return (data ?? []).map((r: { line: string }) => r.line);
}

export async function getExploreRegion(key: string): Promise<ExploreRegion | null> {
  // Explore content lives in seed for now; wire explore_regions/places when needed.
  return EXPLORE.find((r) => r.key === key) ?? null;
}
