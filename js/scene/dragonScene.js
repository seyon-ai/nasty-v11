// ==========================================
// NASTY — Dragon Scene (Three.js)
// Fixed GLB path for Vercel + local dev
// ==========================================

import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/DRACOLoader.js';

let scene, camera, renderer, dragon, mixer, clock;
let animationId;
let isReady = false;
const onReadyCallbacks = [];

export function onDragonReady(cb) {
  if (isReady) cb();
  else onReadyCallbacks.push(cb);
}

// Resolve GLB path — works on Vercel AND local file system
function getDragonPath() {
  const loc = window.location.pathname;
  // If we're in /pages/ subdir, go up one level
  if (loc.includes('/pages/')) return '../assets/models/dragon.glb';
  return './assets/models/dragon.glb';
}

export function initDragonScene(canvasId = 'dragon-canvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  clock = new THREE.Clock();

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050507, 0.035);

  camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 1.5, 7);
  camera.lookAt(0, 1, 0);

  // Cinematic lighting
  scene.add(new THREE.AmbientLight(0x1a1010, 0.4));

  const keyLight = new THREE.DirectionalLight(0xffd280, 2.5);
  keyLight.position.set(3, 5, 3);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.setScalar(2048);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xff4400, 1.8);
  rimLight.position.set(-4, 2, -5);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0x00aa44, 1.2, 15);
  fillLight.position.set(0, -2, 2);
  scene.add(fillLight);

  const spot = new THREE.SpotLight(0xffeaa0, 3, 20, Math.PI / 6, 0.5, 1);
  spot.position.set(0, 8, 2);
  spot.target.position.set(0, 1, 0);
  scene.add(spot, spot.target);

  // Load dragon
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://unpkg.com/three@0.158.0/examples/jsm/libs/draco/');
  loader.setDRACOLoader(draco);

  const loadBar = document.getElementById('dragon-load-bar');
  const loadWrap = document.getElementById('dragon-load-wrap');

  const glbPath = getDragonPath();
  console.log('[NASTY] Loading dragon from:', glbPath);

  loader.load(
    glbPath,
    (gltf) => {
      dragon = gltf.scene;
      dragon.scale.setScalar(1.4);
      dragon.position.set(0, -0.5, 0);
      dragon.rotation.y = -Math.PI * 0.1;

      dragon.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.metalness = 0.7;
            child.material.roughness = 0.3;
          }
        }
      });

      scene.add(dragon);

      if (gltf.animations?.length) {
        mixer = new THREE.AnimationMixer(dragon);
        const action = mixer.clipAction(gltf.animations[0]);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.play();
      }

      if (loadBar) loadBar.style.width = '100%';
      if (loadWrap) setTimeout(() => { loadWrap.style.opacity = '0'; setTimeout(() => loadWrap.remove(), 600); }, 800);

      isReady = true;
      onReadyCallbacks.forEach(cb => cb());
    },
    (progress) => {
      if (progress.total > 0 && loadBar) {
        loadBar.style.width = `${(progress.loaded / progress.total) * 100}%`;
      }
    },
    (err) => {
      console.error('[NASTY] Dragon GLB failed to load:', err);
      if (loadWrap) loadWrap.innerHTML = '<span style="font-size:11px;color:var(--ember-bright)">Place dragon.glb in assets/models/</span>';
      loadFallbackDragon();
    }
  );

  const resizeObserver = new ResizeObserver(() => {
    if (!canvas) return;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  });
  resizeObserver.observe(canvas.parentElement || canvas);

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
  dragon.position.y = -8;
  dragon.scale.setScalar(0.1);
  dragon.rotation.y = Math.PI;

  let t = 0;
  const rise = setInterval(() => {
    t += 0.02;
    const eased = 1 - Math.pow(1 - t, 4);
    dragon.position.y = -8 + 7.5 * eased;
    dragon.scale.setScalar(0.1 + 1.3 * eased);
    dragon.rotation.y = Math.PI - Math.PI * 1.1 * eased;
    if (t >= 1) { clearInterval(rise); dragon.position.y = -0.5; dragon.scale.setScalar(1.4); dragon.rotation.y = -Math.PI * 0.1; }
  }, 16);
}

export function triggerFireBreath() {
  if (!scene) return;
  const geo = new THREE.SphereGeometry(0.1, 8, 8);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.9 });
  const fireball = new THREE.Mesh(geo, mat);
  fireball.position.set(0.5, 1.2, 2);
  scene.add(fireball);
  let t = 0;
  const fire = setInterval(() => {
    t += 0.04;
    fireball.position.z += 0.15;
    fireball.scale.setScalar(1 + t * 3);
    mat.opacity = Math.max(0, 0.9 - t * 1.5);
    if (t >= 1) { clearInterval(fire); scene.remove(fireball); }
  }, 16);
}

function loadFallbackDragon() {
  const geo = new THREE.IcosahedronGeometry(1.5, 2);
  const mat = new THREE.MeshStandardMaterial({ color: 0x1a0a00, metalness: 0.9, roughness: 0.2, emissive: 0x440000, emissiveIntensity: 0.3 });
  dragon = new THREE.Mesh(geo, mat);
  dragon.position.y = 0.5;
  dragon.castShadow = true;
  scene.add(dragon);
  isReady = true;
  onReadyCallbacks.forEach(cb => cb());
}

export function getScene() { return scene; }
export function destroyDragonScene() { cancelAnimationFrame(animationId); renderer?.dispose(); scene?.clear(); }
