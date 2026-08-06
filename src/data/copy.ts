// Verbatim copy shared across screens. Reproduced exactly from the prototype —
// do not paraphrase. Screen-specific copy lives with its screen or in seed data.

export const brand = {
  name: 'kaafilla',
  wordmark: 'KAAFILLA',
  devanagari: 'काफ़िला',
  tagline: 'the caravan you travel with',
} as const;

// VerifyGate bottom sheet (Phase 5).
export const gate = {
  title: 'One check, then\nyou’re in.',
  sub: 'Joining a waitlist means travelling with these people. Kaafilla verifies you’re real — once, then never again.',
  steps: [
    'Aadhaar OTP — confirms your name, age and gender from the record',
    'A selfie, matched against your Aadhaar photo',
    'Waitlists, connects and the group chat all open up',
  ],
  consent:
    'I consent to Kaafilla verifying my name, age and gender via Aadhaar OTP and matching my selfie to the Aadhaar photo. Kaafilla stores the result only — never the number, the scan or the photo.',
  aadhaarLabel: 'Aadhaar number',
  cta: 'Send Aadhaar OTP',
  ghost: 'Not now — keep browsing',
} as const;

// Lock-gate full-screen variants shown to unverified users (Phase 4/7).
export const lockGate = {
  people: {
    title: 'Travellers',
    body: 'Nobody’s profile is visible until you’re verified — including yours. That’s the deal that makes this side of the app safe.',
    footnote: 'Trips and prices stay open to everyone — only people are behind this.',
    cta: 'Verify with Aadhaar',
  },
  chats: {
    title: 'Chats',
    body: 'Requests, chats and handles all live behind verification — yours and everyone else’s. Nobody can message you until you’re in.',
    cta: 'Verify with Aadhaar',
  },
  looking: {
    title: 'Looking for company',
    body: 'People post where they want to go and when. Only verified travellers can read the board or reply — the same rule that protects your post once you write one.',
    countSuffix: 'people are looking right now',
    cta: 'Verify with Aadhaar',
  },
} as const;

// Reused one-liners.
export const notes = {
  silentDecline: 'Declining is silent — they’re never told either way.',
  verifiedRecordFootnote:
    'Other travellers see a verified badge and your age. Never your name from the record or your gender as a label.',
} as const;
