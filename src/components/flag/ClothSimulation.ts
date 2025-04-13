import * as THREE from 'three';
import { SimulationConfig } from './types';
import { ParticleSystem } from './ParticleSystem';
import { ConstraintSystem } from './Constraints';

export class ClothSimulation {
  private particleSystem: ParticleSystem;
  private constraintSystem: ConstraintSystem;
  private geometry: THREE.BufferGeometry;
  private polePosition: THREE.Vector3;
  private poleRadius: number;
  private poleRotation: number;
  private width: number;
  private height: number;
  private segments: { x: number; y: number };
  private gravity: number;
  private damping: number;

  constructor(config: SimulationConfig) {
    this.width = config.width;
    this.height = config.height;
    this.segments = config.segments;
    this.gravity = config.gravity || 5.0;
    this.damping = config.damping || 0.03;
    this.poleRadius = config.poleRadius || 0.02;
    this.poleRotation = 0;
    
    this.polePosition = new THREE.Vector3(-this.width / 2, 0, 0);
    this.geometry = new THREE.BufferGeometry();
    
    this.particleSystem = new ParticleSystem(config);
    this.constraintSystem = new ConstraintSystem(this.particleSystem, this.segments);
    
    this.initGeometry();
  }

  private initGeometry() {
    const positions = new Float32Array((this.segments.x + 1) * (this.segments.y + 1) * 3);
    const uvs = new Float32Array((this.segments.x + 1) * (this.segments.y + 1) * 2);
    const indices: number[] = [];

    // 頂点とUVの設定
    for (let y = 0; y <= this.segments.y; y++) {
      for (let x = 0; x <= this.segments.x; x++) {
        const i = y * (this.segments.x + 1) + x;
        const particle = this.particleSystem.getParticleAt(x, y);
        
        positions[i * 3] = particle.x;
        positions[i * 3 + 1] = particle.y;
        positions[i * 3 + 2] = particle.z;

        uvs[i * 2] = x / this.segments.x;
        uvs[i * 2 + 1] = 1 - (y / this.segments.y);
      }
    }

    // インデックスの設定
    for (let y = 0; y < this.segments.y; y++) {
      for (let x = 0; x < this.segments.x; x++) {
        const i1 = y * (this.segments.x + 1) + x;
        const i2 = i1 + 1;
        const i3 = (y + 1) * (this.segments.x + 1) + x;
        const i4 = i3 + 1;

        indices.push(i1, i2, i3);
        indices.push(i2, i4, i3);
      }
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    this.geometry.setIndex(indices);
  }

  setPoleRotation(angle: number) {
    this.poleRotation = (angle * Math.PI) / 180;
    
    // 旗竿の下端を中心とした回転
    const poleHeight = this.height * 1.2; // 旗竿の高さ
    const poleBottom = -this.height * 0.6; // 旗竿の下端位置

    // 固定点（左端）の位置を更新
    for (let y = 0; y <= this.segments.y; y++) {
      const yPos = (y / this.segments.y - 0.5) * this.height;
      const relativeY = yPos - poleBottom; // 下端からの相対位置

      // 点の回転
      const rotatedX = -this.width / 2 * Math.cos(this.poleRotation);
      const rotatedY = poleBottom + relativeY * Math.cos(this.poleRotation);
      const rotatedZ = -this.width / 2 * Math.sin(this.poleRotation);
      
      const index = this.particleSystem.getIndexAt(0, y);
      this.particleSystem.updatePosition(
        index,
        new THREE.Vector3(rotatedX, rotatedY, rotatedZ)
      );
    }
  }

  update(windForce: number, deltaTime: number) {
    this.particleSystem.resetForces();

    // 重力と風の力を適用
    const time = Date.now() * 0.001;
    
    for (let y = 0; y <= this.segments.y; y++) {
      for (let x = 0; x <= this.segments.x; x++) {
        const index = this.particleSystem.getIndexAt(x, y);
        
        if (x === 0) continue; // 左端は固定

        // 重力は常に下向き（Y軸負方向）
        const gravity = new THREE.Vector3(0, -this.gravity, 0);
        
        // 風力の計算 - 常に横方向（X軸正方向）
        const baseWindForce = windForce * 8;
        const xPos = x / this.segments.x;
        
        // 風は常に横方向で、端に行くほど強く
        const wind = new THREE.Vector3(
          baseWindForce * (0.7 + xPos * 0.3),
          Math.sin(time * 1.5 + xPos * Math.PI * 2) * baseWindForce * 0.25, // わずかな上下の揺れ
          0
        );

        this.particleSystem.applyForce(index, gravity);
        this.particleSystem.applyForce(index, wind);
      }
    }

    // 位置の更新
    this.particleSystem.updatePositions(deltaTime, this.damping);

    // 制約の解決
    this.constraintSystem.solveConstraints(this.particleSystem);

    // 旗竿との衝突判定
    this.handlePoleCollisions();

    // ジオメトリの更新
    this.updateGeometry();
  }

  private handlePoleCollisions() {
    this.particleSystem.positions.forEach((particle, i) => {
      if (i % (this.segments.x + 1) === 0) return;

      const dx = particle.x - this.polePosition.x;
      const dz = particle.z - this.polePosition.z;
      const distToPole = Math.sqrt(dx * dx + dz * dz);

      if (distToPole < this.poleRadius * 1.5) {
        const angle = Math.atan2(dz, dx);
        particle.x = this.polePosition.x + Math.cos(angle) * this.poleRadius * 1.5;
        particle.z = this.polePosition.z + Math.sin(angle) * this.poleRadius * 1.5;
      }
    });
  }

  private updateGeometry() {
    const positions = this.geometry.attributes.position.array as Float32Array;
    
    this.particleSystem.positions.forEach((particle, i) => {
      positions[i * 3] = particle.x;
      positions[i * 3 + 1] = particle.y;
      positions[i * 3 + 2] = particle.z;
    });

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  getGeometry(): THREE.BufferGeometry {
    return this.geometry;
  }
}