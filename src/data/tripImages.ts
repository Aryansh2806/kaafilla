// Placeholder hero photos so feed/detail look real until operators supply their
// own. Verified Unsplash URLs. `heroImages` returns a small gallery (for the
// swipeable detail carousel); `heroImage` returns the first (for feed cards).
// Falls back per-region for user-created plans, then to [] (card shows gradient).
const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&q=70&auto=format&fit=crop`;

const GAL: Record<string, string[]> = {
  // operator trips
  spiti: ['1506905925346-21bda4d32df4', '1483347756197-71ef80e95f73', '1519681393784-d120267933ba', '1454496522488-7a8e488e8606'].map(U),
  kheer: ['1464822759023-fed622ff2c3b', '1486911278844-a81c5267e227', '1518495973542-4542c06a5843', '1464278533981-50106e6176b1'].map(U),
  hampta: ['1519681393784-d120267933ba', '1517299321609-52687d1bc55a', '1551632811-561732d1e306', '1454496522488-7a8e488e8606'].map(U),
  ladakh: ['1626621341517-bbf3d9990a23', '1571863533956-01c88e79957e', '1483347756197-71ef80e95f73', '1470770841072-f978cf4d019e'].map(U),
  meghalaya: ['1441974231531-c6227db76b6e', '1518495973542-4542c06a5843', '1440342359743-84fcb8c21f21', '1464278533981-50106e6176b1'].map(U),
  gokarna: ['1507525428034-b723cf961d3e', '1519046904884-53103b34b206', '1502680390469-be75c86b636f', '1544551763-46a013bb70d5'].map(U),
  jaisalmer: ['1509316785289-025f5b846b35', '1516035069371-29a1b244cc32', '1473580044384-7ba9967e16a0'].map(U),
  valley: ['1454496522488-7a8e488e8606', '1483347756197-71ef80e95f73', '1440342359743-84fcb8c21f21', '1517299321609-52687d1bc55a'].map(U),
  // traveller plans (seed)
  tirthan: ['1464822759023-fed622ff2c3b', '1518495973542-4542c06a5843', '1486911278844-a81c5267e227'].map(U),
  zanskar: ['1470770841072-f978cf4d019e', '1626621341517-bbf3d9990a23', '1571863533956-01c88e79957e'].map(U),
  varkala: ['1602216056096-3b40cc0c9944', '1593693411515-c20261bcad6e', '1502680390469-be75c86b636f'].map(U),
};

const REGION_GAL: Record<string, string[]> = {
  himachal: ['1506905925346-21bda4d32df4', '1464822759023-fed622ff2c3b', '1519681393784-d120267933ba'].map(U),
  ladakh: ['1626621341517-bbf3d9990a23', '1571863533956-01c88e79957e', '1470770841072-f978cf4d019e'].map(U),
  uttarakhand: ['1454496522488-7a8e488e8606', '1483347756197-71ef80e95f73', '1517299321609-52687d1bc55a'].map(U),
  northeast: ['1441974231531-c6227db76b6e', '1518495973542-4542c06a5843', '1440342359743-84fcb8c21f21'].map(U),
  karnataka: ['1507525428034-b723cf961d3e', '1519046904884-53103b34b206', '1502680390469-be75c86b636f'].map(U),
  rajasthan: ['1509316785289-025f5b846b35', '1516035069371-29a1b244cc32', '1473580044384-7ba9967e16a0'].map(U),
  kerala: ['1602216056096-3b40cc0c9944', '1593693411515-c20261bcad6e', '1502680390469-be75c86b636f'].map(U),
};

export function heroImages(id: string, region?: string): string[] {
  return GAL[id] ?? (region ? REGION_GAL[region] ?? [] : []);
}

export function heroImage(id: string, region?: string): string | undefined {
  return heroImages(id, region)[0];
}
