// NASTY — Dragon Scene
// GLB loads from root: /dragon.glb (place it in project root)

import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/DRACOLoader.js';

let scene, camera, renderer, dragon, mixer, clock;
let animationId;
let isReady = false;
const onReadyCallbacks = [];

export function onDragonReady(cb) {
  if (isReady) cb(); else onReadyCallbacks.push(cb);
}

export function initDragonScene(canvasId = 'dragon-canvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  clock = new THREE.Clock();

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050507, 0.03);

  camera = new THREE.PerspectiveCamera(45, (canvas.clientWidth || window.innerWidth) / (canvas.clientHeight || window.innerHeight), 0.1, 100);
  camera.position.set(0, 1.5, 7);
  camera.lookAt(0, 1, 0);

  scene.add(new THREE.AmbientLight(0x1a1010, 0.4));
  const key = new THREE.DirectionalLight(0xffd280, 2.5);
  key.position.set(3, 5, 3); key.castShadow = true; scene.add(key);
  const rim = new THREE.DirectionalLight(0xff4400, 1.8);
  rim.position.set(-4, 2, -5); scene.add(rim);
  const fill = new THREE.PointLight(0x00aa44, 1.2, 15);
  fill.position.set(0, -2, 2); scene.add(fill);
  const spot = new THREE.SpotLight(0xffeaa0, 3, 20, Math.PI / 6, 0.5, 1);
  spot.position.set(0, 8, 2); spot.target.position.set(0, 1, 0);
  scene.add(spot); scene.add(spot.target);

  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://unpkg.com/three@0.158.0/examples/jsm/libs/draco/');
  loader.setDRACOLoader(draco);

  const loadBar = document.getElementById('dragon-load-bar');
  const loadWrap = document.getElementById('dragon-load-wrap');

  // Dragon GLB lives at project root — /dragon.glb
  loader.load(
    '/dragon.glb',
    (gltf) => {
      dragon = gltf.scene;
      dragon.scale.setScalar(1.4);
      dragon.position.set(0, -0.5, 0);
      dragon.rotation.y = -Math.PI * 0.1;
      dragon.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true; child.receiveShadow = true;
          if (child.material) { child.material.metalness = 0.7; child.material.roughness = 0.3; }
        }
      });
      scene.add(dragon);
      if (gltf.animations?.length) {
        mixer = new THREE.AnimationMixer(dragon);
        const action = mixer.clipAction(gltf.animations[0]);
        action.setLoop(THREE.LoopRepeat, Infinity); action.play();
      }
      if (loadBar) loadBar.style.width = '100%';
      if (loadWrap) setTimeout(() => { loadWrap.style.opacity = '0'; loadWrap.style.transition = 'opacity .5s'; setTimeout(() => loadWrap.style.display = 'none', 600); }, 1000);
      isReady = true;
      onReadyCallbacks.forEach(cb => cb());
    },
    (progress) => { if (progress.total > 0 && loadBar) loadBar.style.width = `${(progress.loaded / progress.total) * 100}%`; },
    (err) => {
      console.warn('[NASTY] dragon.glb not found at /dragon.glb:', err.message);
      if (loadWrap) { loadWrap.innerHTML = '<span style="font-size:10px;color:var(--text-muted);letter-spacing:.08em">Add dragon.glb to project root</span>'; }
      loadFallback();
    }
  );

  new ResizeObserver(() => {
    if (!canvas) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }).observe(canvas.parentElement || canvas);

  animate();
  return scene;
}

function animate() {
  animationId = requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();
  if (mixer) mixer.update(delta);
  if (dragon && !mixer) {
    dragon.position.y = -0.5 + Math.sin(elapsed * 0.8) * 0.12;
    dragon.rotation.y = -Math.PI * 0.1 + Math.sin(elapsed * 0.4) * 0.08;
  }
  if (camera) {
    camera.position.x = Math.sin(elapsed * 0.2) * 0.3;
    camera.position.y = 1.5 + Math.cos(elapsed * 0.15) * 0.1;
    camera.lookAt(0, 1, 0);
  }
  renderer?.render(scene, camera);
}

export function playDragonEntrance() {
  if (!dragon) return;
  dragon.position.y = -8; dragon.scale.setScalar(0.1); dragon.rotation.y = Math.PI;
  let t = 0;
  const rise = setInterval(() => {
    t += 0.02;
    const e = 1 - Math.pow(1 - t, 4);
    dragon.position.y = -8 + 7.5 * e; dragon.scale.setScalar(0.1 + 1.3 * e); dragon.rotation.y = Math.PI - Math.PI * 1.1 * e;
    if (t >= 1) { clearInterval(rise); dragon.position.y = -0.5; dragon.scale.setScalar(1.4); dragon.rotation.y = -Math.PI * 0.1; }
  }, 16);
}

export function triggerFireBreath() {
  if (!scene) return;
  const geo = new THREE.SphereGeometry(0.1, 8, 8);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.9 });
  const fb = new THREE.Mesh(geo, mat); fb.position.set(0.5, 1.2, 2); scene.add(fb);
  let t = 0;
  const fire = setInterval(() => { t += 0.04; fb.position.z += 0.15; fb.scale.setScalar(1 + t * 3); mat.opacity = Math.max(0, 0.9 - t * 1.5); if (t >= 1) { clearInterval(fire); scene.remove(fb); } }, 16);
}

function loadFallback() {
  const geo = new THREE.IcosahedronGeometry(1.5, 2);
  const mat = new THREE.MeshStandardMaterial({ color: 0x1a0a00, metalness: 0.9, roughness: 0.2, emissive: 0x440000, emissiveIntensity: 0.3 });
  dragon = new THREE.Mesh(geo, mat); dragon.position.y = 0.5; dragon.castShadow = true; scene.add(dragon);
  isReady = true; onReadyCallbacks.forEach(cb => cb());
}

export function getScene() { return scene; }
export function destroyDragonScene() { cancelAnimationFrame(animationId); renderer?.dispose(); scene?.clear(); }
