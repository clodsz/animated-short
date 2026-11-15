// Shot plan of the look test: the same set at the four times of day, each with a creeping camera move.
// For a real short: one entry per shot (frames, set, time), camera keys per shot, lens blur per shot.
import type { Time } from "./lights";

export const FPS = 30;
export type V3 = [number, number, number];
export type Shot = { id: number; a: number; b: number; time: Time };
export const SHOTS: Shot[] = [
  { id: 1, a: 0, b: 90, time: "morning" },
  { id: 2, a: 90, b: 180, time: "noon" },
  { id: 3, a: 180, b: 270, time: "dusk" },
  { id: 4, a: 270, b: 360, time: "night" },
  { id: 5, a: 360, b: 450, time: "dusk" },    // into the low sun (sunburst)
];
export const TOTAL = SHOTS[SHOTS.length - 1].b;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];

export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Key = { f: number; pos: V3; look: V3; fov?: number; roll?: number };
const STREET: [Key, Key] = [{ f: 0, pos: [1.2, 1.7, 22], look: [0, 2.4, -20], fov: 46 }, { f: 90, pos: [0.9, 1.7, 19], look: [0, 2.4, -20], fov: 46 }];
const shift = (ks: Key[], df: number): Key[] => ks.map((k) => ({ ...k, f: k.f + df }));
const CAMS: Record<number, Key[]> = {
  1: shift(STREET, 0), 2: shift(STREET, 90), 3: shift(STREET, 180), 4: shift(STREET, 270),
  5: [{ f: 360, pos: [0, 1.8, 27], look: [42, 12, 17], fov: 50 }, { f: 450, pos: [0.5, 1.9, 26], look: [42, 12, 17], fov: 48 }],
};
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
/** keys eased between; every hold also creeps in towards the look point (~0.2 %/frame), so no frame is static */
export const camAt = (id: number, f: number): Cam => {
  const ks = CAMS[id];
  let i = 0; while (i + 1 < ks.length && f >= ks[i + 1].f) i++;
  const a = ks[i], b = ks[Math.min(i + 1, ks.length - 1)], k = b === a ? 0 : ease((f - a.f) / (b.f - a.f));
  const P = lerp3(a.pos, b.pos, k), L = lerp3(a.look, b.look, k), kp = Math.exp(-0.002 * Math.max(0, f - ks[0].f));
  return { pos: [L[0] + (P[0] - L[0]) * kp, L[1] + (P[1] - L[1]) * kp, L[2] + (P[2] - L[2]) * kp], look: L, fov: (a.fov ?? 40) + ((b.fov ?? 40) - (a.fov ?? 40)) * k, roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * k };
};
/** lens blur per shot: cInf px at 1080 (0 = sharp); lights.ts switches it off at noon. focus = world point */
export const DOF: Record<number, { cInf: number; focus?: V3 }> = { 1: { cInf: 6, focus: [0, 1.5, 4] }, 3: { cInf: 6, focus: [0, 1.5, 4] }, 4: { cInf: 6, focus: [0, 1.5, 4] } };
/** shift lens per shot: camera kept level so verticals stay parallel, the frame slides instead (NDC units) */
export const SHIFT: Record<number, number> = {};
