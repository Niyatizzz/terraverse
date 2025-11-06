import * as THREE from 'three';

/**
 * Base Actor class - represents any entity in the world (NPCs, animals, etc.)
 */
export class Actor {
  constructor(scene, world, position = new THREE.Vector3()) {
    this.scene = scene;
    this.world = world;
    this.position = position.clone();
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3(0, 0, 1);
    
    // Actor properties
    this.id = this.generateId();
    this.name = this.generateName(); // Generate unique name
    this.type = 'base';
    this.speed = 2;
    this.height = 1.5;
    this.radius = 0.4;
    this.health = 100;
    this.energy = 100;
    this.maxEnergy = 100;
    
    // Behavior properties
    this.target = null;
    this.path = [];
    this.currentBehavior = 'idle';
    this.behaviorTimer = 0;
    
    // Interaction tracking
    this.interactions = [];
    this.nearbyActors = [];
    this.blocksInteracted = [];
    this.totalDistance = 0;
    this.lastPosition = this.position.clone();
    
    // Visual representation
    this.mesh = this.createMesh();
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);
    
    // Label for debugging
    this.createLabel();
  }
  
  generateId() {
    return `actor_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateName() {
    // List of names to choose from
    const names = [
      'Clarice Starling', 'James Bond', 'John Wick', 'Arthur Morgan', 'Anakin Skywalker',
      'Lara Croft','Agent 47',
      'Bruce Wayne', 'Nathan Drake', ' Aragorn', 'Legolas', 'Michael Corleone',
    ];
    return names[Math.floor(Math.random() * names.length)];
  }
  
  createMesh() {
    // Create a human-like character mesh
    const character = new THREE.Group();
    
    const color = this.getColor();
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.2,
      roughness: 0.8
    });
    
    // Body (torso)
    const bodyGeometry = new THREE.BoxGeometry(0.5, 0.7, 0.3);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.y = 0.85;
    body.castShadow = true;
    character.add(body);
    
    // Head
    const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = 1.4;
    head.castShadow = true;
    character.add(head);
    
    // Eyes
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.05);
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 1.45, 0.18);
    character.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 1.45, 0.18);
    character.add(rightEye);
    
    // Pupils
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const pupilGeometry = new THREE.BoxGeometry(0.04, 0.04, 0.03);
    
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-0.1, 1.45, 0.2);
    character.add(leftPupil);
    
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.1, 1.45, 0.2);
    character.add(rightPupil);
    
    // Arms
    const armGeometry = new THREE.BoxGeometry(0.15, 0.6, 0.15);
    
    const leftArm = new THREE.Mesh(armGeometry, material);
    leftArm.position.set(-0.35, 0.85, 0);
    leftArm.castShadow = true;
    character.add(leftArm);
    this.leftArm = leftArm; // Store for animation
    
    const rightArm = new THREE.Mesh(armGeometry, material);
    rightArm.position.set(0.35, 0.85, 0);
    rightArm.castShadow = true;
    character.add(rightArm);
    this.rightArm = rightArm; // Store for animation
    
    // Legs
    const legGeometry = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    
    const leftLeg = new THREE.Mesh(legGeometry, material);
    leftLeg.position.set(-0.15, 0.3, 0);
    leftLeg.castShadow = true;
    character.add(leftLeg);
    this.leftLeg = leftLeg; // Store for animation
    
    const rightLeg = new THREE.Mesh(legGeometry, material);
    rightLeg.position.set(0.15, 0.3, 0);
    rightLeg.castShadow = true;
    character.add(rightLeg);
    this.rightLeg = rightLeg; // Store for animation
    
    character.castShadow = true;
    character.receiveShadow = true;
    
    return character;
  }
  
  createLabel() {
    // Create a sprite label above the actor with their name
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.roundRect(10, 10, 236, 44, 8);
    ctx.fill();
    
    // Name text (larger and bold)
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, 128, 38);
    
    // Type text (smaller, below name)
    ctx.fillStyle = this.getColorHex();
    ctx.font = '14px Arial';
    ctx.fillText(this.type.toUpperCase(), 128, 52);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    this.label = new THREE.Sprite(material);
    this.label.scale.set(2.5, 0.625, 1);
    this.mesh.add(this.label);
    this.label.position.y = 2.2; // Above the head
    
    // Make label always face camera
    this.label.renderOrder = 1000;
  }
  
  getColorHex() {
    const color = this.getColor();
    return '#' + color.toString(16).padStart(6, '0');
  }
  
  getColor() {
    return 0x00ff00; // Override in subclasses
  }
  
  update(dt, actors) {
    // Update behavior timer
    this.behaviorTimer += dt;
    
    // Find nearby actors
    this.updateNearbyActors(actors);
    
    // Execute current behavior
    this.executeBehavior(dt);
    
    // Apply physics
    this.applyPhysics(dt);
    
    // Update energy
    this.updateEnergy(dt);
    
    // Track distance traveled
    this.totalDistance += this.position.distanceTo(this.lastPosition);
    this.lastPosition.copy(this.position);
    
    // Update mesh position
    this.mesh.position.copy(this.position);
    
    // Face movement direction
    if (this.velocity.length() > 0.1) {
      const angle = Math.atan2(this.velocity.x, this.velocity.z);
      this.mesh.rotation.y = angle;
      
      // Animate walking
      this.animateWalking(dt);
    } else {
      // Reset to idle pose
      this.resetPose();
    }
  }
  
  animateWalking(dt) {
    // Create walking animation by swinging arms and legs
    const speed = this.velocity.length();
    const time = performance.now() * 0.003 * speed;
    
    // Swing arms opposite to legs
    if (this.leftArm && this.rightArm) {
      this.leftArm.rotation.x = Math.sin(time) * 0.5;
      this.rightArm.rotation.x = Math.sin(time + Math.PI) * 0.5;
    }
    
    // Swing legs
    if (this.leftLeg && this.rightLeg) {
      this.leftLeg.rotation.x = Math.sin(time + Math.PI) * 0.3;
      this.rightLeg.rotation.x = Math.sin(time) * 0.3;
    }
    
    // Add slight body bob
    this.mesh.position.y += Math.abs(Math.sin(time * 2)) * 0.05;
  }
  
  resetPose() {
    // Reset limbs to neutral position
    if (this.leftArm) this.leftArm.rotation.x = 0;
    if (this.rightArm) this.rightArm.rotation.x = 0;
    if (this.leftLeg) this.leftLeg.rotation.x = 0;
    if (this.rightLeg) this.rightLeg.rotation.x = 0;
  }
  
  updateNearbyActors(actors) {
    this.nearbyActors = actors.filter(actor => {
      if (actor.id === this.id) return false;
      return this.position.distanceTo(actor.position) < 10;
    });
  }
  
  executeBehavior(dt) {
    // Override in subclasses
  }
  
  applyPhysics(dt) {
    // Apply gravity
    if (this.position.y > 0) {
      this.velocity.y -= 20 * dt;
    }
    
    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(dt));
    
    // Ground collision
    const groundY = this.getGroundHeight();
    if (this.position.y < groundY) {
      this.position.y = groundY;
      this.velocity.y = 0;
    }
    
    // Damping
    this.velocity.x *= 0.9;
    this.velocity.z *= 0.9;
  }
  
  getGroundHeight() {
    // Simple ground detection - check world for solid block
    const checkY = Math.floor(this.position.y);
    for (let y = checkY; y >= 0; y--) {
      const block = this.world.getBlock(
        Math.floor(this.position.x),
        y,
        Math.floor(this.position.z)
      );
      if (block && block.id !== 0) {
        return y + 1;
      }
    }
    return 0;
  }
  
  updateEnergy(dt) {
    // Energy depletes with movement
    const speed = this.velocity.length();
    this.energy -= speed * dt * 0.5;
    
    // Regenerate energy when idle
    if (speed < 0.1) {
      this.energy = Math.min(this.maxEnergy, this.energy + dt * 5);
    }
    
    this.energy = Math.max(0, this.energy);
  }
  
  moveTo(target) {
    const direction = new THREE.Vector3()
      .subVectors(target, this.position)
      .normalize();
    
    this.velocity.x = direction.x * this.speed;
    this.velocity.z = direction.z * this.speed;
    this.direction.copy(direction);
  }
  
  interactWith(actor) {
    this.interactions.push({
      timestamp: performance.now(),
      actorId: actor.id,
      actorType: actor.type,
      type: 'meet',
      position: this.position.clone()
    });
  }
  
  interactWithBlock(x, y, z, action) {
    this.blocksInteracted.push({
      timestamp: performance.now(),
      position: { x, y, z },
      action: action
    });
  }
  
  getStats() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      behavior: this.currentBehavior,
      position: {
        x: this.position.x.toFixed(2),
        y: this.position.y.toFixed(2),
        z: this.position.z.toFixed(2)
      },
      health: this.health.toFixed(0),
      energy: this.energy.toFixed(0),
      totalDistance: this.totalDistance.toFixed(2),
      interactions: this.interactions.length,
      blocksInteracted: this.blocksInteracted.length,
      nearbyActors: this.nearbyActors.length
    };
  }
  
  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    if (this.label) {
      this.label.material.map.dispose();
      this.label.material.dispose();
    }
  }
}