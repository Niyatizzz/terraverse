import * as THREE from 'three';
import { Actor } from './actor';
import { blocks } from './blocks';

/**
 * Wanderer - Randomly explores the world
 */
export class Wanderer extends Actor {
  constructor(scene, world, position) {
    super(scene, world, position);
    this.type = 'wanderer';
    this.speed = 3;
    this.wanderRadius = 20;
    this.originPoint = position.clone();
    this.addAccessory();
  }
  
  getColor() {
    return 0x4CAF50; // Green
  }
  
  addAccessory() {
    // Add a hat to wanderers
    const hatGeometry = new THREE.ConeGeometry(0.25, 0.3, 8);
    const hatMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const hat = new THREE.Mesh(hatGeometry, hatMaterial);
    hat.position.y = 1.7;
    hat.castShadow = true;
    this.mesh.add(hat);
  }
  
  executeBehavior(dt) {
    if (this.behaviorTimer > 3 || this.velocity.length() < 0.1) {
      // Choose new random point within wander radius
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
    
    // Interact with nearby actors
    if (this.nearbyActors.length > 0 && Math.random() < 0.01) {
      const nearestActor = this.nearbyActors[0];
      this.interactWith(nearestActor);
      this.currentBehavior = 'socializing';
    }
  }
}

/**
 * Collector - Collects resources from the world
 */
export class Collector extends Actor {
  constructor(scene, world, position) {
    super(scene, world, position);
    this.type = 'collector';
    this.speed = 2.5;
    this.inventory = [];
    this.maxInventory = 10;
    this.searchRadius = 15;
    this.addAccessory();
  }
  
  getColor() {
    return 0x2196F3; // Blue
  }
  
  addAccessory() {
    // Add a backpack to collectors
    const backpackGeometry = new THREE.BoxGeometry(0.3, 0.35, 0.2);
    const backpackMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const backpack = new THREE.Mesh(backpackGeometry, backpackMaterial);
    backpack.position.set(0, 0.85, -0.25);
    backpack.castShadow = true;
    this.mesh.add(backpack);
  }
  
  executeBehavior(dt) {
    if (this.inventory.length >= this.maxInventory) {
      this.currentBehavior = 'inventory_full';
      this.velocity.set(0, 0, 0);
      
      // Empty inventory after some time
      if (this.behaviorTimer > 5) {
        this.inventory = [];
        this.behaviorTimer = 0;
      }
      return;
    }
    
    // Look for nearby resources
    if (this.behaviorTimer > 2) {
      const resource = this.findNearestResource();
      if (resource) {
        this.target = resource;
        this.moveTo(resource);
        this.currentBehavior = 'seeking_resource';
        
        // Collect if close enough
        if (this.position.distanceTo(resource) < 2) {
          this.collectResource(resource);
          this.target = null;
        }
      } else {
        // Wander if no resources found
        const randomTarget = new THREE.Vector3(
          this.position.x + (Math.random() - 0.5) * 10,
          this.position.y,
          this.position.z + (Math.random() - 0.5) * 10
        );
        this.moveTo(randomTarget);
        this.currentBehavior = 'searching';
      }
      
      this.behaviorTimer = 0;
    }
  }
  
  findNearestResource() {
    // Look for coal or iron ore blocks nearby
    const searchArea = 5;
    let nearest = null;
    let nearestDist = Infinity;
    
    for (let x = -searchArea; x <= searchArea; x++) {
      for (let y = -2; y <= 2; y++) {
        for (let z = -searchArea; z <= searchArea; z++) {
          const worldX = Math.floor(this.position.x + x);
          const worldY = Math.floor(this.position.y + y);
          const worldZ = Math.floor(this.position.z + z);
          
          const block = this.world.getBlock(worldX, worldY, worldZ);
          if (block && (block.id === 4 || block.id === 5)) { // Coal or Iron
            const pos = new THREE.Vector3(worldX, worldY, worldZ);
            const dist = this.position.distanceTo(pos);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearest = pos;
            }
          }
        }
      }
    }
    
    return nearest;
  }
  
  collectResource(position) {
    this.inventory.push({
      position: position.clone(),
      timestamp: performance.now()
    });
    this.interactWithBlock(position.x, position.y, position.z, 'collect');
  }
  
  getStats() {
    const stats = super.getStats();
    stats.inventory = this.inventory.length;
    return stats;
  }
}

/**
 * Builder - Places blocks to create structures
 */
export class Builder extends Actor {
  constructor(scene, world, position) {
    super(scene, world, position);
    this.type = 'builder';
    this.speed = 2;
    this.buildQueue = [];
    this.blocksPlaced = 0;
    this.buildPattern = 'tower'; // tower, wall, or house
    this.addAccessory();
  }
  
  getColor() {
    return 0xFF9800; // Orange
  }
  
  addAccessory() {
    // Add a hard hat to builders
    const hatGeometry = new THREE.CylinderGeometry(0.22, 0.25, 0.15, 8);
    const hatMaterial = new THREE.MeshStandardMaterial({ color: 0xFFEB3B });
    const hat = new THREE.Mesh(hatGeometry, hatMaterial);
    hat.position.y = 1.65;
    hat.castShadow = true;
    this.mesh.add(hat);
    
    // Add a tool belt
    const beltGeometry = new THREE.TorusGeometry(0.27, 0.05, 8, 8);
    const beltMaterial = new THREE.MeshStandardMaterial({ color: 0x795548 });
    const belt = new THREE.Mesh(beltGeometry, beltMaterial);
    belt.position.y = 0.6;
    belt.rotation.x = Math.PI / 2;
    this.mesh.add(belt);
  }
  
  executeBehavior(dt) {
    if (this.behaviorTimer > 3) {
      if (this.buildQueue.length === 0) {
        this.planConstruction();
      }
      
      if (this.buildQueue.length > 0) {
        const nextBlock = this.buildQueue[0];
        this.moveTo(new THREE.Vector3(nextBlock.x, this.position.y, nextBlock.z));
        
        // Place block if close enough
        if (this.position.distanceTo(new THREE.Vector3(nextBlock.x, nextBlock.y, nextBlock.z)) < 3) {
          this.placeBlock(nextBlock);
          this.buildQueue.shift();
        }
        
        this.currentBehavior = 'building';
      } else {
        this.currentBehavior = 'planning';
      }
      
      this.behaviorTimer = 0;
    }
  }
  
  planConstruction() {
    const baseX = Math.floor(this.position.x);
    const baseY = Math.floor(this.position.y);
    const baseZ = Math.floor(this.position.z);
    
    if (this.buildPattern === 'tower') {
      // Build a simple tower
      for (let y = 0; y < 5; y++) {
        this.buildQueue.push({ x: baseX, y: baseY + y, z: baseZ, blockId: 3 });
      }
    } else if (this.buildPattern === 'wall') {
      // Build a wall
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 3; y++) {
          this.buildQueue.push({ x: baseX + x, y: baseY + y, z: baseZ, blockId: 3 });
        }
      }
    }
  }
  
  placeBlock(blockData) {
    // Check if block position is valid
    const existing = this.world.getBlock(blockData.x, blockData.y, blockData.z);
    if (!existing || existing.id === 0) {
      this.world.addBlock(blockData.x, blockData.y, blockData.z, blockData.blockId);
      this.blocksPlaced++;
      this.interactWithBlock(blockData.x, blockData.y, blockData.z, 'build');
    }
  }
  
  getStats() {
    const stats = super.getStats();
    stats.blocksPlaced = this.blocksPlaced;
    stats.buildQueue = this.buildQueue.length;
    return stats;
  }
}

/**
 * Follower - Follows other actors
 */
export class Follower extends Actor {
  constructor(scene, world, position) {
    super(scene, world, position);
    this.type = 'follower';
    this.speed = 4;
    this.followTarget = null;
    this.followDistance = 5;
    this.addAccessory();
  }
  
  getColor() {
    return 0x9C27B0; // Purple
  }
  
  addAccessory() {
    // Add a scarf to followers
    const scarfGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.35);
    const scarfMaterial = new THREE.MeshStandardMaterial({ color: 0xE91E63 });
    const scarf = new THREE.Mesh(scarfGeometry, scarfMaterial);
    scarf.position.y = 1.1;
    scarf.castShadow = true;
    this.mesh.add(scarf);
  }
  
  executeBehavior(dt) {
    // Find actor to follow
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
        this.currentBehavior = 'near_target';
        
        if (Math.random() < 0.01) {
          this.interactWith(this.followTarget);
        }
      }
      
      // Lose target if too far
      if (distance > 30) {
        this.followTarget = null;
      }
    } else {
      // Wander while looking for target
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
}