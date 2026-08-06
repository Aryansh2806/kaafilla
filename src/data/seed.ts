import type { Operator, Trip, Plan, Person, Review, ExploreRegion } from '../types';

// Exact prototype catalog. This is the single source that (a) seeds Postgres via
// seed.sql and (b) is the app's offline fallback behind the api/ layer, so screens
// are backend-shaped whether or not Supabase is live.

export const OPERATORS: Operator[] = [
  { id: 'himalayan-nomads', name: 'Himalayan Nomads', since: 2016 },
  { id: 'trek-tribe', name: 'Trek Tribe', since: 2018 },
  { id: 'voyage-valley', name: 'Voyage Valley', since: 2017 },
  { id: 'zostel-travel', name: 'Zostel Travel', since: 2014 },
  { id: 'northeast-collective', name: 'Northeast Collective', since: 2019 },
  { id: 'coast-co', name: 'Coast & Co', since: 2020 },
  { id: 'marwar-trails', name: 'Marwar Trails', since: 2015 },
];

export const TRIPS: Trip[] = [
  { id: 'spiti', name: 'Spiti Valley Circuit', place: 'Himachal', region: 'himachal', price: 15200, days: 6, type: 'Mountains', womenPct: 58, rating: 4.6, stay: 'Homestays', difficulty: 'Moderate', month: 'Sep', groupSize: 12, waitlist: 12, operators: 4, operatorId: 'himalayan-nomads', leadName: 'Tashi', lead: 'women', leadYears: 6, cities: 'Delhi, Manali' },
  { id: 'kheer', name: 'Kheerganga & Kasol', place: 'Himachal', region: 'himachal', price: 6400, days: 3, type: 'Treks', womenPct: 38, rating: 4.2, stay: 'Camps', difficulty: 'Easy', month: 'Sep', groupSize: 18, waitlist: 8, operators: 3, operatorId: 'trek-tribe', leadName: 'Vikram', lead: 'men', leadYears: 4, cities: 'Delhi' },
  { id: 'hampta', name: 'Hampta Pass Trek', place: 'Himachal', region: 'himachal', price: 11900, days: 5, type: 'Treks', womenPct: 50, rating: 4.4, stay: 'Camps', difficulty: 'Moderate', month: 'Sep', groupSize: 9, waitlist: 5, operators: 2, operatorId: 'voyage-valley', leadName: 'Priya', lead: 'women', leadYears: 5, cities: 'Manali' },
  { id: 'ladakh', name: 'Leh & Nubra Loop', place: 'Ladakh', region: 'ladakh', price: 24500, days: 8, type: 'Road trips', womenPct: 44, rating: 4.7, stay: 'Hotels', difficulty: 'Moderate', month: 'Oct', groupSize: 14, waitlist: 17, operators: 5, operatorId: 'zostel-travel', leadName: 'Stanzin', lead: 'men', leadYears: 9, cities: 'Leh, Delhi' },
  { id: 'meghalaya', name: 'Living Root Bridges', place: 'Northeast', region: 'northeast', price: 18900, days: 6, type: 'Treks', womenPct: 66, rating: 4.8, stay: 'Homestays', difficulty: 'Hard', month: 'Oct', groupSize: 8, waitlist: 9, operators: 3, operatorId: 'northeast-collective', leadName: 'Ibanri', lead: 'women', leadYears: 7, cities: 'Guwahati' },
  { id: 'gokarna', name: 'Gokarna Beach Week', place: 'Karnataka', region: 'karnataka', price: 8900, days: 4, type: 'Beaches', womenPct: 52, rating: 4.1, stay: 'Hostels', difficulty: 'Easy', month: 'Nov', groupSize: 16, waitlist: 6, operators: 2, operatorId: 'coast-co', leadName: 'Rohan', lead: 'men', leadYears: 3, cities: 'Bengaluru' },
  { id: 'jaisalmer', name: 'Thar Desert Nights', place: 'Rajasthan', region: 'rajasthan', price: 9600, days: 3, type: 'Deserts', womenPct: 41, rating: 4.0, stay: 'Camps', difficulty: 'Easy', month: 'Nov', groupSize: 20, waitlist: 4, operators: 3, operatorId: 'marwar-trails', leadName: 'Karan', lead: 'men', leadYears: 8, cities: 'Jaipur' },
  { id: 'valley', name: 'Valley of Flowers', place: 'Uttarakhand', region: 'uttarakhand', price: 13400, days: 6, type: 'Treks', womenPct: 71, rating: 4.5, stay: 'Homestays', difficulty: 'Moderate', month: 'Sep', groupSize: 11, waitlist: 14, operators: 4, operatorId: 'himalayan-nomads', leadName: 'Meenakshi', lead: 'women', leadYears: 6, cities: 'Rishikesh' },
];

export const PLANS: Plan[] = [
  { id: 'tirthan', name: 'Tirthan Valley cabin week', place: 'Himachal', region: 'himachal', costEach: 14000, days: 7, month: 'Oct', stay: 'Homestays', groupSize: 6, joined: 4, hostName: 'Arjun', hostId: 'arjun', lead: 'men', hostTrips: 3, hostRating: 4.7, dates: 'flexible', cities: 'Delhi', note: 'A cabin by the river, four of us so far. No fixed plan beyond trout and a lot of nothing.' },
  { id: 'zanskar', name: 'Zanskar road trip, slow', place: 'Ladakh', region: 'ladakh', costEach: 21000, days: 9, month: 'Sep', stay: 'Hotels', groupSize: 5, joined: 2, hostName: 'Nandita', hostId: 'nandita', lead: 'women', hostTrips: 2, hostRating: 4.5, dates: 'flexible', cities: 'Leh', note: 'Renting one Thar between us. Looking for two more who can drive and split fuel.' },
  { id: 'varkala', name: 'Varkala work-and-swim', place: 'Kerala', region: 'kerala', costEach: 11500, days: 12, month: 'Nov', stay: 'Hostels', groupSize: 5, joined: 3, hostName: 'Sana', hostId: 'sana', lead: 'women', hostTrips: 4, hostRating: 4.8, dates: 'fixed', cities: 'Kochi', note: 'Remote work in the mornings, cliff and sea after. Need people who actually work, not party.' },
];

export const PEOPLE: Person[] = [
  { id: 'meera', name: 'Meera', age: 27, city: 'Bengaluru', trips: 4, handle: '@meera.walks', lead: 'women', bio: 'Waitlisted for Spiti Sep 12–17. Looking for one or two people to split a homestay room. Slow mornings, long walks, early nights.' },
  { id: 'nikita', name: 'Nikita', age: 24, city: 'Pune', trips: 0, handle: '@nikita.offgrid', lead: 'women', bio: 'First solo trip. Would rather join a group that already has women in it. I photograph everything and overpack.' },
  { id: 'dev', name: 'Dev', age: 30, city: 'Mumbai', trips: 3, handle: '@dev.drives', lead: 'men', bio: 'Have a car, happy to drive the hard stretches. Been to Tirthan twice. Splitting fuel over splitting the bill.' },
  { id: 'ritu', name: 'Ritu', age: 26, city: 'Delhi', trips: 5, handle: '@ritu.rambles', lead: 'women', bio: 'Two weeks off and no plan. Slow travel, homestays, no itinerary. Will find the one good chai stall in any town.' },
];

export const REVIEWS: Review[] = [
  { id: 'r1', operatorId: 'himalayan-nomads', name: 'Ritu', stars: 5, when: 'Jun 2026', text: 'Trip lead checked in on every one of us at each stop. Rooms were exactly what the listing said.' },
  { id: 'r2', operatorId: 'himalayan-nomads', name: 'Dev', stars: 4, when: 'May 2026', text: 'Good trip. Started two hours late on day one and nobody explained why, but the rest was smooth.' },
  { id: 'r3', operatorId: 'himalayan-nomads', name: 'Nikita', stars: 5, when: 'Apr 2026', text: 'First time travelling alone. Never once felt like the odd one out — they seat solo travellers together on purpose.' },
  { id: 'r4', operatorId: 'himalayan-nomads', name: 'Arjun', stars: 3, when: 'Mar 2026', text: 'Food was repetitive and the permit cost was a surprise at the checkpoint. Driving and stays were fine.' },
];

// Itinerary lines per trip. Spiti is verbatim; others are concise route sketches
// (enrich from the prototype's ITIN when doing a fidelity pass).
export const ITINERARIES: Record<string, string[]> = {
  spiti: ['Manali → Kaza via Kunzum La', 'Key Monastery, Kibber, Chicham', 'Pin Valley & Dhankar hike', 'Langza, Komic, Hikkim', 'Chandratal Lake camp', 'Return to Manali'],
  kheer: ['Kasol → Barshaini trailhead', 'Trek to Kheerganga, hot springs', 'Descend to Kasol, café evening'],
  hampta: ['Manali → Jobra → Chika', 'Chika → Balu ka Ghera', 'Hampta Pass → Shea Goru', 'Chatru → Chandratal', 'Return to Manali'],
  ladakh: ['Arrive Leh, acclimatise', 'Leh local, Shanti Stupa', 'Khardung La → Nubra', 'Diskit, Hunder dunes', 'Nubra → Pangong', 'Pangong sunrise → Leh', 'Leh markets', 'Depart'],
  meghalaya: ['Guwahati → Shillong', 'Shillong → Cherrapunji', 'Double-decker root bridge trek', 'Nongriat, natural pools', 'Mawlynnong, Dawki', 'Return to Guwahati'],
  gokarna: ['Arrive Gokarna, Om Beach', 'Beach trek: Kudle → Half Moon → Paradise', 'Yana caves day trip', 'Temple town, depart'],
  jaisalmer: ['Jaisalmer fort & havelis', 'Sam dunes, camel safari, desert camp', 'Kuldhara, depart'],
  valley: ['Rishikesh → Govindghat', 'Trek to Ghangaria', 'Valley of Flowers day hike', 'Hemkund Sahib', 'Ghangaria → Govindghat', 'Return to Rishikesh'],
};

// Explore regions — himachar/Kaza seeded with representative content; others carry
// base/sub/perDay + starter items so the screen renders. Enrich from prototype EXPLORE.
export const EXPLORE: ExploreRegion[] = [
  {
    key: 'himachal', base: 'Around Kaza', sub: '3,800 m · phone signal only on BSNL', perDay: 900,
    famous: [
      { name: 'Key Monastery', meta: '12 km', desc: "Spiti's largest gompa, stacked up a hill. Go for the 7am prayers, not the afternoon crowd." },
      { name: 'Hikkim', meta: '16 km', desc: 'The world’s highest post office. Post a card to yourself before the batteries die.' },
    ],
    food: [
      { name: 'Sol Café', meta: '0.4 km · ₹250', desc: 'Sea-buckthorn tea and thukpa. The one place open past 8.' },
      { name: 'Taste of Spiti', meta: '0.6 km · ₹300', desc: 'Momos and butter tea, run by a family off the main lane.' },
    ],
    gems: [
      { name: 'The bend below Komic', desc: 'No sign, no name. Pull over where the road bends and the whole valley opens up.', addedBy: 'Meera' },
    ],
    shops: [
      { name: 'Spiti Organics', meta: '0.3 km', desc: 'Seabuckthorn jam, dried apricots, wool socks.', status: 'Open now · till 8 pm' },
    ],
    know: ['Carry cash — no ATMs past Kaza.', 'Altitude is real; give day one to nothing.', 'BSNL only, and barely.'],
  },
  { key: 'ladakh', base: 'Around Leh', sub: '3,500 m · acclimatise before you climb', perDay: 1200, famous: [{ name: 'Shanti Stupa', meta: '3 km', desc: 'Best at sunset, worst by taxi. Walk the steps.' }], food: [{ name: 'Tibetan Kitchen', meta: '1 km · ₹350', desc: 'Gyathuk and momos, always full.' }], gems: [], shops: [{ name: 'Ladakh Art Palace', meta: '0.5 km', desc: 'Pashmina and apricot oil.', status: 'Open now' }], know: ['Inner Line Permits for Nubra/Pangong.', 'Rest day one — AMS is common.'] },
  { key: 'northeast', base: 'Around Cherrapunji', sub: 'Wettest place on earth — carry a poncho', perDay: 800, famous: [{ name: 'Nohkalikai Falls', meta: '5 km', desc: 'Tallest plunge waterfall in India.' }], food: [{ name: 'Orange Roots', meta: '1 km · ₹200', desc: 'Khasi thali, seasonal greens.' }], gems: [], shops: [], know: ['Bridges need a guide from Nongriat.', 'Leeches after rain — carry salt.'] },
  { key: 'karnataka', base: 'Around Gokarna', sub: 'Beach town, temple town', perDay: 700, famous: [{ name: 'Om Beach', meta: '2 km', desc: 'Two coves shaped like the symbol.' }], food: [{ name: 'Namaste Café', meta: '0.2 km · ₹300', desc: 'Sunset thalis on Om Beach.' }], gems: [], shops: [], know: ['Beach trek best at low tide.', 'Temple town is conservative — cover up.'] },
  { key: 'rajasthan', base: 'Around Jaisalmer', sub: 'Golden city, Thar edge', perDay: 900, famous: [{ name: 'Jaisalmer Fort', meta: '1 km', desc: 'A living fort — people still inside.' }], food: [{ name: 'Kaku Restaurant', meta: '0.4 km · ₹350', desc: 'Rooftop, fort-lit dinners.' }], gems: [], shops: [{ name: 'Desert Handicrafts', meta: '0.3 km', desc: 'Mirror-work and camel leather.', status: 'Shuts 7 pm' }], know: ['Dunes are 40 km out at Sam.', 'Nights get cold — carry a layer.'] },
  { key: 'uttarakhand', base: 'Around Ghangaria', sub: '3,000 m · base for the Valley', perDay: 600, famous: [{ name: 'Valley of Flowers', meta: '4 km', desc: 'Open Jun–Oct, peak bloom late July.' }], food: [{ name: 'Priya Restaurant', meta: '0.1 km · ₹200', desc: 'Rajma-chawal for tired legs.' }], gems: [], shops: [], know: ['No stay inside the valley — day hike only.', 'Hemkund is a steep 6 km more.'] },
  { key: 'kerala', base: 'Around Varkala', sub: 'Cliff and sea, slow days', perDay: 850, famous: [{ name: 'Varkala Cliff', meta: '0.5 km', desc: 'Cafés strung along the edge, sea below.' }], food: [{ name: 'Coffee Temple', meta: '0.2 km · ₹300', desc: 'Best breakfast on the cliff.' }], gems: [], shops: [], know: ['Monsoon shuts the cliff cafés.', 'Papanasam beach for the quiet end.'] },
];
