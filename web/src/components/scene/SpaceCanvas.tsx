import { addAfterEffect, Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import type { Camera } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TextureLoader } from 'three';
import { animateScene, buildScene, disposeScene } from './sceneModel';
export type SpaceProps = { active: boolean; onReady: () => void; onFailure: () => void };
function fitCamera(camera: Camera, width: number, height: number) {
  camera.zoom = Math.max(width / 16.72, height / 9.41);
  camera.updateProjectionMatrix();
}
export function SceneObjects({ active, onReady, onFailure }: SpaceProps) {
  // Fix the tier at mount, so resizing never interrupts an already running scene.
  const [compact] = useState(() => window.matchMedia('(max-width: 700px)').matches);
  const { size, camera, gl, invalidate } = useThree();
  const portrait = window.matchMedia('(max-width: 600px)').matches;
  const directory = compact ? '/textures/mobile' : '/textures';
  const [day, night, clouds, normal] = useLoader(TextureLoader, [
    `${directory}/earth-day.webp`,
    `${directory}/earth-night.webp`,
    `${directory}/earth-clouds.webp`,
    `${directory}/earth-normal.webp`,
  ]);
  const model = useMemo(() => {
    for (const texture of [day!, night!, clouds!, normal!]) texture.anisotropy = 8;
    return buildScene(
      { day: day!, night: night!, clouds: clouds!, normal: normal! },
      compact,
      portrait,
    );
  }, [day, night, clouds, normal, compact, portrait]);
  const time = useRef(0);
  useLayoutEffect(() => {
    // Fit the camera, not the world: scaling the world changes light falloff and
    // cloud relief, making the rendered frame disagree with its loading still.
    fitCamera(camera, size.width, size.height);
    invalidate();
  }, [camera, size.width, size.height, invalidate]);
  useEffect(() => {
    // Reveal the canvas only after its first complete frame has reached the renderer.
    const cancelReady = addAfterEffect(() => {
      cancelReady();
      onReady();
    });
    invalidate();
    const lost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', lost);
    return () => {
      cancelReady();
      canvas.removeEventListener('webglcontextlost', lost);
      disposeScene(model);
    };
  }, [model, gl, invalidate, onReady, onFailure]);
  useFrame((_, delta) => {
    if (active) {
      time.current += Math.min(delta, 0.05);
      animateScene(model, time.current);
    }
  });
  return (
    <group>
      <primitive object={model.root} />
    </group>
  );
}
export default function SpaceCanvas(props: SpaceProps) {
  return (
    <Canvas
      className="scene-canvas"
      orthographic
      camera={{ position: [0, 0, 60], zoom: 100, near: 0.1, far: 200 }}
      dpr={[1, 1.5]}
      frameloop={props.active ? 'always' : 'demand'}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
    >
      <SceneObjects {...props} />
    </Canvas>
  );
}
