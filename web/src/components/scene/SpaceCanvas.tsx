import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { TextureLoader } from 'three';
import { animateScene, buildScene, disposeScene } from './sceneModel';
export type SpaceProps = { active: boolean; onReady: () => void; onFailure: () => void };
export function SceneObjects({ active, onReady, onFailure }: SpaceProps) {
  const [day, night, clouds] = useLoader(TextureLoader, [
    '/textures/earth-day.webp',
    '/textures/earth-night.webp',
    '/textures/earth-clouds.webp',
  ]);
  const model = useMemo(
    () => buildScene({ day: day!, night: night!, clouds: clouds! }),
    [day, night, clouds],
  );
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
