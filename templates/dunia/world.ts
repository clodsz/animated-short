// One three.js scene posed per frame: the set, the sky, the key light (sun or moon, the only shadow caster) and the
// effects layer. Each frame applies the TONE of the shot's time of day (lights.ts) to the shared shading uniforms.
import * as THREE from "three";
import { TONE, untone } from "./shade";
import { NOINK } from "./ink";
import { rng, cloudHD, CLOUD_GOLD, disc, halo, burst, haloTex, poolTex, mistTex, shaftTex } from "./paint";
import { TestSet } from "./build";
import { EFFECT_OF, FX, TONE_OF, Time } from "./lights";
import { FPS, SHIFT, camAt, shotAt } from "./story";

// ---------------- sky ----------------
// Sky (TONE: the gradient per time of day, lights.ts) + its EFFECTS: sun disc + halo, sunburst on a low sun (morning /
// dusk), big moon + halo and stars at night, painted three-tone clouds by day. Everything follows the camera.
const deg = THREE.MathUtils.degToRad;
const sprite = (map: THREE.Texture, col: THREE.Color, add: boolean) => new THREE.Sprite(new THREE.SpriteMaterial({ map, color: col, fog: false, depthWrite: false, transparent: true, ...(add ? { blending: THREE.AdditiveBlending } : {}) }));

export class Sky {
  root = new THREE.Group();
  private mat: THREE.ShaderMaterial; private dome: THREE.Mesh;
  private sun = sprite(disc(), new THREE.Color(6.0, 3.6, 1.6), false); private sunHalo = sprite(halo(), new THREE.Color(1.6, 0.9, 0.45), true);
  private burst = sprite(burst(), new THREE.Color(0.55, 0.38, 0.24), true);
  private moon = sprite(disc(), new THREE.Color(2.4, 2.6, 3.0), false); private moonHalo = sprite(halo(), new THREE.Color(0.55, 0.65, 1.0), true);
  private stars: THREE.Points; private clouds: THREE.Mesh[] = [];
  constructor() {
    this.mat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4(deg(4), deg(10), deg(20), deg(40)) } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), this.mat); this.dome.renderOrder = -1;
    const sp: number[] = [], r = rng(77);
    for (let i = 0; i < 700; i++) { const a = r() * 6.283, el = Math.asin(0.08 + 0.92 * r()); sp.push(Math.cos(a) * Math.cos(el) * 800, Math.sin(el) * 800, Math.sin(a) * Math.cos(el) * 800); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: new THREE.Color(2, 2, 2.2), size: 2.2, sizeAttenuation: false, fog: false, depthWrite: false }));
    this.sun.renderOrder = -0.5; this.sunHalo.renderOrder = 5; this.burst.renderOrder = 5; this.moonHalo.renderOrder = 5;
    const cm = [0, 1, 2, 3].map((k) => cloudHD(k + 10, CLOUD_GOLD));
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i - 4.5) * 0.32, d = 520 + (i % 3) * 60, w = 120 + (i % 4) * 40;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cm[i % 4], transparent: true, depthWrite: false, fog: false }));
      m.userData.off = new THREE.Vector3(Math.cos(a) * d, 70 + (i % 4) * 34, Math.sin(a) * d); m.scale.set(w, w / 2, 1); this.clouds.push(m);
    }
    for (const o of [this.dome, this.sun, this.sunHalo, this.burst, this.moon, this.moonHalo, this.stars, ...this.clouds]) { o.frustumCulled = false; o.layers.set(NOINK); this.root.add(o); }
  }
  /** toLight: unit world direction towards the sun (day) or moon (night) */
  update(t: number, cam: THREE.PerspectiveCamera, toLight: THREE.Vector3, time: Time) {
    const tone = TONE_OF[time], u = this.mat.uniforms, night = time === "night", low = time === "dusk" || time === "morning";
    tone.sky.forEach((h, i) => untone(h, u["c" + i].value));
    untone(tone.fog, u.c0.value); // horizon = fog colour, so distant geometry melts into the sky
    this.root.position.copy(cam.position);
    const far = (s: THREE.Sprite, a: number) => { s.position.copy(toLight).multiplyScalar(800); s.scale.setScalar(2 * 800 * Math.tan(deg(a))); };
    this.sun.visible = !night; far(this.sun, low ? 5.5 : 2.2);
    this.sunHalo.visible = !night && FX.halo; far(this.sunHalo, low ? 34 : 22);
    this.burst.visible = low && FX.halo; far(this.burst, 30); this.burst.material.rotation = t * 0.02;
    this.moon.visible = this.stars.visible = night; far(this.moon, 3.6);
    this.moonHalo.visible = night && FX.halo; far(this.moonHalo, 14);
    const cc = time === "noon" ? [1.25, 1.28, 1.35] : time === "morning" ? [1.2, 1.1, 1.0] : [1.05, 1.0, 1.0];
    for (const m of this.clouds) {
      m.visible = !night; m.position.copy(m.userData.off as THREE.Vector3);
      (m.material as THREE.MeshBasicMaterial).color.setRGB(cc[0], cc[1], cc[2]);
      m.lookAt(cam.position.x, cam.position.y + m.position.y, cam.position.z); m.rotation.x = 0; m.rotation.z = 0;
      m.rotation.y = Math.atan2(-m.position.x, -m.position.z);
    }
  }
}

// ---------------- effects ----------------
// EFFECTS layer of a set (kept apart from tone, see lights.ts). Per time of day:
//   glow  - every practical (window, lantern, moon) carries a wide soft halo, much larger than the source
//   pool  - a warm pool of light on the ground / floor under each practical
//   mist  - a thin low ground mist (golden morning, a trace at dusk; night and noon stay clear)
//   dust  - small glowing motes (fireflies outside) drifting near the lights
//   rays  - soft slanted shafts of light in the air along the sun / moon direction (forest + sunset shots), real
//           geometry so roofs and trees in front still hide them
// Glows and pools are built from the set's real PointLights, so they only ever sit on a visible source.
// Every effect has an inputProps switch (lights.ts FX: glow, pool, mist, dust, rays).
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

  /** strengths per time of day come from lights.ts EFFECT_OF: morning = gold mist + shafts + motes; noon = faint motes
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

// ---------------- world ----------------

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
