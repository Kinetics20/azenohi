import * as THREE from 'three';

export type EarthTextures = {
  day: THREE.Texture;
  night: THREE.Texture;
  clouds: THREE.Texture;
  normal: THREE.Texture;
};

const RADIUS = 34.695;
const CENTER = new THREE.Vector3(8.61, -33.476, -23);
const surfaceCoordinates = `
  // Reference-driven density and framing; this is not a geographic globe.
  vec2 surfaceUv(vec2 uv) { return fract(uv * 2. + vec2(.44, .18)); }
  vec2 cloudUv(vec2 uv) { return fract(uv * 2. + vec2(.17, .28)); }
`;
const sphereVertex = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vTangent;
  varying vec3 vBitangent;
  void main() {
    vUv = uv;
    vec3 tangent = normalize(vec3(normal.z + .000001, 0., -normal.x));
    vNormal = normalize(normalMatrix * normal);
    vTangent = normalize(normalMatrix * tangent);
    vBitangent = normalize(normalMatrix * cross(normal, tangent));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }
`;
const surfaceFragment = `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D cloudMap;
  uniform sampler2D normalMap;
  uniform float cloudDrift;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vTangent;
  varying vec3 vBitangent;
  ${surfaceCoordinates}
  void main() {
    vec3 n = normalize(vNormal);
    vec3 lightDirection = normalize(vec3(-.32, .24, -.91));
    vec2 uv = surfaceUv(vUv);
    vec3 terrain = texture2D(dayMap, uv).rgb;
    vec3 relief = texture2D(normalMap, uv).xyz * 2. - 1.;
    relief.xy *= 3.5;
    relief.z = max(relief.z, .35);
    vec3 detailNormal = normalize(mat3(normalize(vTangent), normalize(vBitangent), n) * normalize(relief));
    float diffuse = max(dot(detailNormal, lightDirection), 0.);
    float land = dot(terrain, vec3(.3, .5, .2));
    float cloudShadow = texture2D(cloudMap, cloudUv(vUv - vec2(cloudDrift, 0.)) + vec2(.001, -.001)).r;
    vec3 color = vec3(.048, .06, .11) + land * vec3(.18, .17, .24);
    color += diffuse * vec3(.42, .21, .22) * (.25 + land);
    color *= 1. - smoothstep(.25, .8, cloudShadow) * .4;

    vec3 night = texture2D(nightMap, uv).rgb;
    float settlements = max(night.r - night.b * .4, 0.);
    float darkness = 1. - smoothstep(-.08, .3, dot(n, lightDirection));
    color += pow(settlements, 1.13) * vec3(3.1, 1.25, .64) * darkness;

    float rim = pow(1. - max(n.z, 0.), 5.);
    float sunrise = exp(-pow((n.x + .215) * 8., 2.));
    color = mix(color, vec3(.14, .16, .25), rim * .32);
    color += vec3(.8, .35, .27) * sunrise * pow(rim, 1.8);
    float horizonBelt = exp(-max(n.z, 0.) * max(n.z, 0.) * 160.);
    color += mix(vec3(.2, .28, .5), vec3(1., .78, .67), sunrise) * horizonBelt * .55;
    gl_FragColor = vec4(color, 1.);
  }
`;
const cloudHeight = `
  float cloudHeight(vec2 uv) {
    float a = texture2D(cloudMap, uv).r;
    float b = texture2D(cloudMap, fract(uv * 2.7 + vec2(.23, .13))).r;
    return smoothstep(.22, .88, a * .82 + b * .18);
  }
`;
const cloudVertex = `
  uniform sampler2D cloudMap;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vTangent;
  varying vec3 vBitangent;
  ${surfaceCoordinates}
  ${cloudHeight}
  void main() {
    vUv = cloudUv(uv);
    vec3 tangent = normalize(vec3(normal.z + .000001, 0., -normal.x));
    vNormal = normalize(normalMatrix * normal);
    vTangent = normalize(normalMatrix * tangent);
    vBitangent = normalize(normalMatrix * cross(normal, tangent));
    // Fade the artistic cloud elevation at the limb, keeping the fitted horizon.
    float elevation = cloudHeight(vUv) * .42 * smoothstep(.06, .3, vNormal.z);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * elevation, 1.);
  }
`;
const cloudFragment = `
  uniform sampler2D cloudMap;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vTangent;
  varying vec3 vBitangent;
  ${cloudHeight}
  void main() {
    float height = cloudHeight(vUv);
    float opacity = smoothstep(.06, .55, height) * .72;
    if (opacity < .01) discard;
    vec3 n = normalize(vNormal);
    vec2 stepSize = vec2(.0006, 0.);
    float dx = cloudHeight(vUv - stepSize) - cloudHeight(vUv + stepSize);
    float dy = cloudHeight(vUv - stepSize.yx) - cloudHeight(vUv + stepSize.yx);
    vec3 normal = normalize(n + normalize(vTangent) * dx * 4. + normalize(vBitangent) * dy * 7.);
    vec3 light = normalize(vec3(-.32, .24, -.91));
    float diffuse = max(dot(normal, light), 0.);
    float silver = pow(max(dot(normal, normalize(light + vec3(0., 0., 1.))), 0.), 8.);
    float sunrise = exp(-pow((n.x + .215) * 7., 2.));
    float rim = pow(1. - max(n.z, 0.), 5.);
    vec3 color = vec3(.105, .125, .205) + height * vec3(.14, .16, .23);
    color += diffuse * mix(vec3(.48, .45, .57), vec3(1., .58, .4), sunrise);
    color += silver * vec3(.29, .18, .19) * .5;
    color += rim * mix(vec3(.15, .19, .31), vec3(.7, .35, .3), sunrise);
    gl_FragColor = vec4(color, opacity);
  }
`;
const planeVertex = `
  varying vec2 vPosition;
  void main() {
    vPosition = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }
`;

export function buildEarth(textures: EarthTextures, compact: boolean) {
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS, compact ? 128 : 192, compact ? 64 : 96),
    new THREE.ShaderMaterial({
      vertexShader: sphereVertex,
      fragmentShader: surfaceFragment,
      uniforms: {
        dayMap: { value: textures.day },
        nightMap: { value: textures.night },
        cloudMap: { value: textures.clouds },
        normalMap: { value: textures.normal },
        cloudDrift: { value: 0 },
      },
    }),
  );
  earth.position.copy(CENTER);
  earth.rotation.set(1.2, 0.9, -0.16);
  earth.name = 'Earth';
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS + 0.018, compact ? 160 : 384, compact ? 96 : 192),
    new THREE.ShaderMaterial({
      vertexShader: cloudVertex,
      fragmentShader: cloudFragment,
      uniforms: { cloudMap: { value: textures.clouds } },
      transparent: true,
      depthWrite: false,
    }),
  );
  clouds.position.copy(CENTER);
  clouds.rotation.copy(earth.rotation);
  clouds.name = 'Cloud layer';
  const atmosphere = new THREE.Mesh(
    new THREE.PlaneGeometry(74, 74),
    new THREE.ShaderMaterial({
      vertexShader: planeVertex,
      fragmentShader: `
        varying vec2 vPosition;
        void main() {
          float distance = length(vPosition) - 34.695;
          if (distance > 1.3) discard;
          float sunrise = exp(-pow((normalize(vPosition).x + .215) * 8., 2.));
          float halo = exp(-max(distance, 0.) / (.14 + sunrise * .3)) * (1. - smoothstep(.6, 1.25, distance));
          float inner = exp(-max(distance, 0.) / .025);
          vec3 tint = mix(vec3(.24, .35, .67), vec3(.95, .43, .43), sunrise);
          vec3 color = tint * halo * .7 + vec3(.45, .42, .65) * inner * .25;
          float alpha = max(max(color.r, color.g), color.b);
          gl_FragColor = vec4(color / max(alpha, .001), alpha);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  atmosphere.position.copy(CENTER);
  atmosphere.position.z -= 0.1;
  atmosphere.name = 'Atmospheric halo';
  const sun = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 5),
    new THREE.ShaderMaterial({
      vertexShader: planeVertex,
      fragmentShader: `
        varying vec2 vPosition;
        void main() {
          vec2 p = vPosition;
          float radius = dot(p, p);
          float core = exp(-dot(p * vec2(1., 1.45), p * vec2(1., 1.45)) * 35.);
          float bloom = exp(-radius * 2.8);
          float halo = exp(-radius * .9);
          float streak = exp(-abs(p.x) * 1.5) * exp(-abs(p.y - p.x * .22) * 100.);
          vec3 color = vec3(1., .94, .8) * core * .9;
          color += vec3(1., .48, .25) * bloom * .65;
          color += vec3(1., .13, .10) * halo * .12;
          color += vec3(1., .65, .5) * streak * .3;
          float alpha = clamp(max(max(color.r, color.g), color.b), 0., 1.);
          gl_FragColor = vec4(color / max(alpha, .001), alpha);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  // The opaque planet occludes the lower sun; the surface shader supplies its haze.
  sun.position.set(1.18, 0.46, -24);
  sun.name = 'Sunrise glow';
  return { earth, clouds, atmosphere, sun };
}
