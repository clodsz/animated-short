// LOOK TEST SET: plain primitives in flat colours, ONLY to check the locked tone + effects at every time of day.
// It is NOT the world model style (that lives in references/STYLE_BIBLE.md as the formula; build your own sets
// with it). Lamp posts carry real PointLights so the night glow / light pools have visible sources.
import * as THREE from "three";
import { Batch, V, boxGeo, lam, quad } from "./build";
import { NOINK } from "./ink";

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
  /** lamps burn only when look.ts says so (dusk / night) */
  update(lampsOn: boolean) {
    this.root.traverse((o) => { if ((o as THREE.PointLight).isPointLight) o.visible = lampsOn; });
    for (const f of this.flames) f.visible = lampsOn;
  }
}
