// EFFECTS layer of a set (kept apart from tone, see look.ts). Per time of day:
//   glow  - every practical (window, lantern, moon) carries a wide soft halo, much larger than the source
//   pool  - a warm pool of light on the ground / floor under each practical
//   mist  - a thin low ground mist (golden morning, a trace at dusk; night and noon stay clear)
//   dust  - small glowing motes (fireflies outside) drifting near the lights
//   rays  - soft slanted shafts of light in the air along the sun / moon direction (forest + sunset shots), real
//           geometry so roofs and trees in front still hide them
// Glows and pools are built from the set's real PointLights, so they only ever sit on a visible source.
// Every effect has an inputProps switch (look.ts FX: glow, pool, mist, dust, rays).
import * as THREE from "three";
import { ctex, rng } from "./paint";
import { NOINK } from "./ink";
import { EFFECT_OF, FX, Time } from "./look";

const radial = (key: string, stops: [number, string][]) => ctex(key, 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
});
const haloTex = () => radial("fxHalo", [[0, "rgba(255,255,255,0.55)"], [0.18, "rgba(255,255,255,0.28)"], [0.5, "rgba(255,255,255,0.08)"], [1, "rgba(255,255,255,0)"]]);
const poolTex = () => radial("fxPool", [[0, "rgba(255,255,255,0.75)"], [0.35, "rgba(255,255,255,0.35)"], [1, "rgba(255,255,255,0)"]]);
const mistTex = () => ctex("fxMist", 512, 128, (g, r) => {
  g.clearRect(0, 0, 512, 128);
  for (let i = 0; i < 14; i++) {
    const x = 60 + r() * 392, y = 64 + (r() - 0.5) * 30, rx = 90 + r() * 120, gr = g.createRadialGradient(x, y, 0, x, y, rx);
    gr.addColorStop(0, "rgba(255,255,255,0.22)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.save(); g.translate(x, y); g.scale(1, 0.32); g.translate(-x, -y); g.fillStyle = gr; g.fillRect(x - rx, y - rx, rx * 2, rx * 2); g.restore();
  }
});

const shaftTex = () => ctex("fxShaft", 128, 512, (g) => {
  const across = g.createLinearGradient(0, 0, 128, 0);
  across.addColorStop(0, "rgba(255,255,255,0)"); across.addColorStop(0.5, "rgba(255,255,255,1)"); across.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = across; g.fillRect(0, 0, 128, 512);
  g.globalCompositeOperation = "destination-in"; // fade along the length: strongest high up (towards the light), gone at the ground
  const along = g.createLinearGradient(0, 0, 0, 512);
  along.addColorStop(0, "rgba(0,0,0,0)"); along.addColorStop(0.2, "rgba(0,0,0,0.9)"); along.addColorStop(0.65, "rgba(0,0,0,0.45)"); along.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = along; g.fillRect(0, 0, 128, 512);
});
type Src = { light: THREE.PointLight; halo: THREE.Sprite; pool: THREE.Mesh };
export class Atmos {
  root = new THREE.Group();
  private srcs: Src[] = [];
  private mist: { m: THREE.Mesh; k: number }[] = [];
  private shafts: { foot: THREE.Vector3; len: number; w: number; k: number }[] = [];
  private shaftMesh: THREE.Mesh; private shaftMat: THREE.MeshBasicMaterial;
  private dust: THREE.Points; private dustBase: Float32Array; private dustMat: THREE.PointsMaterial;

  /** lightsOf: the set whose PointLights are its visible practicals; area: the set's footprint (world x/z centre, size) */
  constructor(lightsOf: THREE.Object3D, area = { cx: 0, cz: 0, w: 140, d: 120 }) {
    lightsOf.updateMatrixWorld(true);
    const p = new THREE.Vector3(), hT = haloTex(), pT = poolTex();
    lightsOf.traverse((o) => {
      const l = o as THREE.PointLight; if (!l.isPointLight) return;
      l.getWorldPosition(p);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: hT, color: new THREE.Color(0.95, 0.68, 0.12), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); // yellow, no blue: orange added over the blue night reads magenta
      halo.position.copy(p); halo.scale.setScalar(Math.min(4.5, 0.45 * (l.distance || 8))); halo.layers.set(NOINK); halo.renderOrder = 6;
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: pT, color: "#e8a050", transparent: true, opacity: 0.45, depthWrite: false, fog: false })); // over the ground, not added to it
      pool.rotation.x = -Math.PI / 2; pool.position.set(p.x, 0.06, p.z); pool.scale.setScalar(Math.min(3.5, 0.35 * (l.distance || 8)));
      if (p.y > 2.5) pool.userData.high = true; // a lamp high on a wall throws no pool on the ground
      pool.layers.set(NOINK); pool.renderOrder = 2;
      this.root.add(halo, pool); this.srcs.push({ light: l, halo, pool });
    });
    // low mist: long soft strips floating just above the ground over the village area, facing the camera on y only
    const r = rng(9011), mT = mistTex();
    for (let i = 0; i < 70; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: mT, color: new THREE.Color(0.55, 0.62, 0.95), transparent: true, opacity: 0.5, depthWrite: false, fog: false }));
      m.position.set(area.cx + (r() - 0.5) * area.w, 0.35 + r() * 0.9, area.cz + (r() - 0.5) * area.d); m.scale.set(14 + r() * 18, 2.2 + r() * 1.6, 1);
      m.layers.set(NOINK); m.renderOrder = 3; this.root.add(m); this.mist.push({ m, k: r() * 10 });
    }
    // light shafts: feet scattered over the village, each a long soft strip turned round its own axis to face the camera
    const NS = 90;
    for (let i = 0; i < NS; i++) this.shafts.push({ foot: new THREE.Vector3(area.cx + (r() - 0.5) * area.w, -1, area.cz + (r() - 0.5) * area.d), len: 18 + r() * 22, w: 0.8 + r() * 2.6, k: r() * 6.28 });
    const sg = new THREE.BufferGeometry(), idx: number[] = [], uv: number[] = [];
    for (let i = 0; i < NS; i++) { idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3); uv.push(0, 1, 1, 1, 1, 0, 0, 0); }
    sg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NS * 12), 3)); sg.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); sg.setIndex(idx);
    this.shaftMat = new THREE.MeshBasicMaterial({ map: shaftTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide });
    this.shaftMesh = new THREE.Mesh(sg, this.shaftMat); this.shaftMesh.frustumCulled = false; this.shaftMesh.layers.set(NOINK); this.shaftMesh.renderOrder = 7; this.root.add(this.shaftMesh);
    // fireflies / motes: a box of points that follows the camera (like the rain), each one drifting on its own
    const n = 260; this.dustBase = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { this.dustBase[i * 4] = (r() - 0.5) * 30; this.dustBase[i * 4 + 1] = 0.3 + r() * 3.5; this.dustBase[i * 4 + 2] = (r() - 0.5) * 30; this.dustBase[i * 4 + 3] = r() * 6.28; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    this.dustMat = new THREE.PointsMaterial({ map: hT, color: new THREE.Color(2.2, 2.0, 0.9), size: 0.12, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    this.dust = new THREE.Points(g, this.dustMat); this.dust.frustumCulled = false; this.dust.layers.set(NOINK); this.root.add(this.dust);
  }

  /** strengths per time of day come from look.ts EFFECT_OF: morning = gold mist + shafts + motes; noon = faint motes
   *  only; dusk = lamps glow, warm shafts, a trace of mist; night = lamp glow + pools, faint moon beams, fireflies */
  update(t: number, cam: THREE.PerspectiveCamera, mode: Time, toLight: THREE.Vector3) {
    const E = EFFECT_OF[mode], lampsOn = E.lampsOn, MIST = E.mist, DUST = E.motes;
    for (const s of this.srcs) {
      let on = lampsOn; for (let o: THREE.Object3D | null = s.light; o && on; o = o.parent) on = o.visible; // the light's own night switch
      s.halo.visible = on && FX.glow; s.pool.visible = on && FX.pool && !s.pool.userData.high;
      if (s.halo.visible) (s.halo.material as THREE.SpriteMaterial).opacity = 0.9 + 0.1 * Math.sin(t * 7 + s.halo.position.x); // flame flicker
    }
    for (const { m, k } of this.mist) {
      m.visible = MIST[3] > 0 && FX.mist; if (!m.visible) continue;
      m.rotation.y = Math.atan2(cam.position.x - m.position.x, cam.position.z - m.position.z);
      const mm = m.material as THREE.MeshBasicMaterial; mm.color.setRGB(MIST[0], MIST[1], MIST[2]);
      const d = m.position.distanceTo(cam.position), near = THREE.MathUtils.smoothstep(d, 18, 40); // fades in from 18 m: no bars at the lens
      mm.opacity = 0.6 * MIST[3] * near * (0.9 + 0.2 * Math.sin(t * 0.4 + k));
      m.position.x += Math.sin(t * 0.15 + k) * 0.004; // slow drift
    }
    // shafts: strong morning + sunset shafts, none at noon (crisp), faint cold moon beams
    const SH = E.shafts;
    this.shaftMesh.visible = FX.rays && SH[3] > 0;
    if (this.shaftMesh.visible) {
      this.shaftMat.color.setRGB(SH[0] * SH[3], SH[1] * SH[3], SH[2] * SH[3]);
      const ax = toLight.clone().normalize(), P = this.shaftMesh.geometry.getAttribute("position") as THREE.BufferAttribute, arr = P.array as Float32Array;
      const top = new THREE.Vector3(), mid = new THREE.Vector3(), side = new THREE.Vector3(), tmp = new THREE.Vector3();
      this.shafts.forEach((s, i) => {
        top.copy(s.foot).addScaledVector(ax, s.len); mid.copy(s.foot).add(top).multiplyScalar(0.5);
        const near = THREE.MathUtils.smoothstep(mid.distanceTo(cam.position), 6, 14); // no shaft right on the lens
        side.crossVectors(ax, tmp.copy(cam.position).sub(mid)).normalize().multiplyScalar(near * s.w * (0.85 + 0.15 * Math.sin(t * 0.5 + s.k)) / 2);
        const q = [top.clone().sub(side), top.clone().add(side), s.foot.clone().add(side), s.foot.clone().sub(side)];
        q.forEach((v, j) => { arr[i * 12 + j * 3] = v.x; arr[i * 12 + j * 3 + 1] = v.y; arr[i * 12 + j * 3 + 2] = v.z; });
      });
      P.needsUpdate = true;
    }
    this.dust.visible = FX.dust; this.dustMat.color.setRGB(DUST[0], DUST[1], DUST[2]); this.dustMat.size = DUST[3];
    if (this.dust.visible) {
      const a = (this.dust.geometry.getAttribute("position") as THREE.BufferAttribute).array as Float32Array, B = this.dustBase, n = B.length / 4;
      for (let i = 0; i < n; i++) {
        const ph = B[i * 4 + 3];
        a[i * 3] = cam.position.x + B[i * 4] + 0.6 * Math.sin(t * 0.5 + ph);
        a[i * 3 + 1] = B[i * 4 + 1] + 0.3 * Math.sin(t * 0.8 + ph * 2);
        a[i * 3 + 2] = cam.position.z + B[i * 4 + 2] + 0.6 * Math.cos(t * 0.4 + ph);
      }
      this.dust.geometry.getAttribute("position").needsUpdate = true;
      this.dustMat.opacity = DUST[4];
    }
  }
}
