import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { World } from "./world";
import { blocks } from "./blocks";

const CENTER_SCREEN = new THREE.Vector2();

export class Player {
  height = 1.75;
  radius = 0.5;
  maxSpeed = 5;

  jumpSpeed = 10;
  sprinting = false;
  onGround = false;

  input = new THREE.Vector3();
  velocity = new THREE.Vector3();
  #worldVelocity = new THREE.Vector3();

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  cameraHelper = new THREE.CameraHelper(this.camera);
  controls = new PointerLockControls(this.camera, document.body);
  debugCamera = false;

  raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(),
    0,
    50
  );
  selectedCoords = null;
  activeBlockId = blocks.empty.id;

  // Shooting properties
  actorManager = null; // Will be set from main.js
  bullets = [];
  maxBullets = 100;

  tool = {
    container: new THREE.Group(),
    animate: false,
    animationStart: 0,
    animationSpeed: 0.025,
    animation: null,
  };

  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.position.set(32, 32, 32);
    this.cameraHelper.visible = false;
    scene.add(this.camera);
    scene.add(this.cameraHelper);

    this.controls.addEventListener("lock", this.onCameraLock.bind(this));
    this.controls.addEventListener("unlock", this.onCameraUnlock.bind(this));

    this.camera.add(this.tool.container);

    this.raycaster.layers.set(0);
    this.camera.layers.enable(1);

    this.boundsHelper = new THREE.Mesh(
      new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
      new THREE.MeshBasicMaterial({ wireframe: true })
    );
    this.boundsHelper.visible = false;
    scene.add(this.boundsHelper);

    const selectionMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.3,
      color: 0xffffaa,
    });
    const selectionGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    this.selectionHelper = new THREE.Mesh(selectionGeometry, selectionMaterial);
    scene.add(this.selectionHelper);

    document.addEventListener("keyup", this.onKeyUp.bind(this));
    document.addEventListener("keydown", this.onKeyDown.bind(this));
    document.addEventListener("mousedown", this.onMouseDown.bind(this));
  }

  onCameraLock() {
    document.getElementById("overlay").style.visibility = "hidden";
  }

  onCameraUnlock() {
    if (!this.debugCamera) {
      document.getElementById("overlay").style.visibility = "visible";
    }
  }

  update(world) {
    this.updateBoundsHelper();
    this.updateRaycaster(world);
    this.updateBullets();

    if (this.tool.animate) {
      this.updateToolAnimation();
    }
  }

  updateRaycaster(world) {
    this.raycaster.setFromCamera(CENTER_SCREEN, this.camera);
    const intersections = this.raycaster.intersectObject(world, true);

    if (intersections.length > 0) {
      const intersection = intersections[0];
      const chunk = intersection.object.parent;
      const blockMatrix = new THREE.Matrix4();
      intersection.object.getMatrixAt(intersection.instanceId, blockMatrix);

      this.selectedCoords = chunk.position.clone();
      this.selectedCoords.applyMatrix4(blockMatrix);

      if (this.activeBlockId !== blocks.empty.id) {
        this.selectedCoords.add(intersection.normal);
      }

      this.selectionHelper.position.copy(this.selectedCoords);
      this.selectionHelper.visible = true;
    } else {
      this.selectedCoords = null;
      this.selectionHelper.visible = false;
    }
  }

  shoot() {
    if (!this.actorManager) {
      console.warn("Actor manager not set");
      return;
    }

    // Create bullet
    const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    // Position bullet at gun barrel
    bullet.position.copy(this.camera.position);

    // Set bullet direction
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    bullet.userData.velocity = direction.multiplyScalar(50);
    bullet.userData.createdAt = performance.now();

    this.scene.add(bullet);
    this.bullets.push(bullet);

    // Limit bullets
    if (this.bullets.length > this.maxBullets) {
      const oldBullet = this.bullets.shift();
      this.scene.remove(oldBullet);
      oldBullet.geometry.dispose();
      oldBullet.material.dispose();
    }

    // Gun recoil animation
    if (this.tool.container.children.length > 0) {
      const gun = this.tool.container;
      gun.position.z += 0.1;
      setTimeout(() => {
        gun.position.z -= 0.1;
      }, 50);
    }

    // Muzzle flash
    this.createMuzzleFlash();
  }

  createMuzzleFlash() {
    const flashGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.8,
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);

    flash.position.copy(this.camera.position);
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    flash.position.add(direction.multiplyScalar(1));

    this.scene.add(flash);

    setTimeout(() => {
      this.scene.remove(flash);
      flash.geometry.dispose();
      flash.material.dispose();
    }, 50);
  }

  updateBullets() {
    const bulletsToRemove = [];

    for (let i = 0; i < this.bullets.length; i++) {
      const bullet = this.bullets[i];

      // Move bullet
      bullet.position.add(
        bullet.userData.velocity.clone().multiplyScalar(0.016)
      );

      // Check collision with actors
      if (this.actorManager) {
        for (const actor of this.actorManager.actors) {
          const distance = bullet.position.distanceTo(actor.position);
          const hitRadius = actor.type === "boss" ? 2 : 1; // Bigger hitbox for boss

          if (distance < hitRadius) {
            // Hit actor!
            if (actor.type === "boss") {
              // Boss takes damage
              const isDead = actor.takeDamage(1);
              if (isDead) {
                this.actorManager.removeActor(actor.id);
              }
            } else {
              // Regular actors die instantly
              this.killActor(actor);
            }
            bulletsToRemove.push(i);
            break;
          }
        }
      }

      // Remove old bullets
      if (performance.now() - bullet.userData.createdAt > 3000) {
        bulletsToRemove.push(i);
      }

      // Remove bullets that hit terrain
      const block = this.world.getBlock(
        Math.floor(bullet.position.x),
        Math.floor(bullet.position.y),
        Math.floor(bullet.position.z)
      );
      if (block && block.id !== 0) {
        bulletsToRemove.push(i);
      }
    }

    // Remove bullets (reverse order to maintain indices)
    for (let i = bulletsToRemove.length - 1; i >= 0; i--) {
      const index = bulletsToRemove[i];
      const bullet = this.bullets[index];
      this.scene.remove(bullet);
      bullet.geometry.dispose();
      bullet.material.dispose();
      this.bullets.splice(index, 1);
    }
  }

  killActor(actor) {
    // Death effect
    this.createDeathEffect(actor.position, actor.getColor());

    // Remove actor
    if (this.actorManager) {
      this.actorManager.removeActor(actor.id);
    }

    console.log(`💀 Eliminated ${actor.name} (${actor.type})`);
  }

  createDeathEffect(position, color) {
    // Create particle explosion
    for (let i = 0; i < 20; i++) {
      const particleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const particleMaterial = new THREE.MeshBasicMaterial({ color: color });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);

      particle.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 5,
        (Math.random() - 0.5) * 5
      );
      particle.userData.velocity = velocity;
      particle.userData.lifetime = 1000;
      particle.userData.createdAt = performance.now();

      this.scene.add(particle);

      // Animate and remove particles
      const animateParticle = () => {
        const elapsed = performance.now() - particle.userData.createdAt;
        if (elapsed < particle.userData.lifetime) {
          particle.position.add(
            particle.userData.velocity.clone().multiplyScalar(0.016)
          );
          particle.userData.velocity.y -= 9.8 * 0.016;
          particle.rotation.x += 0.1;
          particle.rotation.y += 0.1;

          particle.material.opacity = 1 - elapsed / particle.userData.lifetime;
          requestAnimationFrame(animateParticle);
        } else {
          this.scene.remove(particle);
          particle.geometry.dispose();
          particle.material.dispose();
        }
      };
      animateParticle();
    }
  }

  applyInputs(dt) {
    if (this.controls.isLocked === true) {
      this.velocity.x = this.input.x * (this.sprinting ? 1.5 : 1);
      this.velocity.z = this.input.z * (this.sprinting ? 1.5 : 1);
      this.controls.moveRight(this.velocity.x * dt);
      this.controls.moveForward(this.velocity.z * dt);
      this.position.y += this.velocity.y * dt;

      if (this.position.y < 0) {
        this.position.y = 0;
        this.velocity.y = 0;
      }
    }

    document.getElementById("info-player-position").innerHTML = this.toString();
  }

  updateBoundsHelper() {
    this.boundsHelper.position.copy(this.camera.position);
    this.boundsHelper.position.y -= this.height / 2;
  }

  setTool(tool) {
    this.tool.container.clear();
    this.tool.container.add(tool);
    this.tool.container.receiveShadow = true;
    this.tool.container.castShadow = true;
  }

  updateToolAnimation() {
    if (this.tool.container.children.length > 0) {
      const t =
        this.tool.animationSpeed *
        (performance.now() - this.tool.animationStart);
      this.tool.container.children[0].rotation.y = 0.5 * Math.sin(t);
    }
  }

  get position() {
    return this.camera.position;
  }

  get worldVelocity() {
    this.#worldVelocity.copy(this.velocity);
    this.#worldVelocity.applyEuler(
      new THREE.Euler(0, this.camera.rotation.y, 0)
    );
    return this.#worldVelocity;
  }

  applyWorldDeltaVelocity(dv) {
    dv.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0));
    this.velocity.add(dv);
  }

  onKeyDown(event) {
    if (!this.controls.isLocked) {
      this.debugCamera = false;
      this.controls.lock();
    }

    switch (event.code) {
      case "Digit0":
      case "Digit1":
      case "Digit2":
      case "Digit3":
      case "Digit4":
      case "Digit5":
      case "Digit6":
      case "Digit7":
      case "Digit8":
        document
          .getElementById(`toolbar-${this.activeBlockId}`)
          ?.classList.remove("selected");
        document
          .getElementById(`toolbar-${event.key}`)
          ?.classList.add("selected");
        this.activeBlockId = Number(event.key);
        this.tool.container.visible = this.activeBlockId === 0;
        break;
      case "KeyW":
        this.input.z = this.maxSpeed;
        break;
      case "KeyA":
        this.input.x = -this.maxSpeed;
        break;
      case "KeyS":
        this.input.z = -this.maxSpeed;
        break;
      case "KeyD":
        this.input.x = this.maxSpeed;
        break;
      case "KeyR":
        if (this.repeat) break;
        this.position.y = 32;
        this.velocity.set(0, 0, 0);
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.sprinting = true;
        break;
      case "Space":
        if (this.onGround) {
          this.velocity.y += this.jumpSpeed;
        }
        break;
      case "F10":
        this.debugCamera = true;
        this.controls.unlock();
        break;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case "KeyW":
        this.input.z = 0;
        break;
      case "KeyA":
        this.input.x = 0;
        break;
      case "KeyS":
        this.input.z = 0;
        break;
      case "KeyD":
        this.input.x = 0;
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.sprinting = false;
        break;
    }
  }

  onMouseDown(event) {
    if (this.controls.isLocked) {
      // If tool is active (slot 0), shoot
      if (this.activeBlockId === 0) {
        this.shoot();
      } else if (this.selectedCoords) {
        // Block placement/removal
        if (this.activeBlockId === blocks.empty.id) {
          this.world.removeBlock(
            this.selectedCoords.x,
            this.selectedCoords.y,
            this.selectedCoords.z
          );
        } else {
          this.world.addBlock(
            this.selectedCoords.x,
            this.selectedCoords.y,
            this.selectedCoords.z,
            this.activeBlockId
          );
        }

        if (!this.tool.animate) {
          this.tool.animate = true;
          this.tool.animationStart = performance.now();
          clearTimeout(this.tool.animation);
          this.tool.animation = setTimeout(() => {
            this.tool.animate = false;
          }, (3 * Math.PI) / this.tool.animationSpeed);
        }
      }
    }
  }

  toString() {
    let str = "";
    str += `X: ${this.position.x.toFixed(3)} `;
    str += `Y: ${this.position.y.toFixed(3)} `;
    str += `Z: ${this.position.z.toFixed(3)}`;
    return str;
  }
}
