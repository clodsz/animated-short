// Painted textures on canvases (cached): seeded RNG, three-tone clouds, sun / moon / sunburst sprites and the
// effect sprites (glow halo, light pool, ground mist, light shaft).
import * as THREE from "three";

const TAU = Math.PI * 2;
const U = (r: () => number, a: number, b: number) => a + (b - a) * r();
export const rng = (seed: number) => {
  let s = (seed * 9301 + 49297) % 233280 || 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
};
const cache = new Map<string, THREE.CanvasTexture>();
export const ctex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void) => {
  let t = cache.get(key);
  if (!t) {
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    draw(cv.getContext("2d")!, rng(key.length * 131 + key.charCodeAt(0)));
    t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    cache.set(key, t);
  }
  return t;
};

/** Cloud sprite, 1024 x 512, three painted tones and a flat soft bottom, no outline.
 *  Ref cumulus: lit crown #f1f6fc-#fbfafd (L* 96-98, warm in haze #faedd7), mid #dadae9-#e5edf9, lavender-blue
 *  underside #b6c1f2 / #c7cedf / #d1d4e1 (L* 79-86) mostly in the bottom third, edge ramp 8-20 px at 1080p
 *  (median ~10), no dark rim in 9 of 11 clouds. Ours: one flat tone (#f0f0f0 = 83 % of the cloud), 4-5 px edge.
 *  Golden: use CLOUD_GOLD instead of multiplying the white sprite by #ffd6b8 (a tint cannot make the cool belly). */
export const CLOUD_DAY = { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c3cbe9" };
export const CLOUD_GOLD = { lit: "#ffd2a8", mid: "#f2a08f", shade: "#a98fc4" };
export const cloudHD = (seed: number, pal = CLOUD_DAY) => ctex(`cloudHD_${pal.lit}_${seed}`, 1024, 512, (g) => {
  const r = rng(seed * 7919 + 17); // own seed: ctex keys of equal length would otherwise share shapes
  const W = 1024, H = 512, base = 400;
  const n = 6 + Math.floor(r() * 4), lobes: { x: number; y: number; r: number }[] = [];
  for (let i = 0; i < n; i++) { // main row, biggest in the middle
    const t = (i + 0.5) / n, rad = (60 + 110 * Math.sin(Math.PI * t) ** 0.8) * U(r, 0.75, 1.15);
    lobes.push({ x: 150 + t * 724 + U(r, -30, 30), y: base - rad * U(r, 0.35, 0.65), r: rad });
  }
  for (let i = 0; i < Math.floor(n / 2); i++) { // crown
    const t = U(r, 0.25, 0.75), rad = U(r, 60, 110);
    lobes.push({ x: 150 + t * 724, y: base - 150 - rad * U(r, 0.3, 0.7), r: rad });
  }
  const layer = (dx: number, dy: number, k: number, col: string, blur: number) => {
    g.save(); g.filter = `blur(${blur}px)`; g.fillStyle = col; g.beginPath();
    for (const l of lobes) { const x = l.x + dx * l.r, y = l.y + dy * l.r; g.moveTo(x + l.r * k, y); g.arc(x, y, l.r * k, 0, TAU); }
    g.fill(); g.restore();
  };
  layer(0, 0, 1.0, pal.shade, 6);         // silhouette in the underside tone
  layer(-0.04, -0.12, 0.9, pal.mid, 8);   // mid band
  layer(-0.1, -0.26, 0.72, pal.lit, 10);  // sunlit crown, offset up-left
  g.globalCompositeOperation = "destination-in"; // flat, soft bottom
  const m = g.createLinearGradient(0, base - 18, 0, base + 6);
  m.addColorStop(0, "rgba(0,0,0,1)"); m.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = m; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "source-over";
});


// ---------------- sky sprites ----------------
export const disc = () => ctex("skyDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.8, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
export const halo = () => ctex("skyHalo", 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, "rgba(255,255,255,0.55)"); gr.addColorStop(0.25, "rgba(255,255,255,0.18)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
});
/** painted sunburst: soft radiating rays round a low sun */
export const burst = () => ctex("skyBurst", 512, 512, (g, r) => {
  g.translate(256, 256);
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2 + r() * 0.08, w = 0.02 + r() * 0.05, L = 150 + r() * 106, gr = g.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L);
    gr.addColorStop(0, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a - w) * L, Math.sin(a - w) * L); g.lineTo(Math.cos(a + w) * L, Math.sin(a + w) * L); g.closePath(); g.fill();
  }
});

// ---------------- effect sprites ----------------
const radial = (key: string, stops: [number, string][]) => ctex(key, 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
});
export const haloTex = () => radial("fxHalo", [[0, "rgba(255,255,255,0.55)"], [0.18, "rgba(255,255,255,0.28)"], [0.5, "rgba(255,255,255,0.08)"], [1, "rgba(255,255,255,0)"]]);
export const poolTex = () => radial("fxPool", [[0, "rgba(255,255,255,0.75)"], [0.35, "rgba(255,255,255,0.35)"], [1, "rgba(255,255,255,0)"]]);
export const mistTex = () => ctex("fxMist", 512, 128, (g, r) => {
  g.clearRect(0, 0, 512, 128);
  for (let i = 0; i < 14; i++) {
    const x = 60 + r() * 392, y = 64 + (r() - 0.5) * 30, rx = 90 + r() * 120, gr = g.createRadialGradient(x, y, 0, x, y, rx);
    gr.addColorStop(0, "rgba(255,255,255,0.22)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.save(); g.translate(x, y); g.scale(1, 0.32); g.translate(-x, -y); g.fillStyle = gr; g.fillRect(x - rx, y - rx, rx * 2, rx * 2); g.restore();
  }
});

export const shaftTex = () => ctex("fxShaft", 128, 512, (g) => {
  const across = g.createLinearGradient(0, 0, 128, 0);
  across.addColorStop(0, "rgba(255,255,255,0)"); across.addColorStop(0.5, "rgba(255,255,255,1)"); across.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = across; g.fillRect(0, 0, 128, 512);
  g.globalCompositeOperation = "destination-in"; // fade along the length: strongest high up (towards the light), gone at the ground
  const along = g.createLinearGradient(0, 0, 0, 512);
  along.addColorStop(0, "rgba(0,0,0,0)"); along.addColorStop(0.2, "rgba(0,0,0,0.9)"); along.addColorStop(0.65, "rgba(0,0,0,0.45)"); along.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = along; g.fillRect(0, 0, 128, 512);
});
