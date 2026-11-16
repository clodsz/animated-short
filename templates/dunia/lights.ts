// LIGHTS / LOOK v1 (locked): TONE and EFFECTS per time of day, kept apart.
//   TONE   = surface colour + light: key direction/colour, lit / shade / lift multipliers, albedo saturation, the sky
//            gradient and the fog colour. The colour grade stays NEUTRAL (grade.ts): never tone through the grade.
//   EFFECT = atmosphere on top of the tone (world.ts Sky + Atmos, post): distance fog, 3D light shafts, lamp glow + light
//            pools, ground mist, motes / fireflies, sun halo + sunburst, moon halo, lens blur, bloom, vignette.
//            Every effect has an inputProps switch: { fx: { rays: false, ... } }.
// Change these values only on purpose: they are the channel's look.
import { getInputProps } from "remotion";

export type Time = "morning" | "noon" | "dusk" | "night";
/** grade family (grade.ts presets, all neutral) */
export type Light = "day" | "golden" | "night";
type C3 = [number, number, number];

export type Tone = {
  key: C3; keyCol: string;                  // world direction TOWARDS the sun / moon (fixed per location + time), colour
  lit: C3; shade: C3; lift: C3;             // two-tone multipliers (shade.ts)
  lambert: number; sideK: number; term: number; sat: number; pointK: number;
  sky: [string, string, string, string, string]; // horizon -> zenith, at 0 / 4 / 10 / 20 / 40 degrees elevation
  fog: string; fogNear: number; fogFar: number; // distance fog (an EFFECT, colour = horizon)
  grade: Light;
};

// VIVID (owner 2026-11-16, after a 3-way A/B): albedo sat 1.0 by day, .55 at night (was .70-.72 / .25), shade lift halved,
// so colours stay alive in shade like the reference. Values + history: shorts/_gaya/LOOK-DUNIA.md.
export const TONE_OF: Record<Time, Tone> = {
  // golden morning: low sun, warm gold, pastel
  morning: {
    key: [-0.8, 0.3, -0.5], keyCol: "#ffd28a",
    lit: [1.66, 1.28, 0.84], shade: [0.42, 0.38, 0.5], lift: [0.04, 0.04, 0.06], lambert: 0.35, sideK: 0.82, term: 0.08, sat: 1.0, pointK: 1,
    sky: ["#ffe2a8", "#ffd596", "#f6cf9e", "#b9c6dc", "#86a4d2"], fog: "#f6dcb4", fogNear: 60, fogFar: 520, grade: "golden",
  },
  // noon: bright, clean, crisp; pastel storybook (albedo saturation .7)
  noon: {
    key: [0.3, 0.9, 0.35], keyCol: "#fff3e0",
    lit: [1.76, 1.68, 1.5], shade: [0.42, 0.41, 0.5], lift: [0.035, 0.04, 0.065], lambert: 0.35, sideK: 0.84, term: 0.2, sat: 1.0, pointK: 1,
    sky: ["#b8d0ec", "#9cbfea", "#6a9fe0", "#4f8cdb", "#3373cc"], fog: "#c4d8ee", fogNear: 160, fogFar: 1000, grade: "day",
  },
  // dusk: low sun, orange-violet, the big sun is the subject
  dusk: {
    key: [0.85, 0.25, -0.18], keyCol: "#ffb36b",
    lit: [1.6, 1.08, 0.72], shade: [0.42, 0.36, 0.5], lift: [0.035, 0.035, 0.06], lambert: 0.35, sideK: 0.82, term: 0.08, sat: 1.0, pointK: 1,
    sky: ["#ffc47c", "#f7ae78", "#e8967c", "#c4848e", "#8a6f8a"], fog: "#efb894", fogNear: 90, fogFar: 650, grade: "golden",
  },
  // night: clear saturated blue; albedo nearly grey (sat .25) so the moon colours everything blue; warm only at lamps.
  // Measured target: blue covers >= 75 % of the frame, no green, median luma ~.26-.35
  night: {
    key: [-0.6, 0.75, 0.25], keyCol: "#bcd0ff",
    lit: [0.3, 0.55, 1.8], shade: [0.1, 0.17, 0.58], lift: [0.025, 0.04, 0.14], lambert: 0.35, sideK: 0.8, term: 0.15, sat: 0.55, pointK: 1,
    sky: ["#5068c8", "#3e56b8", "#2e44a2", "#22358c", "#172672"], fog: "#3a50b0", fogNear: 90, fogFar: 600, grade: "night",
  },
};

/** EFFECT strengths per time of day: [r, g, b, strength] (mist, shafts) and [r, g, b, size m, opacity] (motes) */
export const EFFECT_OF: Record<Time, { mist: number[]; shafts: number[]; motes: number[]; lampsOn: boolean; dof: boolean; vignette: number }> = {
  morning: { mist: [1.15, 1.05, 0.9, 0.5], shafts: [1.0, 0.85, 0.55, 0.32], motes: [1.6, 1.45, 1.1, 0.07, 0.5], lampsOn: false, dof: true, vignette: 0.18 },
  noon: { mist: [0, 0, 0, 0], shafts: [0, 0, 0, 0], motes: [1.5, 1.5, 1.4, 0.06, 0.35], lampsOn: false, dof: false, vignette: 0.18 },
  dusk: { mist: [1.1, 0.75, 0.6, 0.15], shafts: [1.0, 0.62, 0.35, 0.3], motes: [1.8, 1.3, 0.8, 0.07, 0.5], lampsOn: true, dof: true, vignette: 0.18 },
  night: { mist: [0, 0, 0, 0], shafts: [0.45, 0.55, 0.95, 0.05], motes: [2.2, 2.0, 0.9, 0.12, 0.75], lampsOn: true, dof: true, vignette: 0.32 },
};

/** effect switches (test stills: inputProps { fx: { fog: false, rays: false, ... } } shows the plain tone) */
export const FX = { fog: true, halo: true, glow: true, pool: true, mist: true, dust: true, vig: true, rays: true, ...((getInputProps() as { fx?: Partial<Record<string, boolean>> }).fx ?? {}) };
