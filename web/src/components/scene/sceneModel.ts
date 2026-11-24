import * as THREE from 'three';
import { motionAt } from './motion';
const TAU = Math.PI * 2;
export type EarthTextures = { day: THREE.Texture; night: THREE.Texture; clouds: THREE.Texture };
const vertexShader = `varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);vView=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`;
const fragmentShader = `uniform sampler2D dayMap;uniform sampler2D nightMap;uniform sampler2D cloudMap;varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;
void main(){vec3 n=normalize(vNormal);float sunlight=dot(n,normalize(vec3(-.15,.08,-.9)));float day=smoothstep(-.05,.3,sunlight);vec3 land=texture2D(dayMap,vUv).rgb;vec3 cities=texture2D(nightMap,vUv).rgb;float cloud=texture2D(cloudMap,vUv).r;vec3 col=land*(.07+.26*day)+vec3(.15,.21,.32)*cloud*.12;col+=cities*vec3(4.0,1.15,.55)*(1.-day);float rim=pow(1.-max(dot(n,normalize(vView)),0.),4.);col+=vec3(.13,.23,.6)*rim*.28;gl_FragColor=vec4(col,1.);}`;
export function buildScene(textures: EarthTextures) {
  const root = new THREE.Group();
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(31, 96, 64),
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
  earth.position.set(9, -29.7, -23);
  earth.rotation.set(1.2, 0.9, -0.16);
  earth.name = 'Earth';
  root.add(earth);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(31.075, 96, 64),
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: `varying vec3 vNormal;varying vec3 vView;void main(){float rim=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),7.);gl_FragColor=vec4(.38,.55,1.,rim*.3);}`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  glow.position.copy(earth.position);
  root.add(glow);
  const placement = new THREE.Group();
  placement.position.set(6.35, 2.25, 16);
  placement.rotation.set(0.3, 0, 0.16);
  root.add(placement);
  const station = new THREE.Group();
  station.name = 'Orbital station';
  placement.add(station);
  const metal = new THREE.MeshStandardMaterial({
    color: '#354356',
    metalness: 0.8,
    roughness: 0.37,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: '#0d1724',
    metalness: 0.8,
    roughness: 0.54,
  });
  const trim = new THREE.MeshStandardMaterial({
    color: '#53677b',
    metalness: 0.72,
    roughness: 0.35,
  });
  const windows = new THREE.MeshStandardMaterial({
    color: '#ffca8b',
    emissive: '#ffb867',
    emissiveIntensity: 2.3,
    toneMapped: false,
  });
  const red = new THREE.MeshStandardMaterial({
    color: '#ff1230',
    emissive: '#ff0022',
    emissiveIntensity: 2,
    toneMapped: false,
  });
  function ring(radius: number, y: number, tube: number, material: THREE.Material) {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 128), material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = y;
    station.add(mesh);
  }
  for (const y of [0.31, 0.49, 0.64]) {
    ring(2.2, y, 0.048, trim);
    ring(1.96, y, 0.028, metal);
  }
  ring(2.08, 0.45, 0.12, dark);
  ring(0.83, -0.85, 0.095, metal);
  ring(0.9, -0.82, 0.035, trim);
  ring(0.75, -0.95, 0.035, trim);
  const deck = new THREE.Mesh(
    new THREE.RingGeometry(1.94, 2.25, 128),
    new THREE.MeshStandardMaterial({
      color: '#29394d',
      metalness: 0.8,
      roughness: 0.4,
      side: THREE.DoubleSide,
    }),
  );
  deck.rotation.x = Math.PI / 2;
  deck.position.y = 0.46;
  station.add(deck);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 2.0, 20), metal);
  core.position.y = -0.15;
  station.add(core);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 32), trim);
  collar.position.y = 0.5;
  station.add(collar);
  const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.8, 12), trim);
  spindle.position.y = -1.4;
  station.add(spindle);
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.83, 0.055, 0.095), trim);
    arm.position.set(Math.cos(a) * 1.04, 0.39, Math.sin(a) * 1.04);
    arm.rotation.y = -a;
    station.add(arm);
    const lower = arm.clone();
    lower.scale.set(0.4, 1, 0.7);
    lower.position.set(Math.cos(a) * 0.49, -0.85, Math.sin(a) * 0.49);
    station.add(lower);
  }
  const matrix = new THREE.Object3D();
  const panels = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.24, 0.19), metal, 96);
  const lights = new THREE.InstancedMesh(new THREE.BoxGeometry(0.052, 0.026, 0.008), windows, 192);
  for (let i = 0; i < 96; i++) {
    const a = (i * TAU) / 96;
    matrix.position.set(Math.cos(a) * 2.12, 0.47, Math.sin(a) * 2.12);
    matrix.rotation.set(0, -a, 0);
    matrix.scale.set(1, 1 + (i % 7 === 0 ? 0.45 : 0), 1);
    matrix.updateMatrix();
    panels.setMatrixAt(i, matrix.matrix);
    for (let row = 0; row < 2; row++) {
      matrix.position.set(Math.cos(a) * 2.255, 0.38 + row * 0.14, Math.sin(a) * 2.255);
      matrix.rotation.set(0, Math.PI / 2 - a, 0);
      matrix.scale.set(1, 1, 1);
      matrix.updateMatrix();
      lights.setMatrixAt(i * 2 + row, matrix.matrix);
    }
  }
  station.add(panels, lights);
  const ribs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.018, 0.34, 0.32), trim, 144);
  const equipment = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.07, 0.17), dark, 96);
  for (let i = 0; i < 144; i++) {
    const a = (i * TAU) / 144;
    matrix.position.set(Math.cos(a) * 2.12, 0.47, Math.sin(a) * 2.12);
    matrix.rotation.set(0, -a, 0);
    matrix.updateMatrix();
    ribs.setMatrixAt(i, matrix.matrix);
  }
  for (let i = 0; i < 96; i++) {
    const a = (i * TAU) / 96;
    matrix.position.set(Math.cos(a) * 2.08, 0.7 + (i % 3) * 0.025, Math.sin(a) * 2.08);
    matrix.rotation.set(0, -a, 0);
    matrix.updateMatrix();
    equipment.setMatrixAt(i, matrix.matrix);
  }
  station.add(ribs, equipment);
  for (let i = 0; i < 12; i++) {
    const a = (i * TAU) / 12;
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.9, 6), trim);
    pipe.position.set(Math.cos(a) * 0.235, -0.2, Math.sin(a) * 0.235);
    station.add(pipe);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i * TAU) / 6;
    const strut = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.022, 0.026), metal);
    strut.position.set(Math.cos(a) * 1.07, 0.15, Math.sin(a) * 1.07);
    strut.rotation.set(0, -a, 0.27);
    station.add(strut);
  }

  const smallLights = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.035, 0.026, 0.018),
    windows,
    48,
  );
  for (let i = 0; i < 48; i++) {
    const a = (i * TAU) / 48;
    matrix.position.set(Math.cos(a) * 0.91, -0.83, Math.sin(a) * 0.91);
    matrix.rotation.set(0, Math.PI / 2 - a, 0);
    matrix.updateMatrix();
    smallLights.setMatrixAt(i, matrix.matrix);
  }
  station.add(smallLights);
  const beaconPositions: [number, number, number][] = [
    [2.23, 0.75, 0],
    [-1.4, 0.73, 1.7],
    [0.3, 0.73, -2.15],
    [-0.8, -0.72, 0.1],
  ];
  beaconPositions.forEach(([x, y, z]) => {
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), red);
    beacon.position.set(x, y, z);
    station.add(beacon);
  });
  const redLight = new THREE.PointLight('#ff2547', 5, 5, 2);
  redLight.position.set(-1, 0.7, 1.8);
  placement.add(redLight);
  const sun = new THREE.DirectionalLight('#ffd5ba', 5);
  sun.position.set(-5, 5, 10);
  root.add(sun);
  const fill = new THREE.DirectionalLight('#729bd5', 2.3);
  fill.position.set(3, 6, 10);
  root.add(fill, new THREE.AmbientLight('#8aa1bf', 0.65));
  return { root, earth, station, red };
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
    if (isMesh(object)) {
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material])
        materials.add(material);
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}
