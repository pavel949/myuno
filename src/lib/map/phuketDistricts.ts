/**
 * Approximate centroids for Phuket districts/beaches. Used ONLY as a fallback
 * pin for listings that have a district but no exact coordinates; such pins
 * are flagged `approximate` in the UI. TODO(data): geocode listings so this
 * fallback can be retired.
 */
const CENTROIDS: Record<string, [number, number]> = {
  'bang tao': [7.9955, 98.2955], bangtao: [7.9955, 98.2955], laguna: [7.9905, 98.3005],
  cherngtalay: [7.998, 98.305], 'choeng thale': [7.998, 98.305], surin: [7.9755, 98.279],
  'nai yang': [8.09, 98.3], 'mai khao': [8.17, 98.3], 'nai thon': [8.05, 98.278], layan: [8.03, 98.29],
  thalang: [8.03, 98.34], kamala: [7.95, 98.283], patong: [7.896, 98.297], kathu: [7.911, 98.334],
  karon: [7.846, 98.294], kata: [7.82, 98.3], 'nai harn': [7.777, 98.305], rawai: [7.779, 98.325],
  chalong: [7.846, 98.338], 'phuket town': [7.884, 98.391], 'mueang phuket': [7.884, 98.391],
  'koh kaew': [7.94, 98.39], 'cape yamu': [8.0, 98.41], 'pa khlok': [8.02, 98.41],
};

/** Deterministic small offset (~±250 m) so pins in the same district don't stack. */
function jitter(id: string): [number, number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return [((h & 0xff) / 255 - 0.5) * 0.005, (((h >> 8) & 0xff) / 255 - 0.5) * 0.005];
}

export function districtCentroid(district: string | null | undefined, id: string): [number, number] | null {
  if (!district) return null;
  const key = district.toLowerCase().replace(/beach/g, '').trim();
  const hit = CENTROIDS[key] ?? Object.entries(CENTROIDS).find(([k]) => key.includes(k))?.[1];
  if (!hit) return null;
  const [dl, dg] = jitter(id);
  return [hit[0] + dl, hit[1] + dg];
}
