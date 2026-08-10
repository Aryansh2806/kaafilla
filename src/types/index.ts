// Domain types. Kept in one file until a screen needs a narrower split.

export type Lead = 'women' | 'men';
export type RunBy = 'operator' | 'traveller';

export interface Operator {
  id: string;
  name: string;
  since: number;
}

export interface Trip {
  id: string;
  name: string;
  place: string; // region label e.g. "Himachal"
  region: string; // explore region key
  price: number; // ₹ per person
  days: number;
  type: string; // travel type
  womenPct: number;
  rating: number;
  stay: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  month: string;
  groupSize: number;
  waitlist: number;
  operators: number; // how many operators run this route
  operatorId: string;
  leadName: string;
  lead: Lead;
  leadYears: number;
  cities: string; // departs from
  images?: string[]; // operator-supplied photo URLs (images[0] = cover); [] falls back to placeholders
}

export interface Plan {
  id: string;
  name: string;
  place: string;
  region: string;
  costEach: number;
  days: number;
  month: string;
  stay: string;
  groupSize: number;
  joined: number;
  hostName: string;
  hostId: string;
  lead: Lead;
  hostTrips: number;
  hostRating: number;
  dates: 'flexible' | 'fixed';
  cities: string;
  note: string;
  images?: string[]; // host-supplied photo URLs (images[0] = cover); [] falls back to placeholders
}

export interface Person {
  id: string;
  name: string;
  age: number;
  city: string;
  trips: number;
  handle: string; // shown masked until connected
  bio: string;
  lead: Lead;
  photo?: string; // first profile photo (public URL), when available
}

export interface Review {
  id: string;
  operatorId: string;
  name: string;
  stars: number;
  when: string;
  text: string;
}

export interface ExplorePlace {
  name: string;
  meta?: string;
  desc: string;
  addedBy?: string;
  status?: string;
}
export interface ExploreRegion {
  key: string;
  base: string; // "Around Kaza"
  sub: string;
  perDay: number;
  famous: ExplorePlace[];
  food: ExplorePlace[];
  gems: ExplorePlace[];
  shops: ExplorePlace[];
  know: string[];
}

export type VerificationStatus = 'none' | 'pending' | 'verified';

export interface Profile {
  id: string;
  firstName: string;
  age?: number;
  city?: string;
  work?: string;
  bio?: string;
  instagram?: string;
  photos?: string[];
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  lead?: Lead; // declared gender, locked once set
  // soft photo/gender consistency check (flag-for-review model, never auto-block)
  genderCheck?: GenderCheck;
  detectedGender?: Lead; // what the photo model returned, for the reviewer
}

export type GenderCheck = 'unchecked' | 'match' | 'needs_review';
