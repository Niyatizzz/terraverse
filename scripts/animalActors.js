import * as THREE from 'three';
import { Actor } from './actor';

/**
 * Base Animal class
 */
class Animal extends Actor {
  constructor(scene, world, position) {
    super(scene, world, position);
    this.height = 0.8; // Animals are shorter
    this.radius = 0.3;
    this.speed = 3.5;
  }
  
  // Override to create animal-specific mesh
  createMesh() {
    const animal = new THREE.Group();
    const color = this.getColor();
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.2,
      roughness: 0.8
    });
    
    // Will be overridden by subclasses
    return animal;
  }
  
  generateName() {
    // Animals get cute names
    return this.getAnimalName();
  }
  
  getAnimalName() {
    return 'Animal';
  }
}

/**
 * Cat - Wanders around, sits occasionally, meows at other actors
 */
export class Cat extends Animal {
  constructor(scene, world, position) {
    super(scene, world, position);
    this.type = 'cat';
    this.speed = 4;
    this.isSitting = false;
    this.sitTimer = 0;
    this.wanderRadius = 15;
    this.originPoint = position.clone();
  }
  
  getColor() {
    // Random cat colors
    const colors = [0xFFA500, 0x8B4513, 0x000000, 0xFFFFFF, 0x808080, 0xFF6347];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  getAnimalName() {
    const names = ['Mittens', 'Whiskers', 'Shadow', 'Luna', 'Oliver', 'Simba', 'Bella', 'Felix', 'Milo', 'Nala'];
    return names[Math.floor(Math.random() * names.length)];
  }
  
  createMesh() {
    const cat = new THREE.Group();
    const color = this.getColor();
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.2,
      roughness: 0.8
    });
    
    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.3, 0.25, 0.5);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.y = 0.3;
    body.castShadow = true;
    cat.add(body);
    
    // Head
    const headGeometry = new THREE.BoxGeometry(0.25, 0.2, 0.25);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.set(0, 0.35, 0.3);
    head.castShadow = true;
    cat.add(head);
    
    // Ears
    const earGeometry = new THREE.ConeGeometry(0.08, 0.15, 4);
    const leftEar = new THREE.Mesh(earGeometry, material);
    leftEar.position.set(-0.1, 0.5, 0.3);
    leftEar.castShadow = true;
    cat.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, material);
    rightEar.position.set(0.1, 0.5, 0.3);
    rightEar.castShadow = true;
    cat.add(rightEar);
    
    // Eyes
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
    const eyeGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.08, 0.38, 0.42);
    cat.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.08, 0.38, 0.42);
    cat.add(rightEye);
    
    // Nose
    const noseGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    const noseMaterial = new THREE.MeshBasicMaterial({ color: 0xFF69B4 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 0.32, 0.45);
    cat.add(nose);
    
    // Tail
    const tailGeometry = new THREE.CylinderGeometry(0.04, 0.02, 0.4, 8);
    const tail = new THREE.Mesh(tailGeometry, material);
    tail.position.set(0, 0.35, -0.25);
    tail.rotation.x = Math.PI / 4;
    tail.castShadow = true;
    cat.add(tail);
    this.tail = tail; // Store for animation
    
    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8);
    
    const frontLeftLeg = new THREE.Mesh(legGeometry, material);
    frontLeftLeg.position.set(-0.1, 0.1, 0.15);
    cat.add(frontLeftLeg);
    this.frontLeftLeg = frontLeftLeg;
    
    const frontRightLeg = new THREE.Mesh(legGeometry, material);
    frontRightLeg.position.set(0.1, 0.1, 0.15);
    cat.add(frontRightLeg);
    this.frontRightLeg = frontRightLeg;
    
    const backLeftLeg = new THREE.Mesh(legGeometry, material);
    backLeftLeg.position.set(-0.1, 0.1, -0.15);
    cat.add(backLeftLeg);
    this.backLeftLeg = backLeftLeg;
    
    const backRightLeg = new THREE.Mesh(legGeometry, material);
    backRightLeg.position.set(0.1, 0.1, -0.15);
    cat.add(backRightLeg);
    this.backRightLeg = backRightLeg;
    
    return cat;
  }
  
  executeBehavior(dt) {
    // Sitting behavior
    if (this.isSitting) {
      this.velocity.set(0, 0, 0);
      this.currentBehavior = 'sitting';
      this.sitTimer += dt;
      
      if (this.sitTimer > 5) {
        this.isSitting = false;
        this.sitTimer = 0;
      }
      return;
    }
    
    // Random sitting
    if (Math.random() < 0.005) {
      this.isSitting = true;
      return;
    }
    
    // Wander behavior
    if (this.behaviorTimer > 3 || this.velocity.length() < 0.1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * this.wanderRadius;
      const target = new THREE.Vector3(
        this.originPoint.x + Math.cos(angle) * distance,
        this.position.y,
        this.originPoint.z + Math.sin(angle) * distance
      );
      
      this.moveTo(target);
      this.behaviorTimer = 0;
      this.currentBehavior = 'wandering';
    }
    
    // Meow at nearby actors
    if (this.nearbyActors.length > 0 && Math.random() < 0.01) {
      const nearestActor = this.nearbyActors[0];
      this.interactWith(nearestActor);
      this.currentBehavior = 'meowing';
    }
  }
  
  animateWalking(dt) {
    const speed = this.velocity.length();
    const time = performance.now() * 0.005 * speed;
    
    // Walking animation for legs
    if (this.frontLeftLeg && this.frontRightLeg && this.backLeftLeg && this.backRightLeg) {
      this.frontLeftLeg.position.y = 0.1 + Math.abs(Math.sin(time)) * 0.05;
      this.frontRightLeg.position.y = 0.1 + Math.abs(Math.sin(time + Math.PI)) * 0.05;
      this.backLeftLeg.position.y = 0.1 + Math.abs(Math.sin(time + Math.PI)) * 0.05;
      this.backRightLeg.position.y = 0.1 + Math.abs(Math.sin(time)) * 0.05;
    }
    
    // Tail wagging
    if (this.tail) {
      this.tail.rotation.z = Math.sin(time * 2) * 0.3;
    }
    
    // Body bob
    this.mesh.position.y += Math.abs(Math.sin(time * 2)) * 0.02;
  }
  
  resetPose() {
    if (this.frontLeftLeg) this.frontLeftLeg.position.y = 0.1;
    if (this.frontRightLeg) this.frontRightLeg.position.y = 0.1;
    if (this.backLeftLeg) this.backLeftLeg.position.y = 0.1;
    if (this.backRightLeg) this.backRightLeg.position.y = 0.1;
    if (this.tail) this.tail.rotation.z = 0;
  }
}

/**
 * Dog - Follows actors, wags tail, barks, very friendly
 */
export class Dog extends Animal {
  constructor(scene, world, position) {
    super(scene, world, position);
    this.type = 'dog';
    this.speed = 5;
    this.followTarget = null;
    this.followDistance = 3;
    this.tailWagSpeed = 0.1;
  }
  
  getColor() {
    // Random dog colors
    const colors = [0x8B4513, 0xD2691E, 0x000000, 0xFFFFFF, 0xF5DEB3, 0xA0522D];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  getAnimalName() {
    const names = ['Buddy', 'Max', 'Charlie', 'Rocky', 'Cooper', 'Duke', 'Bear', 'Zeus', 'Toby', 'Jack'];
    return names[Math.floor(Math.random() * names.length)];
  }
  
  createMesh() {
    const dog = new THREE.Group();
    const color = this.getColor();
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.2,
      roughness: 0.8
    });
    
    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.35, 0.3, 0.6);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.y = 0.35;
    body.castShadow = true;
    dog.add(body);
    
    // Head
    const headGeometry = new THREE.BoxGeometry(0.3, 0.25, 0.3);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.set(0, 0.4, 0.35);
    head.castShadow = true;
    dog.add(head);
    
    // Snout
    const snoutGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.2);
    const snout = new THREE.Mesh(snoutGeometry, material);
    snout.position.set(0, 0.35, 0.5);
    snout.castShadow = true;
    dog.add(snout);
    
    // Ears (floppy)
    const earGeometry = new THREE.BoxGeometry(0.12, 0.2, 0.05);
    const leftEar = new THREE.Mesh(earGeometry, material);
    leftEar.position.set(-0.15, 0.45, 0.35);
    leftEar.rotation.z = -0.3;
    leftEar.castShadow = true;
    dog.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, material);
    rightEar.position.set(0.15, 0.45, 0.35);
    rightEar.rotation.z = 0.3;
    rightEar.castShadow = true;
    dog.add(rightEar);
    
    // Eyes
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const eyeGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 0.43, 0.48);
    dog.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 0.43, 0.48);
    dog.add(rightEye);
    
    // Nose
    const noseGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const noseMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 0.35, 0.6);
    dog.add(nose);
    
    // Tail (upright and wagging)
    const tailGeometry = new THREE.CylinderGeometry(0.05, 0.03, 0.5, 8);
    const tail = new THREE.Mesh(tailGeometry, material);
    tail.position.set(0, 0.45, -0.3);
    tail.rotation.x = -Math.PI / 6;
    tail.castShadow = true;
    dog.add(tail);
    this.tail = tail; // Store for animation
    
    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.25, 8);
    
    const frontLeftLeg = new THREE.Mesh(legGeometry, material);
    frontLeftLeg.position.set(-0.13, 0.125, 0.2);
    dog.add(frontLeftLeg);
    this.frontLeftLeg = frontLeftLeg;
    
    const frontRightLeg = new THREE.Mesh(legGeometry, material);
    frontRightLeg.position.set(0.13, 0.125, 0.2);
    dog.add(frontRightLeg);
    this.frontRightLeg = frontRightLeg;
    
    const backLeftLeg = new THREE.Mesh(legGeometry, material);
    backLeftLeg.position.set(-0.13, 0.125, -0.2);
    dog.add(backLeftLeg);
    this.backLeftLeg = backLeftLeg;
    
    const backRightLeg = new THREE.Mesh(legGeometry, material);
    backRightLeg.position.set(0.13, 0.125, -0.2);
    dog.add(backRightLeg);
    this.backRightLeg = backRightLeg;
    
    return dog;
  }
  
  executeBehavior(dt) {
    // Find someone to follow
    if (!this.followTarget && this.nearbyActors.length > 0) {
      this.followTarget = this.nearbyActors[0];
    }
    
    if (this.followTarget) {
      const distance = this.position.distanceTo(this.followTarget.position);
      
      if (distance > this.followDistance) {
        this.moveTo(this.followTarget.position);
        this.currentBehavior = 'following';
      } else {
        this.velocity.multiplyScalar(0.5);
        this.currentBehavior = 'happy';
        
        if (Math.random() < 0.01) {
          this.interactWith(this.followTarget);
          this.currentBehavior = 'barking';
        }
      }
      
      // Lose target if too far
      if (distance > 30) {
        this.followTarget = null;
      }
    } else {
      // Wander while looking for someone to follow
      if (this.behaviorTimer > 2) {
        const randomTarget = new THREE.Vector3(
          this.position.x + (Math.random() - 0.5) * 10,
          this.position.y,
          this.position.z + (Math.random() - 0.5) * 10
        );
        this.moveTo(randomTarget);
        this.currentBehavior = 'searching';
        this.behaviorTimer = 0;
      }
    }
  }
  
  animateWalking(dt) {
    const speed = this.velocity.length();
    const time = performance.now() * 0.006 * speed;
    
    // Walking animation for legs
    if (this.frontLeftLeg && this.frontRightLeg && this.backLeftLeg && this.backRightLeg) {
      this.frontLeftLeg.position.y = 0.125 + Math.abs(Math.sin(time)) * 0.06;
      this.frontRightLeg.position.y = 0.125 + Math.abs(Math.sin(time + Math.PI)) * 0.06;
      this.backLeftLeg.position.y = 0.125 + Math.abs(Math.sin(time + Math.PI)) * 0.06;
      this.backRightLeg.position.y = 0.125 + Math.abs(Math.sin(time)) * 0.06;
    }
    
    // Excited tail wagging (dogs wag their tails a lot!)
    if (this.tail) {
      this.tail.rotation.z = Math.sin(time * 4) * 0.5;
    }
    
    // Body bob
    this.mesh.position.y += Math.abs(Math.sin(time * 2)) * 0.03;
  }
  
  resetPose() {
    if (this.frontLeftLeg) this.frontLeftLeg.position.y = 0.125;
    if (this.frontRightLeg) this.frontRightLeg.position.y = 0.125;
    if (this.backLeftLeg) this.backLeftLeg.position.y = 0.125;
    if (this.backRightLeg) this.backRightLeg.position.y = 0.125;
    
    // Dogs always wag their tails even when idle!
    if (this.tail) {
      const idleTime = performance.now() * 0.002;
      this.tail.rotation.z = Math.sin(idleTime) * 0.2;
    }
  }
}