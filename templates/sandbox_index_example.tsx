// Sandbox entry for a look pass: renders only src/videos/dunia_world (an isolated copy of the template).
// Render it with BRIDGE_ENTRY=src/sandboxes/world/index.tsx node scripts/bridge-stills.mjs out/look/world/x_ 45,315 0.5
import React from "react";
import { Composition, registerRoot } from "remotion";
import { LookTest, LOOK_FRAMES } from "../../videos/dunia_world/Dunia";

const Root: React.FC = () => <Composition id="LookTest" component={LookTest} durationInFrames={LOOK_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
