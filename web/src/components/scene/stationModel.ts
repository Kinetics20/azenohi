import * as THREE from 'three';

const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);
const variation = (i: number) => {
  const n = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};
function at(radius: number, angle: number, y: number) {
  return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
}

// A small, linear HDR reflection field: cold space, a broad warm key and Earth fill.
// Keeping it procedural avoids another image request and a post-processing pass.
function reflectionMap() {
  const width = 128;
  const height = 64;
  const data = new Float32Array(width * height * 4);
  const key = new THREE.Vector3(-0.9, -0.2, 0.4).normalize();
  for (let y = 0; y < height; y++) {
    const theta = ((y + 0.5) / height) * Math.PI;
    for (let x = 0; x < width; x++) {
      const phi = ((x + 0.5) / width) * TAU;
      const direction = new THREE.Vector3(
        -Math.sin(theta) * Math.cos(phi),
        Math.cos(theta),
        Math.sin(theta) * Math.sin(phi),
      );
      const warm = Math.pow(Math.max(0, direction.dot(key)), 24) * 5;
      const cool = Math.pow(Math.max(0, -direction.y), 2) * 0.09;
      const offset = (y * width + x) * 4;
      data[offset] = 0.025 + cool * 0.55 + warm;
      data[offset + 1] = 0.04 + cool * 0.65 + warm * 0.62;
      data[offset + 2] = 0.075 + cool + warm * 0.56;
      data[offset + 3] = 1;
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
}

interface Part {
  position: THREE.Vector3;
  scale: THREE.Vector3;
  rotation: THREE.Quaternion;
  color: THREE.Color;
}

function surfaceMap() {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4;
      const grain = 180 + variation(y * size + x) * 55 + variation(y) * 20;
      data[offset] = data[offset + 1] = data[offset + 2] = grain;
      data[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function rimGlint() {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const distance = ((x + 0.5) / size - 0.5) ** 2 + ((y + 0.5) / size - 0.5) ** 2;
      const offset = (y * size + x) * 4;
      data[offset] = data[offset + 1] = data[offset + 2] = 255;
      data[offset + 3] = Math.max(0, Math.exp(-distance * 24) - Math.exp(-6)) * 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  const glint = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      color: '#ff675b',
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  glint.name = 'Warm rim reflection';
  glint.position.set(-2.82, 0.45, 0.46);
  glint.scale.set(1.4, 0.8, 1);
  return { glint, texture };
}

export function buildStation() {
  const station = new THREE.Group();
  station.name = 'Orbital station';
  const environment = reflectionMap();
  const surface = surfaceMap();
  const { glint, texture: glow } = rimGlint();
  const armor = new THREE.MeshStandardMaterial({
    color: '#465268',
    metalness: 0.82,
    roughness: 0.48,
    envMap: environment,
    envMapIntensity: 0.8,
    roughnessMap: surface,
    bumpMap: surface,
    bumpScale: 0.0015,
  });
  const structure = new THREE.MeshStandardMaterial({
    color: '#4c5669',
    metalness: 0.86,
    roughness: 0.4,
    envMap: environment,
    envMapIntensity: 0.7,
  });
  const recess = new THREE.MeshStandardMaterial({
    color: '#141b29',
    metalness: 0.65,
    roughness: 0.6,
    envMap: environment,
  });
  const thermal = new THREE.MeshStandardMaterial({
    color: '#6d4238',
    metalness: 0.7,
    roughness: 0.5,
    envMap: environment,
  });
  const windows = new THREE.MeshBasicMaterial({ color: 'white', toneMapped: false });
  const red = new THREE.MeshStandardMaterial({
    color: '#d12136',
    emissive: '#ff1938',
    emissiveIntensity: 1.6,
    toneMapped: false,
  });
  const armorParts: Part[] = [];
  const frameParts: Part[] = [];
  const darkParts: Part[] = [];
  const copperParts: Part[] = [];
  const windowParts: Part[] = [];
  const beaconParts: Part[] = [];

  function polar(
    parts: Part[],
    radius: number,
    angle: number,
    y: number,
    width: number,
    height: number,
    depth: number,
    tint = '#ffffff',
  ) {
    parts.push({
      position: new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius),
      scale: new THREE.Vector3(width, height, depth),
      rotation: new THREE.Quaternion().setFromAxisAngle(UP, Math.PI / 2 - angle),
      color: new THREE.Color(tint),
    });
  }
  function beam(from: THREE.Vector3, to: THREE.Vector3, width: number, depth = width) {
    const direction = to.clone().sub(from);
    frameParts.push({
      position: from.clone().add(to).multiplyScalar(0.5),
      scale: new THREE.Vector3(width, direction.length(), depth),
      rotation: new THREE.Quaternion().setFromUnitVectors(UP, direction.normalize()),
      color: new THREE.Color('#9da4b4'),
    });
  }
  function shell(name: string, points: [number, number][], material: THREE.Material) {
    const geometry = new THREE.LatheGeometry(
      points.map(([r, y]) => new THREE.Vector2(r, y)),
      192,
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    station.add(mesh);
  }
  function band(
    name: string,
    inner: number,
    outer: number,
    y: number,
    height: number,
    material: THREE.Material,
  ) {
    const bevel = Math.min(0.018, height / 3);
    shell(
      name,
      [
        [inner, y - height / 2 + bevel],
        [inner + bevel, y - height / 2],
        [outer - bevel, y - height / 2],
        [outer, y - height / 2 + bevel],
        [outer, y + height / 2 - bevel],
        [outer - bevel, y + height / 2],
        [inner + bevel, y + height / 2],
        [inner, y + height / 2 - bevel],
        [inner, y - height / 2 + bevel],
      ],
      material,
    );
  }

  // A closed, bevelled annular hull, with separate armor courses and recessed seams.
  band('Habitat pressure hull', 2.43, 2.85, 0.45, 0.32, recess);
  for (const y of [0.294, 0.395, 0.505, 0.608]) {
    band('Hull belt', 2.431, 2.862, y, 0.014, structure);
  }
  band('Underside service channel', 2.51, 2.78, 0.262, 0.045, recess);
  for (let i = 0; i < 144; i++) {
    const a = (i * TAU) / 144;
    for (let row = 0; row < 3; row++) {
      const v = variation(i * 3 + row);
      const tint = new THREE.Color().setScalar(0.5 + v * 0.25).getStyle();
      polar(armorParts, 2.851, a, 0.345 + row * 0.104, 0.118, 0.088, 0.025, tint);
      polar(armorParts, 2.427, a, 0.345 + row * 0.104, 0.1, 0.087, 0.019, tint);
    }
    // Narrow frames and hardware on both exposed faces, not torus-shaped rails.
    polar(frameParts, 2.646, a, 0.289, 0.008, 0.018, 0.425, '#7e8490');
    if (i % 3 === 0) {
      polar(frameParts, 2.862, a, 0.45, 0.012, 0.326, 0.016, '#b1b5c2');
      polar(frameParts, 2.42, a, 0.45, 0.009, 0.326, 0.015);
    }
    const r = 2.55 + variation(i + 600) * 0.19;
    polar(darkParts, r, a, 0.239, 0.044 + variation(i) * 0.06, 0.035, 0.095);
    polar(armorParts, 2.65, a, 0.613, 0.112, 0.013, 0.37, '#677486');
    if (i % 4 === 0) {
      polar(copperParts, r, a + 0.01, 0.218, 0.028, 0.016, 0.08);
      polar(frameParts, 2.82, a, 0.632, 0.018, 0.036, 0.026);
    }
  }

  // Window clusters vary in length, color and occupancy; most of the hull stays dark.
  for (let i = 0; i < 288; i++) {
    const a = (i * TAU) / 288;
    for (let row = 0; row < 2; row++) {
      const v = variation(i * 7 + row * 31);
      if (v > 0.56) {
        const tint = v > 0.92 ? '#d4dfeb' : v > 0.7 ? '#ffc18c' : '#ab6049';
        polar(windowParts, 2.869, a, 0.393 + row * 0.111, 0.018 + v * 0.04, 0.014, 0.004, tint);
        polar(windowParts, 2.416, a, 0.385 + row * 0.112, 0.024, 0.008, 0.004, tint);
      }
    }
    if (i % 9 === 0) polar(windowParts, 2.68, a, 0.231, 0.024, 0.009, 0.025, '#b85034');
  }

  // Six shallow box trusses join the rim and hub; cross braces are real geometry.
  for (let i = 0; i < 6; i++) {
    const a = (i * TAU) / 6 + 0.12;
    for (const offset of [-0.025, 0.025]) {
      beam(at(0.28, a + offset, 0.36), at(2.47, a + offset, 0.31), 0.018, 0.024);
      beam(at(0.28, a + offset, 0.49), at(2.47, a + offset, 0.49), 0.012);
    }
    for (let j = 0; j < 8; j++) {
      const radius = 0.32 + j * 0.27;
      beam(at(radius, a - 0.025, 0.35), at(radius + 0.27, a + 0.025, 0.48), 0.008);
      beam(at(radius, a + 0.025, 0.35), at(radius + 0.27, a - 0.025, 0.48), 0.008);
    }
    beam(at(0.28, a, 0.13), at(2.44, a, 0.29), 0.009);
  }

  shell(
    'Axial service tower',
    [
      [0.085, -1.46],
      [0.14, -1.38],
      [0.14, -1.14],
      [0.215, -1.1],
      [0.225, -0.7],
      [0.25, -0.65],
      [0.25, 0.4],
      [0.29, 0.48],
      [0.29, 0.55],
      [0.13, 0.57],
      [0.13, 0.67],
      [0, 0.67],
    ],
    armor,
  );
  for (const y of [-1.36, -1.12, -0.93, -0.67, -0.32, 0.16, 0.44, 0.53]) {
    const radius = y < -1.12 ? 0.16 : y < -0.67 ? 0.24 : 0.277;
    band('Tower collar', radius - 0.025, radius, y, 0.025, structure);
  }
  for (let i = 0; i < 20; i++) {
    const a = (i * TAU) / 20;
    polar(armorParts, 0.251, a, -0.07, 0.06, 0.79, 0.025, '#9eabc0');
    polar(darkParts, 0.274, a, -0.03, 0.018, 0.63, 0.009);
    polar(frameParts, 0.277, a, -0.08, 0.009, 0.87, 0.012);
    polar(armorParts, 0.224, a, -0.93, 0.048, 0.28, 0.024, '#7d8a9e');
    polar(armorParts, 0.146, a, -1.26, 0.033, 0.2, 0.018, '#7d8a9e');
    polar(darkParts, 0.244, a, -1.04, 0.035, 0.09, 0.025);
    if (i % 4 === 0) {
      polar(darkParts, 0.29, a, -0.02, 0.07, 0.13, 0.05);
      polar(windowParts, 0.318, a, -0.01, 0.018, 0.035, 0.004, '#c96850');
      beam(at(0.27, a, -0.5), at(0.3, a, 0.42), 0.012);
      beam(at(0.17, a, -1.16), at(0.17, a, -1.48), 0.012);
      polar(windowParts, 0.269, a, -0.94, 0.012, 0.018, 0.004, '#c96850');
    }
  }

  // Docking saucer has a plated underside and machinery, rather than an empty wheel.
  band('Docking deck', 0.24, 0.96, -0.45, 0.18, recess);
  band('Docking upper lip', 0.27, 0.965, -0.358, 0.018, structure);
  band('Docking lower lip', 0.26, 0.93, -0.547, 0.018, structure);
  band('Docking undercarriage', 0.36, 0.75, -0.574, 0.045, armor);
  for (let i = 0; i < 72; i++) {
    const a = (i * TAU) / 72;
    polar(armorParts, 0.954, a, -0.45, 0.077, 0.14, 0.023, '#8b95a6');
    polar(frameParts, 0.963, a, -0.45, 0.006, 0.18, 0.018);
    polar(armorParts, 0.62, a, -0.552, 0.038, 0.015, 0.6, '#8c92a4');
    polar(darkParts, 0.7, a, -0.581, 0.037, 0.034, 0.09);
    const radial = 0.36 + variation(i + 201) * 0.5;
    polar(copperParts, radial, a, -0.592, 0.028, 0.026, 0.08);
    if (variation(i + 90) > 0.35) {
      polar(windowParts, 0.972, a, -0.43, 0.034, 0.009, 0.004, '#dfa16a');
      polar(windowParts, 0.67, a, -0.604, 0.018, 0.006, 0.031, '#db6637');
      polar(windowParts, radial, a, -0.61, 0.018, 0.008, 0.025, '#e77c46');
    }
  }
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8 + 0.2;
    beam(at(0.29, a, -0.69), at(0.86, a, -0.56), 0.016);
    polar(copperParts, 0.82, a, -0.565, 0.08, 0.023, 0.06);
    polar(darkParts, 0.72, a, -0.333, 0.07, 0.045, 0.12);
  }

  // Small asymmetric aerials break the silhouette; lights stay below a few pixels.
  for (const [a, height] of [
    [0.3, 0.18],
    [2.7, 0.1],
    [4.45, 0.14],
  ] as const) {
    beam(at(2.7, a, 0.63), at(2.7, a, 0.63 + height), 0.009);
    polar(beaconParts, 2.7, a, 0.63 + height, 0.016, 0.018, 0.016);
  }
  beam(new THREE.Vector3(0, 0.67, 0), new THREE.Vector3(0, 0.86, 0), 0.009);
  beam(new THREE.Vector3(0.04, -1.44, 0), new THREE.Vector3(0.04, -1.73, 0), 0.009);
  polar(beaconParts, 0.97, 2.9, -0.35, 0.018, 0.018, 0.018);

  const box = new THREE.BoxGeometry(1, 1, 1);
  function batch(name: string, parts: Part[], material: THREE.Material) {
    const mesh = new THREE.InstancedMesh(box, material, parts.length);
    mesh.name = name;
    const matrix = new THREE.Matrix4();
    parts.forEach((part, index) => {
      matrix.compose(part.position, part.rotation, part.scale);
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, part.color);
    });
    mesh.computeBoundingSphere();
    station.add(mesh);
  }
  batch('Hull plating', armorParts, armor);
  batch('Trusses and ribs', frameParts, structure);
  batch('Recessed equipment', darkParts, recess);
  batch('Thermal panels', copperParts, thermal);
  batch('Occupied windows', windowParts, windows);
  batch('Navigation beacons', beaconParts, red);
  return { station, red, glint, textures: [environment, surface, glow] };
}
