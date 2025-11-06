import * as THREE from 'three';
import { Actor } from './actor';

/**
 * Giant Boss Enemy - Chases player and attacks with axe
 */
export class BossEnemy extends Actor {
  constructor(scene, world, position, player) {
    super(scene, world, position);
    this.type = 'boss';
    this.name = 'Niyati';
    this.player = player;
    
    // Boss stats
    this.height = 4; // Giant size!
    this.radius = 1;
    this.speed = 3.5;
    this.health = 16; // Takes 16 bullets to kill
    this.maxHealth = 16;
    this.damage = 100; // One-hit kill player
    this.attackRange = 3;
    this.attackCooldown = 0;
    this.attackSpeed = 2; // Attack every 2 seconds
    
    // Boss states
    this.isAttacking = false;
    this.isEnraged = false;
    this.detectionRange = 30;
    
    // Axe reference
    this.axe = null;
    
    // Recreate mesh with proper boss appearance
    this.scene.remove(this.mesh);
    this.mesh.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
    this.mesh = this.createBossMesh();
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);
    
    // Recreate label
    this.createLabel();
    
    // Health bar
    this.createHealthBar();
  }
  
  getColor() {
    return 0xFF0000; // Red for boss
  }
  
  createBossMesh() {
    const boss = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
      color: 0x8B0000, // Dark red
      metalness: 0.3,
      roughness: 0.7
    });
    
    // Body (much larger)
    const bodyGeometry = new THREE.BoxGeometry(1.5, 2, 0.8);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.y = 2;
    body.castShadow = true;
    boss.add(body);
    
    // Head (large and scary)
    const headGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = 3.6;
    head.castShadow = true;
    boss.add(head);
    
    // Horns
    const hornMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const hornGeometry = new THREE.ConeGeometry(0.15, 0.6, 8);
    
    const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    leftHorn.position.set(-0.5, 4.3, 0);
    leftHorn.rotation.z = -0.3;
    leftHorn.castShadow = true;
    boss.add(leftHorn);
    
    const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    rightHorn.position.set(0.5, 4.3, 0);
    rightHorn.rotation.z = 0.3;
    rightHorn.castShadow = true;
    boss.add(rightHorn);
    
    // Glowing red eyes
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    const eyeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.1);
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 3.7, 0.6);
    boss.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 3.7, 0.6);
    boss.add(rightEye);
    
    // Arms (huge)
    const armGeometry = new THREE.BoxGeometry(0.4, 1.8, 0.4);
    
    const leftArm = new THREE.Mesh(armGeometry, material);
    leftArm.position.set(-1, 2, 0);
    leftArm.castShadow = true;
    boss.add(leftArm);
    this.leftArm = leftArm;
    
    const rightArm = new THREE.Mesh(armGeometry, material);
    rightArm.position.set(1, 2, 0);
    rightArm.castShadow = true;
    boss.add(rightArm);
    this.rightArm = rightArm;
    
    // Legs (massive)
    const legGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
    
    const leftLeg = new THREE.Mesh(legGeometry, material);
    leftLeg.position.set(-0.4, 0.75, 0);
    leftLeg.castShadow = true;
    boss.add(leftLeg);
    this.leftLeg = leftLeg;
    
    const rightLeg = new THREE.Mesh(legGeometry, material);
    rightLeg.position.set(0.4, 0.75, 0);
    rightLeg.castShadow = true;
    boss.add(rightLeg);
    this.rightLeg = rightLeg;
    
    // Giant Axe
    this.axe = this.createAxe();
    this.axe.position.set(1.2, 2, 0);
    boss.add(this.axe);
    
    return boss;
  }
  
  createAxe() {
    const axe = new THREE.Group();
    
    // Handle (long wooden handle)
    const handleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2, 8);
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.castShadow = true;
    axe.add(handle);
    
    // Axe head (large and deadly)
    const bladeGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.1);
    const bladeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      metalness: 0.9,
      roughness: 0.2
    });
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.position.y = 1.2;
    blade.castShadow = true;
    axe.add(blade);
    
    // Blood effect on blade
    const bloodGeometry = new THREE.BoxGeometry(0.7, 0.5, 0.12);
    const bloodMaterial = new THREE.MeshBasicMaterial({ color: 0x8B0000 });
    const blood = new THREE.Mesh(bloodGeometry, bloodMaterial);
    blood.position.y = 1.2;
    axe.add(blood);
    
    return axe;
  }
  
  createHealthBar() {
    // Health bar above boss
    const barWidth = 3;
    const barHeight = 0.3;
    
    const barGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
    const barBgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.healthBarBg = new THREE.Mesh(barGeometry, barBgMaterial);
    this.healthBarBg.position.y = 5;
    this.mesh.add(this.healthBarBg);
    
    const healthGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
    const healthMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    this.healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
    this.healthBar.position.set(-barWidth / 2, 5, 0.01);
    this.mesh.add(this.healthBar);
  }
  
  updateHealthBar() {
    const healthPercent = this.health / this.maxHealth;
    const barWidth = 3;
    this.healthBar.scale.x = healthPercent;
    this.healthBar.position.x = (-barWidth / 2) + (barWidth * healthPercent / 2);
    
    // Change color based on health
    if (healthPercent > 0.6) {
      this.healthBar.material.color.setHex(0x00FF00); // Green
    } else if (healthPercent > 0.3) {
      this.healthBar.material.color.setHex(0xFFFF00); // Yellow
    } else {
      this.healthBar.material.color.setHex(0xFF0000); // Red
    }
    
    // Enrage at low health
    if (healthPercent < 0.3 && !this.isEnraged) {
      this.isEnraged = true;
      this.speed = 6; // Move faster when enraged
      this.attackSpeed = 1; // Attack faster
      console.log('🔥 Niyati ENRAGED! 🔥');
    }
  }
  
  takeDamage(damage = 1) {
    this.health -= damage;
    this.updateHealthBar();
    
    // Flash red when hit
    this.mesh.traverse(child => {
      if (child.material && child.material.color) {
        const originalColor = child.material.color.clone();
        child.material.color.setHex(0xFFFFFF);
        setTimeout(() => {
          child.material.color.copy(originalColor);
        }, 100);
      }
    });
    
    console.log(`💥 Niyati hit! Health: ${this.health}/${this.maxHealth}`);
    
    if (this.health <= 0) {
      this.die();
      return true; // Boss is dead
    }
    return false;
  }
  
  die() {
    console.log('💀 Niyati DEFEATED! 💀');
    
    // Epic death effect
    for (let i = 0; i < 50; i++) {
      const particleGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const particleMaterial = new THREE.MeshBasicMaterial({ color: 0x8B0000 });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
      particle.position.copy(this.position);
      particle.position.y += 2;
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 10,
        (Math.random() - 0.5) * 10
      );
      particle.userData.velocity = velocity;
      particle.userData.lifetime = 2000;
      particle.userData.createdAt = performance.now();
      
      this.scene.add(particle);
      
      const animateParticle = () => {
        const elapsed = performance.now() - particle.userData.createdAt;
        if (elapsed < particle.userData.lifetime) {
          particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.016));
          particle.userData.velocity.y -= 9.8 * 0.016;
          particle.rotation.x += 0.2;
          particle.rotation.y += 0.2;
          particle.material.opacity = 1 - (elapsed / particle.userData.lifetime);
          requestAnimationFrame(animateParticle);
        } else {
          this.scene.remove(particle);
          particle.geometry.dispose();
          particle.material.dispose();
        }
      };
      animateParticle();
    }
    
    // Show victory message
    this.showVictoryMessage();
  }
  
  showVictoryMessage() {
    const victoryDiv = document.createElement('div');
    victoryDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 215, 0, 0.95);
      color: #000;
      padding: 40px 60px;
      border-radius: 20px;
      font-size: 48px;
      font-weight: bold;
      z-index: 10000;
      text-align: center;
      border: 5px solid #FFD700;
      box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
    `;
    victoryDiv.innerHTML = '🎉 VICTORY! 🎉<br><span style="font-size: 24px;">Boss Defeated!</span>';
    document.body.appendChild(victoryDiv);
    
    setTimeout(() => {
      document.body.removeChild(victoryDiv);
    }, 5000);
  }
  
  executeBehavior(dt) {
    if (this.health <= 0) return;
    
    const distanceToPlayer = this.position.distanceTo(this.player.position);
    
    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }
    
    // Check if player is in detection range
    if (distanceToPlayer < this.detectionRange) {
      // Move towards player
      if (distanceToPlayer > this.attackRange) {
        this.moveTo(this.player.position);
        this.currentBehavior = 'chasing';
        this.isAttacking = false;
      } else {
        // In attack range
        this.velocity.multiplyScalar(0.1); // Slow down
        this.currentBehavior = 'attacking';
        
        if (this.attackCooldown <= 0) {
          this.attack();
          this.attackCooldown = this.attackSpeed;
        }
      }
    } else {
      // Idle/patrol when player is far
      if (this.behaviorTimer > 3) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 5;
        const target = new THREE.Vector3(
          this.position.x + Math.cos(angle) * distance,
          this.position.y,
          this.position.z + Math.sin(angle) * distance
        );
        this.moveTo(target);
        this.currentBehavior = 'patrolling';
        this.behaviorTimer = 0;
      }
    }
  }
  
  attack() {
    this.isAttacking = true;
    
    // Axe swing animation
    if (this.axe) {
      this.axe.rotation.x = -Math.PI / 2;
      setTimeout(() => {
        this.axe.rotation.x = 0;
      }, 300);
    }
    
    // Check if player is hit
    const distanceToPlayer = this.position.distanceTo(this.player.position);
    if (distanceToPlayer < this.attackRange) {
      this.hitPlayer();
    }
    
    setTimeout(() => {
      this.isAttacking = false;
    }, 500);
  }
  
  hitPlayer() {
    console.log('💀 BOSS HIT YOU! GAME OVER! 💀');
    this.showGameOver();
  }
  
  showGameOver() {
    const gameOverDiv = document.createElement('div');
    gameOverDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(139, 0, 0, 0.95);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;
    gameOverDiv.innerHTML = `
      <h1 style="font-size: 72px; margin: 0; color: #FF0000; text-shadow: 3px 3px 6px black;">GAME OVER</h1>
      <p style="font-size: 32px; margin: 20px 0;">You were slain by ${this.name}</p>
      <p style="font-size: 18px; margin: 10px 0;">Boss Health Remaining: ${this.health}/${this.maxHealth}</p>
      <button onclick="location.reload()" style="
        margin-top: 30px;
        padding: 15px 40px;
        font-size: 24px;
        background: #FF0000;
        color: white;
        border: 3px solid white;
        border-radius: 10px;
        cursor: pointer;
        font-weight: bold;
      ">RESTART</button>
    `;
    document.body.appendChild(gameOverDiv);
    
    // Lock player controls
    if (this.player.controls.isLocked) {
      this.player.controls.unlock();
    }
  }
  
  animateWalking(dt) {
    const speed = this.velocity.length();
    const time = performance.now() * 0.003 * speed;
    
    // Heavy stomping animation
    if (this.leftArm && this.rightArm) {
      this.leftArm.rotation.x = Math.sin(time) * 0.6;
      this.rightArm.rotation.x = Math.sin(time + Math.PI) * 0.6;
    }
    
    if (this.leftLeg && this.rightLeg) {
      this.leftLeg.rotation.x = Math.sin(time + Math.PI) * 0.4;
      this.rightLeg.rotation.x = Math.sin(time) * 0.4;
    }
    
    // Heavy body bob
    this.mesh.position.y += Math.abs(Math.sin(time * 1.5)) * 0.15;
    
    // Axe sway
    if (this.axe && !this.isAttacking) {
      this.axe.rotation.z = Math.sin(time) * 0.2;
    }
  }
  
  resetPose() {
    if (this.leftArm) this.leftArm.rotation.x = 0;
    if (this.rightArm) this.rightArm.rotation.x = 0;
    if (this.leftLeg) this.leftLeg.rotation.x = 0;
    if (this.rightLeg) this.rightLeg.rotation.x = 0;
    if (this.axe) this.axe.rotation.z = 0;
  }
}