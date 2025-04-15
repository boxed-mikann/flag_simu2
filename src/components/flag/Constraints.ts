//import * as THREE from 'three';
import { Constraint } from './types';
import { ParticleSystem } from './ParticleSystem';

export class ConstraintSystem {
  private constraints: Constraint[];
  private segments: { x: number; y: number };
  
  constructor(particleSystem: ParticleSystem, segments: { x: number; y: number }) {
    this.constraints = [];
    this.segments = segments;
    this.initializeConstraints(particleSystem);
  }

  private initializeConstraints(particleSystem: ParticleSystem) {
    // 水平方向の接続
    for (let y = 0; y <= this.segments.y; y++) {
      for (let x = 0; x < this.segments.x; x++) {
        const p1 = particleSystem.getIndexAt(x, y);
        const p2 = particleSystem.getIndexAt(x + 1, y);
        const distance = particleSystem.positions[p1].distanceTo(particleSystem.positions[p2]);
        this.constraints.push({ p1, p2, distance });
      }
    }

    // 垂直方向の接続
    for (let x = 0; x <= this.segments.x; x++) {
      for (let y = 0; y < this.segments.y; y++) {
        const p1 = particleSystem.getIndexAt(x, y);
        const p2 = particleSystem.getIndexAt(x, y + 1);
        const distance = particleSystem.positions[p1].distanceTo(particleSystem.positions[p2]);
        this.constraints.push({ p1, p2, distance });
      }
    }

    // 対角線の接続
    for (let y = 0; y < this.segments.y; y++) {
      for (let x = 0; x < this.segments.x; x++) {
        const p1 = particleSystem.getIndexAt(x, y);
        const p2 = particleSystem.getIndexAt(x + 1, y + 1);
        const distance = particleSystem.positions[p1].distanceTo(particleSystem.positions[p2]) * 1.05;
        this.constraints.push({ p1, p2, distance });

        const p3 = particleSystem.getIndexAt(x + 1, y);
        const p4 = particleSystem.getIndexAt(x, y + 1);
        const distance2 = particleSystem.positions[p3].distanceTo(particleSystem.positions[p4]) * 1.05;
        this.constraints.push({ p1: p3, p2: p4, distance: distance2 });
      }
    }
  }

  solveConstraints(particleSystem: ParticleSystem, iterations: number = 4) {
    for (let i = 0; i < iterations; i++) {
      this.constraints.forEach(({ p1, p2, distance }) => {
        const pos1 = particleSystem.positions[p1];
        const pos2 = particleSystem.positions[p2];
        
        const diff = pos2.clone().sub(pos1);
        const currentDist = diff.length();
        
        if (currentDist === 0) return;
        
        const correctionFactor = (currentDist - distance) / currentDist;
        const correction = diff.multiplyScalar(correctionFactor * 0.7);

        if (p1 % (this.segments.x + 1) !== 0) {
          pos1.add(correction);
        }
        if (p2 % (this.segments.x + 1) !== 0) {
          pos2.sub(correction);
        }
      });
    }
  }
}