// Look test composition (1080x1920, 30 fps). Post chain, in this order:
//   InkPass (world ink, own pass) -> lens blur pre + main (thin-lens DOF per shot) -> bloom (HDR emissives only)
//   -> NEUTRAL tone mapping -> neutral grade + vignette (an effect). MSAA 4.
// Ink before the DOF so lines blur with their objects; bloom after it so glows defocus with their source. Every
// pixel-sized parameter is specified at 1080x1920 and scaled with the output height (stills at 0.5, final at 4/3).
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World } from "./world";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur } from "./lensblur";
import { GradeEffect, GRADES, gradeFor } from "./grade";
import { DOF, TOTAL, shotAt } from "./story";
import { EFFECT_OF, FX, TONE_OF } from "./lights";

export const LOOK_FRAMES = TOTAL;
type PostToggles = { ink: boolean; lens: boolean; bloom: boolean; grade: boolean };
const toggles = (): PostToggles => ({ ink: true, lens: true, bloom: true, grade: true, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

/** bloom: soft and wide; its MIP chain always starts at a 1920-high base so the glow scales with the frame */
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.45, luminanceThreshold: 0.78, luminanceSmoothing: 0.3, mipmapBlur: true, levels: 7, radius: 0.82 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const Inner: React.FC = () => {
  const f = useCurrentFrame(), shot = shotAt(f);
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, 1),
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const post = useMemo(() => (
    <EffectComposer multisampling={4}>
      {([
        on.ink && <primitive key="ink" object={fx.ink} dispose={null} />,
        on.lens && <primitive key="pre" object={fx.lens.pre} dispose={null} />,
        on.lens && <primitive key="lens" object={fx.lens.main} dispose={null} />,
        on.bloom && <primitive key="bloom" object={fx.bloom} dispose={null} />,
        <primitive key="tone" object={fx.tone} dispose={null} />,
        on.grade && <primitive key="grade" object={fx.grade} dispose={null} />,
      ].filter(Boolean) as React.JSX.Element[])}
    </EffectComposer>
  ), [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  const look = world.update(f, cam, scene);
  noInkFallback(world.root);
  const d = DOF[shot.id], eff = EFFECT_OF[shot.time];
  cam.getWorldDirection(fwd);
  fpt.copy(d?.focus ? new THREE.Vector3(...d.focus) : look);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = eff.dof && d ? d.cInf : 0;
  gradeFor(fx.grade, TONE_OF[shot.time].grade);
  (fx.grade.uniforms.get("gradeVig")!.value as THREE.Vector2).set(FX.vig ? eff.vignette : 0, 0.42);
  return <><primitive object={world.root} dispose={null} />{post}</>;
};

export const LookTest: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 46, near: 0.2, far: 1500 }}>
      <Inner />
    </ThreeCanvas>
  </AbsoluteFill>
);
