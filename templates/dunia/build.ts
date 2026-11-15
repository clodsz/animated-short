// Static scenery. Geometry helpers + the one world material: cached Lambert materials with the two-tone shading (shade.ts), flat
// quads / boxes with UVs in metres, and Batch (merges pieces into one static mesh per material).
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { twoTone } from "./shade";
import { NOINK } from "./ink";

export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const mats = new Map<string, THREE.Material>();
/** a cached world material: Lambert + two-tone shading, so every surface shares one lighting model */
export const lam = (key: string, make: () => THREE.MeshLambertMaterialParameters) => {
  let m = mats.get(key);
  if (!m) { m = twoTone(new THREE.MeshLambertMaterial(make())); mats.set(key, m); }
  return m;
};

/** quad a,b,c,d counter-clockwise seen from its front; uv (u0,v0) at a, (u1,v1) at c */
export const quad = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, u1 = 1, v1 = 1, u0 = 0, v0 = 0) => {
  const g = new THREE.BufferGeometry();
  const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a)).normalize();
  g.setAttribute("position", new THREE.Float32BufferAttribute([a, b, c, a, c, d].flatMap((v) => [v.x, v.y, v.z]), 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 2, 3, 4, 5].flatMap(() => [n.x, n.y, n.z]), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1], 2));
  return g;
};
/** axis box from min to max with an underside, texture tiled every `tile` metres (0 = one image per face) */
export const boxGeo = (min: THREE.Vector3, max: THREE.Vector3, tile = 1) => {
  const [x0, y0, z0] = [min.x, min.y, min.z], [x1, y1, z1] = [max.x, max.y, max.z];
  const t = (a: number) => (tile ? a / tile : 1), w = x1 - x0, h = y1 - y0, d = z1 - z0;
  return mergeGeometries([
    quad(V(x0, y0, z1), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z1), t(w), t(h)),
    quad(V(x1, y0, z0), V(x0, y0, z0), V(x0, y1, z0), V(x1, y1, z0), t(w), t(h)),
    quad(V(x0, y0, z0), V(x0, y0, z1), V(x0, y1, z1), V(x0, y1, z0), t(d), t(h)),
    quad(V(x1, y0, z1), V(x1, y0, z0), V(x1, y1, z0), V(x1, y1, z1), t(d), t(h)),
    quad(V(x0, y1, z1), V(x1, y1, z1), V(x1, y1, z0), V(x0, y1, z0), t(w), t(d)),
    quad(V(x0, y0, z0), V(x1, y0, z0), V(x1, y0, z1), V(x0, y0, z1), t(w), t(d)),
  ], false);
};

const f32 = (a: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => {
  const out = new Float32Array(a.count * a.itemSize);
  for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) out[i * a.itemSize + k] = a.getComponent(i, k);
  return new THREE.Float32BufferAttribute(out, a.itemSize);
};
/** collects pieces by material and merges them into one static mesh per material */
export class Batch {
  private g = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(geo: THREE.BufferGeometry, mat: THREE.Material, m?: THREE.Matrix4) {
    const src = geo.index ? geo.toNonIndexed() : geo, x = new THREE.BufferGeometry();
    x.setAttribute("position", f32(src.attributes.position));
    if (src.attributes.normal) x.setAttribute("normal", f32(src.attributes.normal)); else x.computeVertexNormals();
    x.setAttribute("uv", src.attributes.uv ? f32(src.attributes.uv) : new THREE.Float32BufferAttribute(new Float32Array(src.attributes.position.count * 2), 2));
    if (m) x.applyMatrix4(m);
    const l = this.g.get(mat); if (l) l.push(x); else this.g.set(mat, [x]);
  }
  build(parent: THREE.Object3D, cast = true) {
    for (const [mat, list] of this.g) {
      const mesh = new THREE.Mesh(mergeGeometries(list, false), mat);
      mesh.castShadow = cast; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false; parent.add(mesh);
    }
    this.g.clear();
  }
}

// ---------------- LOOK TEST SET ----------------
// Plain primitives in flat colours, ONLY to check the locked tone + effects at every time of day.
// It is NOT the world model style (that lives in references/reports/textures.md + STYLE_BIBLE.md as the formula; build your own sets
// with it). Lamp posts carry real PointLights so the night glow / light pools have visible sources.

const flat = (c: string) => lam("test:" + c, () => ({ color: c }));
const B = (b: Batch, m: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z1)), m);

export class TestSet {
  root = new THREE.Group();
  area = { cx: 0, cz: -15, w: 60, d: 60 };
  private flames: THREE.Mesh[] = [];
  constructor() {
    const b = new Batch(), R = this.root;
    b.add(quad(V(-200, 0, 200), V(200, 0, 200), V(200, 0, -200), V(-200, 0, -200), 400, 400), flat("#7cab55")); // lawn
    b.add(quad(V(-3, 0.01, 30), V(3, 0.01, 30), V(3, 0.01, -60), V(-3, 0.01, -60), 6, 90), flat("#c9a06a"));    // path
    // blocks either side of the path: warm muted albedos (cream, ochre, brick, terracotta) + a grey and a blue
    const cols = ["#ecdab2", "#d8a95f", "#c47a5c", "#efdcb8", "#cc9a6c", "#b7b4ad", "#5a8ad0"];
    for (let i = 0; i < 7; i++) for (const s of [-1, 1]) {
      const z = 8 - i * 9, h = 4 + ((i * 3 + (s > 0 ? 1 : 0)) % 4) * 1.4, c = cols[(i + (s > 0 ? 3 : 0)) % cols.length];
      B(b, flat(c), s * 5 - 3, 0, z - 3.5, s * 5 + 3, h, z + 3.5);
      b.add(new THREE.ConeGeometry(4.6, 2.6, 4).rotateY(Math.PI / 4).translate(s * 5, h + 1.3, z), flat("#c9775a"));
    }
    for (const [x, z, r] of [[-12, -4, 2.2], [12, -18, 2.6], [-11, -34, 2.0]] as const) { // round "trees"
      b.add(new THREE.CylinderGeometry(0.25, 0.35, 3, 10).translate(x, 1.5, z), flat("#8a5a3c"));
      b.add(new THREE.SphereGeometry(r, 20, 14).translate(x, 3 + r * 0.8, z), flat("#5e9a48"));
    }
    b.build(R);
    // lamp posts: pole + lamp head + an emissive flame + the PointLight that really lights the path
    for (const [x, z] of [[-2.6, 2], [2.6, -10], [-2.6, -22], [2.6, -34]]) {
      const pb = new Batch(); B(pb, flat("#3a3f48"), x - 0.06, 0, z - 0.06, x + 0.06, 2.6, z + 0.06); B(pb, flat("#3a3f48"), x - 0.18, 2.6, z - 0.18, x + 0.18, 2.66, z + 0.18); pb.build(R);
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 3.4, 1.4) }));
      f.position.set(x, 2.45, z); f.layers.set(NOINK); R.add(f); this.flames.push(f);
      const l = new THREE.PointLight("#ffb46a", 3, 9, 2); l.position.set(x, 2.4, z); R.add(l);
    }
  }
  /** lamps burn only when lights.ts says so (dusk / night) */
  update(lampsOn: boolean) {
    this.root.traverse((o) => { if ((o as THREE.PointLight).isPointLight) o.visible = lampsOn; });
    for (const f of this.flames) f.visible = lampsOn;
  }
}
