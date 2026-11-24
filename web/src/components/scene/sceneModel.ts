import * as THREE from 'three';
import { motionAt } from './motion';
import { buildStation } from './stationModel';
export type EarthTextures = { day: THREE.Texture; night: THREE.Texture; clouds: THREE.Texture };
const vertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}`;
const fragmentShader = `
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform sampler2D cloudMap;
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  vec3 n = normalize(vNormal);
  // The camera is orthographic: its view direction is constant across the horizon.
  float rim = pow(1. - max(n.z, 0.), 5.);
  float sunrise = exp(-pow((n.x + .215) * 9., 2.));
  // Denser, repeating surface detail is an artistic treatment of the reference,
  // not a geographic globe. This preserves fine lights without an 8K GPU texture.
  vec2 surfaceUv = fract(vUv * 2.);
  vec3 land = texture2D(dayMap, surfaceUv).rgb;
  vec3 cities = pow(texture2D(nightMap, surfaceUv).rgb, vec3(1.7));
  float cloud = texture2D(cloudMap, surfaceUv).r;
  float shadow = texture2D(cloudMap, surfaceUv + vec2(.0007, -.0007)).r;
  vec3 col = vec3(.023, .033, .062) + land * vec3(.11, .10, .14);
  col += vec3(.23, .24, .34) * cloud;
  col -= vec3(.03, .028, .025) * shadow;
  col += cities * vec3(1.8, .79, .44) * (1. - cloud * .65);
  col += vec3(.10, .15, .29) * rim * .7;
  col += vec3(.9, .3, .22) * sunrise * pow(rim, 2.) * .65;
  col += vec3(.17, .09, .11) * cloud * sunrise;
  vec3 dawn = mix(vec3(.14, .21, .4), vec3(1., .75, .65), sunrise);
  col += dawn * pow(1. - max(n.z, 0.), 24.) * .8;
  gl_FragColor = vec4(col, 1.);
}`;
export function buildScene(textures: EarthTextures, compact = false) {
  const root = new THREE.Group();
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(34.695, 160, 96),
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        dayMap: { value: textures.day },
        nightMap: { value: textures.night },
        cloudMap: { value: textures.clouds },
      },
    }),
  );
  earth.position.set(8.61, -33.476, -23);
  earth.rotation.set(1.2, 0.9, -0.16);
  earth.name = 'Earth';
  root.add(earth);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(34.755, 160, 96),
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          vec3 n = normalize(vNormal);
          float edge = (1. - smoothstep(.02, .18, n.z)) * smoothstep(0., .045, n.z);
          float sunrise = exp(-pow((n.x + .215) * 8., 2.));
          vec3 tint = mix(vec3(.23, .32, .63), vec3(1., .48, .4), sunrise);
          gl_FragColor = vec4(tint, edge * .55);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  glow.position.copy(earth.position);
  root.add(glow);
  const placement = new THREE.Group();
  placement.position.set(compact ? 4.7 : 6.95, compact ? 3 : 2.18, 16);
  const stationScale = compact ? 0.55 : 1;
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
  return { root, earth, station, red, ownedTextures };
}
export type SceneModel = ReturnType<typeof buildScene>;
export function animateScene(model: SceneModel, seconds: number) {
  const pose = motionAt(seconds);
  model.earth.rotation.y = 0.9 + pose.earth;
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
