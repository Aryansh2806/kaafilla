import { File } from 'expo-file-system';
import { supabase } from './client';
import type { Plan, Lead } from '../types';

// Write-side API (mutations). Reads live in catalog.ts. Row-level security on the
// server is the real gate; these just shape the request.

// Map a free-text place ("Tirthan Valley, Himachal") to an explore region key so
// user-created plans pick up destination hero photos. Returns '' if nothing matches.
const REGION_KEYWORDS: Record<string, string[]> = {
  himachal: ['himachal', 'spiti', 'kasol', 'kheerganga', 'manali', 'tirthan', 'hampta', 'kullu', 'dharamshala', 'mcleodganj', 'bir', 'shimla', 'kinnaur', 'parvati'],
  ladakh: ['ladakh', 'leh', 'nubra', 'zanskar', 'pangong', 'kargil'],
  uttarakhand: ['uttarakhand', 'rishikesh', 'valley of flowers', 'kedarnath', 'nainital', 'mussoorie', 'auli', 'chopta', 'dehradun', 'harsil', 'tungnath'],
  northeast: ['meghalaya', 'shillong', 'assam', 'guwahati', 'arunachal', 'sikkim', 'gangtok', 'nagaland', 'cherrapunji', 'northeast', 'tawang', 'ziro'],
  karnataka: ['karnataka', 'gokarna', 'coorg', 'bengaluru', 'bangalore', 'hampi', 'chikmagalur', 'mysore'],
  rajasthan: ['rajasthan', 'jaisalmer', 'jaipur', 'udaipur', 'jodhpur', 'pushkar', 'thar', 'bikaner', 'mount abu'],
  kerala: ['kerala', 'varkala', 'kochi', 'munnar', 'alleppey', 'wayanad', 'kovalam', 'kumarakom'],
  goa: ['goa', 'anjuna', 'palolem', 'arambol', 'panjim', 'vagator', 'baga'],
};

export function inferRegion(place: string): string {
  const p = place.toLowerCase();
  for (const [region, kws] of Object.entries(REGION_KEYWORDS)) {
    if (kws.some((k) => p.includes(k))) return region;
  }
  return '';
}

function planId(place: string): string {
  const slug =
    place
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24) || 'plan';
  return `${slug}-${Date.now().toString(36)}`;
}

export interface NewPlanInput {
  place: string;
  costEach: number;
  note: string;
  hostName: string;
  hostId: string;
  lead?: Lead;
  photos?: string[]; // local image URIs to upload (already-remote http URLs pass through)
}

// Upload local image URIs to the public 'listings' bucket under <uid>/<planId>/,
// returning ordered public URLs. Mirrors the avatar uploader: remote URLs pass
// through, and any single failed upload is skipped rather than failing the post.
async function uploadListingPhotos(uris: string[], uid: string, planId: string): Promise<string[]> {
  if (!supabase || uris.length === 0) return [];
  const out: string[] = [];
  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i];
    if (/^https?:\/\//.test(uri)) {
      out.push(uri);
      continue;
    }
    try {
      const bytes = await new File(uri).bytes();
      const path = `${uid}/${planId}/${i + 1}.jpg`;
      const { error } = await supabase.storage
        .from('listings')
        .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      out.push(supabase.storage.from('listings').getPublicUrl(path).data.publicUrl);
    } catch {
      // skip this photo
    }
  }
  return out;
}

function rowToPlan(r: Record<string, any>): Plan {
  return {
    id: r.id,
    name: r.name ?? r.place ?? '',
    place: r.place ?? '',
    region: r.region ?? '',
    costEach: r.cost_each ?? 0,
    days: r.days ?? 0,
    month: r.month ?? '',
    stay: r.stay ?? '',
    groupSize: r.group_size ?? 0,
    joined: r.joined ?? 0,
    hostName: r.host_name ?? '',
    hostId: r.host_id ?? '',
    lead: (r.lead ?? 'women') as Lead,
    hostTrips: r.host_trips ?? 0,
    hostRating: r.host_rating ?? 0,
    dates: (r.dates ?? 'flexible') as 'flexible' | 'fixed',
    cities: r.cities ?? '',
    note: r.note ?? '',
    images: Array.isArray(r.images) ? r.images : [],
  };
}

// Host a traveller plan. Requires a verified session (enforced by RLS too).
export async function createPlan(input: NewPlanInput): Promise<Plan> {
  if (!supabase) throw new Error('Backend not configured');
  const id = planId(input.place);
  const images = await uploadListingPhotos(input.photos ?? [], input.hostId, id);
  const row = {
    id,
    name: input.place,
    place: input.place,
    region: inferRegion(input.place),
    joined: 0,
    cost_each: input.costEach || 0,
    host_name: input.hostName,
    host_id: input.hostId,
    lead: input.lead ?? null,
    host_trips: 0,
    dates: 'flexible' as const,
    cities: '',
    note: input.note,
    images,
  };
  const { data, error } = await supabase.from('plans').insert(row).select().single();
  if (error) throw error;
  return rowToPlan(data as Record<string, any>);
}
