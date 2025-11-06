import * as THREE from 'three';
import { Wanderer, Collector, Builder, Follower } from './actorTypes';
import { Cat, Dog } from './animalActors';
import { BossEnemy } from './bossEnemy';

/**
 * ActorManager - Manages all actors and their interactions
 */
export class ActorManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.actors = [];
    this.boss = null; // Store boss reference
    this.interactions = [];
    this.analytics = {
      totalInteractions: 0,
      totalDistance: 0,
      totalBlocksInteracted: 0,
      actorTypeCount: {},
      behaviorDistribution: {}
    };
  }
  
  /**
   * Spawn a new actor of given type at position
   */
  spawnActor(type, position, player = null) {
    let actor;
    
    switch(type) {
      case 'wanderer':
        actor = new Wanderer(this.scene, this.world, position);
        break;
      case 'collector':
        actor = new Collector(this.scene, this.world, position);
        break;
      case 'builder':
        actor = new Builder(this.scene, this.world, position);
        break;
      case 'follower':
        actor = new Follower(this.scene, this.world, position);
        break;
      case 'cat':
        actor = new Cat(this.scene, this.world, position);
        break;
      case 'dog':
        actor = new Dog(this.scene, this.world, position);
        break;
      case 'boss':
        if (!player) {
          console.error('Boss requires player reference');
          return null;
        }
        actor = new BossEnemy(this.scene, this.world, position, player);
        this.boss = actor; // Store boss reference
        break;
      default:
        console.warn(`Unknown actor type: ${type}`);
        return null;
    }
    
    this.actors.push(actor);
    this.updateAnalytics();
    return actor;
  }
  
  /**
   * Spawn boss enemy
   */
  spawnBoss(player, distance = 25) {
    // Remove existing boss if any
    if (this.boss) {
      console.log('Removing existing boss...');
      this.removeActor(this.boss.id);
    }
    
    // Spawn boss at distance from player in front
    const direction = new THREE.Vector3();
    player.camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    
    const position = new THREE.Vector3(
      player.position.x + direction.x * distance,
      player.position.y + 10, // Spawn higher to ensure it falls properly
      player.position.z + direction.z * distance
    );
    
    console.log(`Spawning boss at: ${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}`);
    console.log(`Player at: ${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}, ${player.position.z.toFixed(1)}`);
    
    const boss = this.spawnActor('boss', position, player);
    
    if (boss) {
      console.log('👹 BOSS SPAWNED! GOLIATH approaches... 👹');
      console.log(`Boss ID: ${boss.id}, Health: ${boss.health}/${boss.maxHealth}`);
    } else {
      console.error('Failed to spawn boss!');
    }
    
    return boss;
  }
  
  /**
   * Spawn multiple actors randomly around player
   */
  spawnActorsAroundPlayer(player, count = 10) {
    const types = ['wanderer', 'collector', 'builder', 'follower', 'cat', 'dog'];
    const spawnRadius = 20;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const distance = 10 + Math.random() * spawnRadius;
      
      const position = new THREE.Vector3(
        player.position.x + Math.cos(angle) * distance,
        player.position.y + 5, // Spawn above ground
        player.position.z + Math.sin(angle) * distance
      );
      
      const type = types[Math.floor(Math.random() * types.length)];
      this.spawnActor(type, position);
    }
  }
  
  /**
   * Spawn animals specifically (cats and dogs)
   */
  spawnAnimals(player, catCount = 3, dogCount = 3) {
    const spawnRadius = 15;
    
    // Spawn cats
    for (let i = 0; i < catCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 8 + Math.random() * spawnRadius;
      
      const position = new THREE.Vector3(
        player.position.x + Math.cos(angle) * distance,
        player.position.y + 5,
        player.position.z + Math.sin(angle) * distance
      );
      
      this.spawnActor('cat', position);
    }
    
    // Spawn dogs
    for (let i = 0; i < dogCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 8 + Math.random() * spawnRadius;
      
      const position = new THREE.Vector3(
        player.position.x + Math.cos(angle) * distance,
        player.position.y + 5,
        player.position.z + Math.sin(angle) * distance
      );
      
      this.spawnActor('dog', position);
    }
  }
  
  /**
   * Update all actors
   */
  update(dt) {
    // Update each actor
    for (const actor of this.actors) {
      actor.update(dt, this.actors);
    }
    
    // Check for interactions between actors
    this.checkInteractions();
    
    // Update analytics
    this.updateAnalytics();
  }
  
  /**
   * Check for actor-to-actor interactions
   */
  checkInteractions() {
    for (let i = 0; i < this.actors.length; i++) {
      for (let j = i + 1; j < this.actors.length; j++) {
        const actor1 = this.actors[i];
        const actor2 = this.actors[j];
        
        const distance = actor1.position.distanceTo(actor2.position);
        
        // If actors are very close, record interaction
        if (distance < 2) {
          this.recordInteraction(actor1, actor2, 'proximity');
        }
      }
    }
  }
  
  /**
   * Record an interaction between actors
   */
  recordInteraction(actor1, actor2, type) {
    const interaction = {
      timestamp: performance.now(),
      actor1: { id: actor1.id, type: actor1.type },
      actor2: { id: actor2.id, type: actor2.type },
      type: type,
      position: actor1.position.clone()
    };
    
    this.interactions.push(interaction);
    this.analytics.totalInteractions++;
    
    // Keep only last 1000 interactions
    if (this.interactions.length > 1000) {
      this.interactions.shift();
    }
  }
  
  /**
   * Update analytics data
   */
  updateAnalytics() {
    // Reset analytics
    this.analytics.totalDistance = 0;
    this.analytics.totalBlocksInteracted = 0;
    this.analytics.actorTypeCount = {};
    this.analytics.behaviorDistribution = {};
    
    // Aggregate data from all actors
    for (const actor of this.actors) {
      // Count by type
      this.analytics.actorTypeCount[actor.type] = 
        (this.analytics.actorTypeCount[actor.type] || 0) + 1;
      
      // Count by behavior
      this.analytics.behaviorDistribution[actor.currentBehavior] = 
        (this.analytics.behaviorDistribution[actor.currentBehavior] || 0) + 1;
      
      // Sum distances and interactions
      this.analytics.totalDistance += actor.totalDistance;
      this.analytics.totalBlocksInteracted += actor.blocksInteracted.length;
    }
  }
  
  /**
   * Get analytics data for UI
   */
  getAnalytics() {
    return {
      actorCount: this.actors.length,
      totalInteractions: this.analytics.totalInteractions,
      recentInteractions: this.interactions.slice(-10),
      totalDistance: this.analytics.totalDistance.toFixed(2),
      totalBlocksInteracted: this.analytics.totalBlocksInteracted,
      actorTypeCount: this.analytics.actorTypeCount,
      behaviorDistribution: this.analytics.behaviorDistribution,
      actorStats: this.actors.map(actor => actor.getStats())
    };
  }
  
  /**
   * Get interaction matrix (who interacted with whom)
   */
  getInteractionMatrix() {
    const matrix = {};
    
    for (const interaction of this.interactions) {
      const key = `${interaction.actor1.type}-${interaction.actor2.type}`;
      matrix[key] = (matrix[key] || 0) + 1;
    }
    
    return matrix;
  }
  
  /**
   * Get heatmap data of actor positions
   */
  getPositionHeatmap() {
    const heatmap = {};
    
    for (const actor of this.actors) {
      const key = `${Math.floor(actor.position.x/5)},${Math.floor(actor.position.z/5)}`;
      heatmap[key] = (heatmap[key] || 0) + 1;
    }
    
    return heatmap;
  }
  
  /**
   * Remove an actor
   */
  removeActor(actorId) {
    const index = this.actors.findIndex(a => a.id === actorId);
    if (index !== -1) {
      const actor = this.actors[index];
      
      // If it's the boss, clear boss reference
      if (actor.type === 'boss') {
        this.boss = null;
      }
      
      actor.dispose();
      this.actors.splice(index, 1);
      this.updateAnalytics();
    }
  }
  
  /**
   * Get the boss if exists
   */
  getBoss() {
    return this.boss;
  }
  
  /**
   * Check if boss exists and is alive
   */
  hasBoss() {
    return this.boss !== null && this.boss.health > 0;
  }
  
  /**
   * Remove all actors
   */
  clear() {
    for (const actor of this.actors) {
      actor.dispose();
    }
    this.actors = [];
    this.interactions = [];
    this.updateAnalytics();
  }
  
  /**
   * Get actors near a position
   */
  getActorsNearPosition(position, radius) {
    return this.actors.filter(actor => 
      actor.position.distanceTo(position) < radius
    );
  }
}