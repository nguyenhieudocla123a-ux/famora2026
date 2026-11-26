// Trống đồng (Đông Sơn bronze drum) rendered live with three.js.
// The model is procedural: a lathe profile (flat tympanum, bulging mantle, straight waist,
// flared foot) and canvas-drawn engravings (14-ray star, tick and circle-dot bands,
// a ring of stylised Lạc birds). No external assets, so it is fully original.
//
//   import { mountDrum } from './drum3d.js';
//   const drum = mountDrum(canvas, { tilt: 0.55, speed: 0.12 });   // drum.dispose()
//
// Motion stops (a still, posed frame) under prefers-reduced-motion.
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';

const BRONZE = '#8a6431';
const BRONZE_DARK = '#4a3015';
const BRONZE_LIGHT = '#c29752';
const PATINA = '#5f7f63';

/** Engraved drum face, drawn on a square canvas. */
function faceTexture(size = 1024) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const R = size / 2;
  g.translate(R, R);

  // cast bronze base with a soft radial sheen
  const base = g.createRadialGradient(0, 0, R * 0.05, 0, 0, R);
  base.addColorStop(0, BRONZE_LIGHT);
  base.addColorStop(0.55, BRONZE);
  base.addColorStop(1, '#7c5526');
  g.fillStyle = base;
  g.beginPath();
  g.arc(0, 0, R, 0, Math.PI * 2);
  g.fill();

  g.strokeStyle = BRONZE_DARK;
  g.fillStyle = BRONZE_DARK;
  const ring = (r, w = 3) => {
    g.lineWidth = w;
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.stroke();
  };

  // central 14-ray star (the sun)
  const rays = 14;
  g.beginPath();
  for (let i = 0; i < rays * 2; i++) {
    const r = i % 2 ? R * 0.06 : R * 0.2;
    const a = (Math.PI * i) / rays - Math.PI / 2;
    g.lineTo(r * Math.cos(a), r * Math.sin(a));
  }
  g.closePath();
  g.fillStyle = BRONZE_LIGHT;
  g.fill();
  g.lineWidth = 2;
  g.stroke();
  // feather motifs between the rays
  g.fillStyle = BRONZE_DARK;
  for (let i = 0; i < rays; i++) {
    const a = (Math.PI * (2 * i + 1)) / rays - Math.PI / 2;
    g.save();
    g.rotate(a);
    g.beginPath();
    g.moveTo(R * 0.08, 0);
    g.lineTo(R * 0.17, -R * 0.022);
    g.lineTo(R * 0.17, R * 0.022);
    g.closePath();
    g.fill();
    g.restore();
  }

  // concentric bands: ticks, circle-dots, zigzag
  const tickBand = (r1, r2, n) => {
    ring(r1, 3);
    ring(r2, 3);
    g.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const a = (2 * Math.PI * i) / n;
      g.beginPath();
      g.moveTo(r1 * Math.cos(a), r1 * Math.sin(a));
      g.lineTo(r2 * Math.cos(a), r2 * Math.sin(a));
      g.stroke();
    }
  };
  const dotBand = (r1, r2, n) => {
    ring(r1, 3);
    ring(r2, 3);
    const rm = (r1 + r2) / 2;
    const rr = (r2 - r1) * 0.32;
    for (let i = 0; i < n; i++) {
      const a = (2 * Math.PI * i) / n;
      g.lineWidth = 2.2;
      g.beginPath();
      g.arc(rm * Math.cos(a), rm * Math.sin(a), rr, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.arc(rm * Math.cos(a), rm * Math.sin(a), rr * 0.28, 0, Math.PI * 2);
      g.fill();
    }
  };
  const zigBand = (r1, r2, n) => {
    ring(r1, 3);
    ring(r2, 3);
    g.lineWidth = 2;
    g.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (2 * Math.PI * i) / n;
      const r = i % 2 ? r2 - 4 : r1 + 4;
      g.lineTo(r * Math.cos(a), r * Math.sin(a));
    }
    g.stroke();
  };

  ring(R * 0.24, 4);
  tickBand(R * 0.27, R * 0.32, 96);
  dotBand(R * 0.34, R * 0.42, 40);
  zigBand(R * 0.44, R * 0.49, 120);

  // ring of stylised Lạc birds flying counter-clockwise
  ring(R * 0.52, 3);
  ring(R * 0.72, 3);
  const birds = 18;
  for (let i = 0; i < birds; i++) {
    const a = (2 * Math.PI * i) / birds;
    g.save();
    g.rotate(a);
    g.translate(R * 0.62, 0);
    g.rotate(-Math.PI / 2);
    g.scale(R / 512, R / 512);
    g.fillStyle = BRONZE_DARK;
    g.beginPath();
    // long beak and crest, body, spread tail — a simplified heron in flight
    g.moveTo(-44, 0);
    g.lineTo(-12, -4);
    g.quadraticCurveTo(0, -12, 14, -6);
    g.lineTo(26, -22);
    g.lineTo(22, -4);
    g.quadraticCurveTo(36, -2, 46, -14);
    g.lineTo(42, 2);
    g.quadraticCurveTo(30, 10, 12, 8);
    g.lineTo(2, 18);
    g.lineTo(-2, 6);
    g.quadraticCurveTo(-20, 6, -44, 0);
    g.fill();
    g.restore();
  }

  dotBand(R * 0.75, R * 0.83, 56);
  tickBand(R * 0.86, R * 0.9, 160);
  ring(R * 0.97, 5);

  // faint green patina in the recesses
  g.globalAlpha = 0.18;
  for (let i = 0; i < 900; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * R * 0.98;
    g.fillStyle = PATINA;
    g.beginPath();
    g.arc(r * Math.cos(a), r * Math.sin(a), Math.random() * 6 + 1, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Side engraving: horizontal bands wrapped around the body (u = around, v = height). */
function sideTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#6f4c22');
  grad.addColorStop(0.5, BRONZE);
  grad.addColorStop(1, '#4f3517');
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 512);
  g.strokeStyle = BRONZE_DARK;
  g.fillStyle = BRONZE_DARK;
  const band = (y, h) => {
    g.lineWidth = 2;
    g.strokeRect(-2, y, 1028, h);
    const n = 46; // circles per band; spacing divides 1024 exactly so the wrap seam is invisible
    for (let i = 0; i < n; i++) {
      g.beginPath();
      g.arc(((i + 0.5) * 1024) / n, y + h / 2, h * 0.28, 0, Math.PI * 2);
      g.stroke();
    }
  };
  band(40, 22);
  band(110, 18);
  band(300, 22);
  band(420, 18);
  g.globalAlpha = 0.32;
  for (let i = 0; i < 500; i++) {
    g.fillStyle = PATINA;
    g.fillRect(Math.random() * 1024, Math.random() * 512, Math.random() * 10, Math.random() * 4);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

function buildDrum() {
  const group = new THREE.Group();
  // lathe profile (radius, height), bottom to top
  const profile = [
    [0.94, -0.62], [0.97, -0.6], [0.9, -0.5], [0.82, -0.36], [0.8, -0.2], [0.8, 0.05],
    [0.86, 0.2], [0.98, 0.36], [1.04, 0.46], [1.02, 0.55], [1.0, 0.6], [1.06, 0.6], [1.06, 0.62],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const bodyMat = new THREE.MeshStandardMaterial({ map: sideTexture(), metalness: 0.78, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 128), bodyMat);
  group.add(body);

  const face = new THREE.Mesh(
    new THREE.CircleGeometry(1.06, 128),
    new THREE.MeshStandardMaterial({ map: faceTexture(), metalness: 0.8, roughness: 0.35 }),
  );
  face.rotation.x = -Math.PI / 2;
  face.position.y = 0.621;
  group.add(face);

  // four small handles on the shoulder
  const handleMat = new THREE.MeshStandardMaterial({ color: '#8a6330', metalness: 0.85, roughness: 0.45 });
  for (let i = 0; i < 4; i++) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 10, 24, Math.PI), handleMat);
    const a = (Math.PI / 2) * i + Math.PI / 4;
    h.position.set(Math.cos(a) * 0.97, 0.22, Math.sin(a) * 0.97);
    h.rotation.y = -a;
    h.rotation.z = Math.PI / 2;
    group.add(h);
  }
  return group;
}

export function mountDrum(canvas, { tilt = 0.5, speed = 0.12, distance = 3.4 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, Math.sin(tilt) * distance, Math.cos(tilt) * distance);
  camera.lookAt(0, 0.05, 0);

  // warm altar light from above-left, red bounce from the lacquer, cool rim
  const key = new THREE.DirectionalLight('#ffd9a0', 1.9);
  key.position.set(-2, 4, 2);
  scene.add(key);
  const bounce = new THREE.DirectionalLight('#c0392b', 0.8);
  bounce.position.set(2, -1, 1);
  scene.add(bounce);
  const rim = new THREE.DirectionalLight('#fff3dc', 1.2);
  rim.position.set(1, 2, -3);
  scene.add(rim);

  const drum = buildDrum();
  scene.add(drum);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clock = new THREE.Clock();
  let raf = 0;
  let spinBoost = 0;
  const frame = () => {
    const dt = clock.getDelta();
    spinBoost *= 0.96;
    drum.rotation.y += (still ? 0 : speed + spinBoost) * dt;
    renderer.render(scene, camera);
    if (!still) {
      raf = requestAnimationFrame(frame);
    }
  };
  drum.rotation.y = 0.4;
  frame();

  return {
    /** A strike: the drum spins faster for a moment (pair with sounds/trong.wav). */
    strike() {
      spinBoost = 2.2;
      if (still) {
        frame();
      }
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      pmrem.dispose();
    },
  };
}
