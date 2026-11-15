// Sky (TONE: the gradient per time of day, look.ts) + its EFFECTS: sun disc + halo, sunburst on a low sun (morning /
// dusk), big moon + halo and stars at night, painted three-tone clouds by day. Everything follows the camera.
import * as THREE from "three";
import { ctex, rng, cloudHD, CLOUD_GOLD } from "./paint";
import { NOINK } from "./ink";
import { untone } from "./shade";
import { FX, TONE_OF, Time } from "./look";

const disc = () => ctex("skyDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.8, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const halo = () => ctex("skyHalo", 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, "rgba(255,255,255,0.55)"); gr.addColorStop(0.25, "rgba(255,255,255,0.18)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
});
/** painted sunburst: soft radiating rays round a low sun */
const burst = () => ctex("skyBurst", 512, 512, (g, r) => {
  g.translate(256, 256);
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2 + r() * 0.08, w = 0.02 + r() * 0.05, L = 150 + r() * 106, gr = g.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L);
    gr.addColorStop(0, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a - w) * L, Math.sin(a - w) * L); g.lineTo(Math.cos(a + w) * L, Math.sin(a + w) * L); g.closePath(); g.fill();
  }
});
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
