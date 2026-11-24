import * as THREE from 'three';
import { motionAt } from './motion';
import { buildStation } from './stationModel';
import { buildEarth } from './earthModel';
import type { EarthTextures } from './earthModel';
export function buildScene(textures: EarthTextures, compact = false, portrait = compact) {
  const root = new THREE.Group();
  const { earth, clouds, atmosphere, sun: sunrise } = buildEarth(textures, compact);
  root.add(earth, clouds, atmosphere, sunrise);
  const placement = new THREE.Group();
  placement.position.set(portrait ? 3.5 : 6.95, portrait ? 2.1 : 2.18, 16);
  const stationScale = portrait ? 0.43 : 1;
  placement.scale.setScalar(stationScale);
  placement.rotation.set(-0.25, 0, 0.16);
  root.add(placement);
  const { station, red, glint, textures: ownedTextures } = buildStation();
  placement.add(station, glint);
  const rim = new THREE.PointLight('#ffb5a9', 26 * stationScale ** 2, 3.5 * stationScale, 2);
  rim.position.set(-3.15, 0.35, 0.75);
  placement.add(rim);
  const sun = new THREE.DirectionalLight('#ffd4c6', 5);
  sun.position.set(-4, 0.5, 20);
  sun.target.position.copy(placement.position);
  const fill = new THREE.DirectionalLight('#819dc5', 0.75);
  fill.position.set(6, 8, 24);
  fill.target.position.copy(placement.position);
  const bounce = new THREE.DirectionalLight('#db6a80', 0.8);
  bounce.position.set(5, -5, 21);
  bounce.target.position.copy(placement.position);
  root.add(sun, sun.target, fill, fill.target, bounce, bounce.target);
  return { root, earth, clouds, station, red, ownedTextures };
}
export type SceneModel = ReturnType<typeof buildScene>;
export function animateScene(model: SceneModel, seconds: number) {
  const pose = motionAt(seconds);
  model.earth.rotation.y = 0.9 + pose.earth;
  model.clouds.rotation.y = 0.9 + pose.earth * 1.025;
  model.earth.material.uniforms['cloudDrift']!.value = (pose.earth * 0.025) / (Math.PI * 2);
  model.station.rotation.y = pose.station;
  model.red.emissiveIntensity = pose.beacon;
}
function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return object instanceof THREE.Mesh;
}
export function disposeScene(model: SceneModel) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  model.root.traverse((object) => {
    if (object instanceof THREE.InstancedMesh) object.dispose();
    if (isMesh(object)) geometries.add(object.geometry);
    if (isMesh(object) || object instanceof THREE.Sprite) {
      for (const material of Array.isArray(object.material) ? object.material : [object.material])
        materials.add(material);
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  model.ownedTextures.forEach((texture) => texture.dispose());
}
