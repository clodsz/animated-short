// One three.js scene posed per frame: the set, the sky, the key light (sun or moon, the only shadow caster) and the
// effects layer. Each frame applies the TONE of the shot's time of day (look.ts) to the shared shading uniforms.
import * as THREE from "three";
import { TONE, untone } from "./shade";
import { NOINK } from "./ink";
import { Sky } from "./sky";
import { Atmos } from "./atmos";
import { TestSet } from "./testset";
import { EFFECT_OF, FX, TONE_OF } from "./look";
import { FPS, SHIFT, camAt, shotAt } from "./story";

export class World {
  root = new THREE.Group();
  private key = new THREE.DirectionalLight("#ffffff", 1);
  private sky = new Sky();
  private set = new TestSet();
  private atmos: Atmos;
  constructor() {
    this.root.add(this.key, this.key.target, this.sky.root, this.set.root);
    this.key.castShadow = true; this.key.shadow.mapSize.set(4096, 4096);
    this.atmos = new Atmos(this.set.root, this.set.area); this.root.add(this.atmos.root);
  }
  /** pose everything for output frame f; returns the camera look point */
  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const shot = shotAt(f), t = f / FPS, tone = TONE_OF[shot.time], eff = EFFECT_OF[shot.time];
    const c = camAt(shot.id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix();
    if (SHIFT[shot.id]) { cam.projectionMatrix.elements[9] = SHIFT[shot.id]; cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert(); }
    cam.updateMatrixWorld(); cam.layers.enable(NOINK);
    const look = new THREE.Vector3(...c.look);
    // ---- TONE: key light (fixed world direction per time), two-tone colours ----
    const kd = new THREE.Vector3(...tone.key).normalize();
    this.key.color.set(tone.keyCol); this.key.intensity = 1;
    this.key.position.copy(look).addScaledVector(kd, 80); this.key.target.position.copy(look);
    const sc = this.key.shadow.camera; sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 5; sc.far = 160; sc.updateProjectionMatrix();
    this.key.shadow.bias = -0.0004; this.key.shadow.normalBias = 0.05;
    TONE.uLitCol.value.set(...tone.lit); TONE.uShadeCol.value.set(...tone.shade); TONE.uShadeLift.value.set(...tone.lift);
    TONE.uLambert.value = tone.lambert; TONE.uSideK.value = tone.sideK; TONE.uTerm.value = tone.term; TONE.uBounce.value.set(0, 0, 0);
    TONE.uSat.value = tone.sat; TONE.uPointK.value = tone.pointK;
    // ---- EFFECTS: fog, sky extras, lamps, mist / shafts / motes ----
    scene.background = null;
    scene.fog = FX.fog ? new THREE.Fog(untone(tone.fog), tone.fogNear, tone.fogFar) : null;
    this.sky.update(t, cam, kd, shot.time);
    this.set.update(eff.lampsOn);
    this.atmos.update(t, cam, shot.time, kd);
    return look;
  }
}
