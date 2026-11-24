import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TextureLoader } from 'three';
import { animateScene, buildScene, disposeScene } from './sceneModel';
export type SpaceProps = { active: boolean; onReady: () => void; onFailure: () => void };
export function SceneObjects({ active, onReady, onFailure }: SpaceProps) {
  // Fix the tier at mount, so resizing never interrupts an already running scene.
  const [compact] = useState(() => window.matchMedia('(max-width: 700px)').matches);
  const directory = compact ? '/textures/mobile' : '/textures';
  const [day, night, clouds, normal] = useLoader(TextureLoader, [
    `${directory}/earth-day.webp`,
    `${directory}/earth-night.webp`,
    `${directory}/earth-clouds.webp`,
    `${directory}/earth-normal.webp`,
  ]);
  const model = useMemo(() => {
    for (const texture of [day!, night!, clouds!, normal!]) texture.anisotropy = 8;
    return buildScene({ day: day!, night: night!, clouds: clouds!, normal: normal! }, compact);
  }, [day, night, clouds, normal, compact]);
  const { viewport, gl } = useThree();
  const time = useRef(0);
  const scale = Math.max(viewport.width / 16.72, viewport.height / 9.41);
  useEffect(() => {
    onReady();
    const lost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', lost);
    return () => {
      canvas.removeEventListener('webglcontextlost', lost);
      disposeScene(model);
    };
  }, [model, gl, onReady, onFailure]);
  useFrame((_, delta) => {
    if (active) {
      time.current += Math.min(delta, 0.05);
      animateScene(model, time.current);
    }
  });
  return (
    <group scale={scale}>
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
