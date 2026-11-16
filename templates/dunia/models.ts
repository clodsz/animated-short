// Real 3D models for complex, near-realistic objects (vehicles, rich furniture, props). Owner 2026-11-16: hand-built
// complex objects read wrong; simple world parts (walls, floors, roads, buildings, textures) stay in code.
// Find candidates with `python tools/find_asset.py "<object>"` (Poly Haven CC0 / Sketchfab CC0 + CC BY), keep the
// files in public/models/<group>/ with a CREDITS.md line for each CC BY model (credit goes in the video description).
// Load every model a short needs BEFORE the scene is built (await in the composition, see Dunia.tsx), so it is in the
// very first rendered frame.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";

const cache = new Map<string, Promise<THREE.Group>>();
/** load a glTF/GLB from public/ once (cached); use .clone(true) for every extra copy (not for rigged models) */
export const loadModel = (path: string) => {
  let p = cache.get(path);
  if (!p) { p = new GLTFLoader().loadAsync(staticFile(path)).then((g) => g.scene); cache.set(path, p); }
  return p;
};

/** split a pack laid out in one scene into separate objects: each body plus the parts (e.g. wheels) inside its box,
 *  turned so the line through those parts runs along z (packs often lay their items out in a circle) */
export const splitPack = (scene: THREE.Object3D, bodyRe: RegExp, partRe: RegExp) => {
  scene.updateMatrixWorld(true);
  const bodies: THREE.Object3D[] = [], parts: THREE.Object3D[] = [];
  scene.traverse((o) => { if (bodyRe.test(o.name)) bodies.push(o); else if (partRe.test(o.name)) parts.push(o); });
  return bodies.map((bd) => {
    const box = new THREE.Box3().setFromObject(bd), size = box.getSize(new THREE.Vector3()); box.expandByVector(size.clone().multiplyScalar(0.03)); // tight: wider takes the neighbour's parts
    const g = new THREE.Group(); g.attach(bd);
    const ps: THREE.Vector3[] = [];
    for (const w of parts) { const p = w.getWorldPosition(new THREE.Vector3()); if (box.containsPoint(p)) { g.attach(w); ps.push(p); } }
    if (ps.length >= 2) {
      const m = ps.reduce((a, p) => a.add(p), new THREE.Vector3()).divideScalar(ps.length);
      let xx = 0, zz = 0, xz = 0; for (const p of ps) { const dx = p.x - m.x, dz = p.z - m.z; xx += dx * dx; zz += dz * dz; xz += dx * dz; }
      g.rotation.y = 0.5 * Math.atan2(2 * xz, xx - zz) - Math.PI / 2;
    }
    const outer = new THREE.Group(); outer.add(g); return outer;
  });
};

/** stand a model on the ground, length along z, scaled to `len` metres, centred */
export const fit = (o: THREE.Object3D, len: number) => {
  const outer = new THREE.Group(), inner = new THREE.Group(); inner.add(o); outer.add(inner);
  inner.updateMatrixWorld(true); let box = new THREE.Box3().setFromObject(inner, true), s = box.getSize(new THREE.Vector3());
  if (s.x > s.z) { inner.rotation.y = Math.PI / 2; inner.updateMatrixWorld(true); box = new THREE.Box3().setFromObject(inner, true); s = box.getSize(new THREE.Vector3()); }
  const k = len / s.z; inner.scale.setScalar(k); inner.updateMatrixWorld(true); box = new THREE.Box3().setFromObject(inner, true); const c = box.getCenter(new THREE.Vector3());
  // stand on the tyres: the lowest point of the wheel meshes, not of the whole box (rigged models carry extra bits)
  const wb = new THREE.Box3(); inner.traverse((m) => { const mm = m as THREE.Mesh; if (mm.isMesh && /wheel/i.test(mm.name + (mm.parent?.name ?? "")) && !/brake/i.test(mm.name + (mm.parent?.name ?? ""))) wb.expandByObject(mm, true); });
  inner.position.set(-c.x, -(wb.isEmpty() ? box.min.y : wb.min.y), -c.z);
  outer.traverse((m) => { const mm = m as THREE.Mesh; if (mm.isMesh) { mm.castShadow = true; mm.receiveShadow = true; } });
  return outer;
};
