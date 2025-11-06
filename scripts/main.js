import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { World } from "./world";
import { Player } from "./player";
import { Physics } from "./physics";
import { setupUI } from "./ui";
import { ModelLoader } from "./modelLoader";
import { ActorManager } from "./actorManager";
import { AnalyticsUI } from "./analyticsUI";

// UI Setup
const stats = new Stats();
document.body.appendChild(stats.dom);

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x80a0e0, 50, 75);

const world = new World();
world.generate();
scene.add(world);

const player = new Player(scene, world);
const physics = new Physics(scene);

// Initialize Actor System
const actorManager = new ActorManager(scene, world);
const analyticsUI = new AnalyticsUI(actorManager);

// Give player reference to actor manager for shooting
player.actorManager = actorManager;

// Spawn actors after world is loaded
setTimeout(() => {
  console.log("Spawning actors...");
  actorManager.spawnActorsAroundPlayer(player, 10);
  actorManager.spawnAnimals(player, 5, 5); // 5 cats and 5 dogs
  console.log("Spawned 10 actors, 5 cats, and 5 dogs");
}, 2000);

// Camera setup
const orbitCamera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
orbitCamera.position.set(24, 24, 24);
orbitCamera.layers.enable(1);

const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.update();

// Create assault rifle model
function createAssaultRifle() {
  const rifle = new THREE.Group();

  // Main body (receiver)
  const bodyGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.8);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c2c2c,
    metalness: 0.8,
    roughness: 0.3,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.castShadow = true;
  rifle.add(body);

  // Barrel
  const barrelGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
  const barrelMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.9,
    roughness: 0.2,
  });
  const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(0, 0.05, 0.55);
  barrel.castShadow = true;
  rifle.add(barrel);

  // Stock
  const stockGeometry = new THREE.BoxGeometry(0.12, 0.15, 0.3);
  const stockMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    metalness: 0.3,
    roughness: 0.7,
  });
  const stock = new THREE.Mesh(stockGeometry, stockMaterial);
  stock.position.set(0, 0, -0.45);
  stock.castShadow = true;
  rifle.add(stock);

  // Magazine
  const magGeometry = new THREE.BoxGeometry(0.08, 0.25, 0.15);
  const magMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.5,
    roughness: 0.5,
  });
  const magazine = new THREE.Mesh(magGeometry, magMaterial);
  magazine.position.set(0, -0.15, 0.1);
  magazine.castShadow = true;
  rifle.add(magazine);

  // Grip
  const gripGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.08);
  const gripMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    metalness: 0.2,
    roughness: 0.8,
  });
  const grip = new THREE.Mesh(gripGeometry, gripMaterial);
  grip.position.set(0, -0.1, -0.05);
  grip.castShadow = true;
  rifle.add(grip);

  // Scope
  const scopeGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8);
  const scopeMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.9,
    roughness: 0.1,
  });
  const scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
  scope.rotation.z = Math.PI / 2;
  scope.position.set(0, 0.12, 0.1);
  rifle.add(scope);

  return rifle;
}

const modelLoader = new ModelLoader((models) => {
  // Replace pickaxe with assault rifle
  const rifle = createAssaultRifle();
  player.setTool(rifle);
  player.tool.container.position.set(0.4, -0.3, -0.3);
  player.tool.container.scale.set(1, 1, 1);
  player.tool.container.rotation.z = Math.PI / 4;
  player.tool.container.rotation.y = Math.PI;
});

let sun;
function setupLights() {
  sun = new THREE.DirectionalLight();
  sun.intensity = 1.5;
  sun.position.set(50, 50, 50);
  sun.castShadow = true;

  // Set the size of the sun's shadow box
  sun.shadow.camera.left = -40;
  sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 40;
  sun.shadow.camera.bottom = -40;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 200;
  sun.shadow.bias = -0.0001;
  sun.shadow.mapSize = new THREE.Vector2(2048, 2048);
  scene.add(sun);
  scene.add(sun.target);

  const ambient = new THREE.AmbientLight();
  ambient.intensity = 0.2;
  scene.add(ambient);
}

// Add keyboard controls for actor spawning
document.addEventListener("keydown", (event) => {
  if (event.code === "KeyN") {
    // Spawn new actor near player
    const position = player.position.clone();
    position.x += (Math.random() - 0.5) * 10;
    position.z += (Math.random() - 0.5) * 10;
    position.y += 5;

    const types = [
      "wanderer",
      "collector",
      "builder",
      "follower",
      "cat",
      "dog",
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    actorManager.spawnActor(type, position);
    console.log(`Spawned ${type} near player`);
  }

  if (event.code === "KeyB") {
    // Spawn a cat
    const position = player.position.clone();
    position.x += (Math.random() - 0.5) * 8;
    position.z += (Math.random() - 0.5) * 8;
    position.y += 5;
    actorManager.spawnActor("cat", position);
    console.log("Spawned cat near player 🐱");
  }

  if (event.code === "KeyV") {
    // Spawn a dog
    const position = player.position.clone();
    position.x += (Math.random() - 0.5) * 8;
    position.z += (Math.random() - 0.5) * 8;
    position.y += 5;
    actorManager.spawnActor("dog", position);
    console.log("Spawned dog near player 🐶");
  }

  if (event.code === "KeyG") {
    // Spawn BOSS
    if (!actorManager.hasBoss()) {
      actorManager.spawnBoss(player);
      showBossWarning();
    } else {
      console.log("Boss already exists!");
    }
  }

  if (event.code === "KeyM") {
    // Toggle analytics panel
    analyticsUI.toggle();
  }

  if (event.code === "KeyC") {
    // Clear all actors
    actorManager.clear();
    console.log("Cleared all actors");
  }
});

// Boss warning overlay
function showBossWarning() {
  const warningDiv = document.createElement("div");
  warningDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(139, 0, 0, 0.95);
    color: white;
    padding: 30px 50px;
    border-radius: 15px;
    font-size: 36px;
    font-weight: bold;
    z-index: 9999;
    text-align: center;
    border: 4px solid #FF0000;
    box-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
    animation: pulse 1s infinite;
  `;
  warningDiv.innerHTML =
    '⚠️ WARNING ⚠️<br><span style="font-size: 24px;">Boss Approaching!</span><br><span style="font-size: 18px;">Survive or Die!</span>';
  document.body.appendChild(warningDiv);

  // Add pulse animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes pulse {
      0%, 100% { transform: translate(-50%, -50%) scale(1); }
      50% { transform: translate(-50%, -50%) scale(1.05); }
    }
  `;
  document.head.appendChild(style);

  setTimeout(() => {
    document.body.removeChild(warningDiv);
  }, 3000);
}

// Render loop
let previousTime = performance.now();
function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const dt = (currentTime - previousTime) / 1000;

  // Only update physics when player controls are locked
  if (player.controls.isLocked) {
    physics.update(dt, player, world);
    player.update(world);
    world.update(player);

    // Update actors
    actorManager.update(dt);

    // Update boss info display
    updateBossInfo();

    // Position the sun relative to the player
    sun.position.copy(player.camera.position);
    sun.position.sub(new THREE.Vector3(-50, -50, -50));
    sun.target.position.copy(player.camera.position);

    // Update position of the orbit camera to track player
    orbitCamera.position
      .copy(player.position)
      .add(new THREE.Vector3(16, 16, 16));
    controls.target.copy(player.position);
  }

  renderer.render(
    scene,
    player.controls.isLocked ? player.camera : orbitCamera
  );
  stats.update();

  previousTime = currentTime;
}

// Boss info display
function updateBossInfo() {
  let bossInfoDiv = document.getElementById("boss-info");

  if (!bossInfoDiv) {
    bossInfoDiv = document.createElement("div");
    bossInfoDiv.id = "boss-info";
    bossInfoDiv.style.cssText = `
      position: fixed;
      top: 100px;
      left: 20px;
      background: rgba(139, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      z-index: 1000;
      border: 2px solid #FF0000;
      display: none;
    `;
    document.body.appendChild(bossInfoDiv);
  }

  const boss = actorManager.getBoss();

  if (boss && boss.health > 0) {
    const distance = player.position.distanceTo(boss.position);
    const healthPercent = ((boss.health / boss.maxHealth) * 100).toFixed(0);

    bossInfoDiv.style.display = "block";
    bossInfoDiv.innerHTML = `
      <div style="font-size: 16px; font-weight: bold; color: #FF0000;">👹 ${
        boss.name
      }</div>
      <div>Health: ${boss.health}/${boss.maxHealth} (${healthPercent}%)</div>
      <div>Distance: ${distance.toFixed(1)}m</div>
      <div>Behavior: <span style="color: #FFD700;">${
        boss.currentBehavior
      }</span></div>
      ${
        boss.isEnraged
          ? '<div style="color: #FF0000; font-weight: bold;">🔥 ENRAGED! 🔥</div>'
          : ""
      }
      <div style="margin-top: 5px; font-size: 11px; color: #aaa;">Attack Range: ${
        boss.attackRange
      }m</div>
    `;
  } else {
    bossInfoDiv.style.display = "none";
  }
}

window.addEventListener("resize", () => {
  // Resize camera aspect ratio and renderer size to the new window size
  orbitCamera.aspect = window.innerWidth / window.innerHeight;
  orbitCamera.updateProjectionMatrix();
  player.camera.aspect = window.innerWidth / window.innerHeight;
  player.camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

setupUI(world, player, physics, scene);
setupLights();
animate();

// Add help text to overlay
const overlay = document.getElementById("instructions");
if (overlay) {
  overlay.innerHTML += `<br><br>
  <span style="color: #4CAF50; font-weight: bold;">ACTOR CONTROLS:</span><br>
  N - Spawn Random Actor<br>
  B - Spawn Cat 🐱<br>
  V - Spawn Dog 🐶<br>
  <span style="color: #FF0000; font-weight: bold;">G - Spawn BOSS 👹</span><br>
  M - Toggle Analytics<br>
  C - Clear All Actors<br>
  <br>
  <span style="color: #FF0000; font-weight: bold;">🔫 LEFT CLICK - SHOOT!</span><br>
  <span style="color: #FFD700; font-weight: bold;">Boss takes 16 bullets to kill!</span><br>
  `;
}

console.log("=== TERRAVERSE ACTOR DYNAMICS SYSTEM ===");
console.log("Extra-Lab-3: Interaction Analysis Enabled");
console.log("Controls:");
console.log("  N - Spawn random actor");
console.log("  B - Spawn cat 🐱");
console.log("  V - Spawn dog 🐶");
console.log("  G - Spawn BOSS 👹 (16 bullets to kill)");
console.log("  M - Toggle analytics dashboard");
console.log("  C - Clear all actors");
console.log("  LEFT CLICK - Shoot assault rifle");
console.log(
  "Actor types: Wanderer, Collector, Builder, Follower, Cat, Dog, BOSS"
);
