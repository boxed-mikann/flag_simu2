import * as THREE from 'three';
import { SimulationConfig } from './types';

export class ParticleSystem {
  private particles: THREE.Vector3[];
  private previousPositions: THREE.Vector3[];
  private forces: THREE.Vector3[];
  private width: number;
  private height: number;
  private segments: { x: number; y: number };
  private mass: number;

  constructor(config: SimulationConfig) {
    this.width = config.width;
    this.height = config.height;
    this.segments = config.segments;
    this.mass = config.mass || 0.05;
    
    this.particles = [];
    this.previousPositions = [];
    this.forces = [];
    
    this.initializeParticles();
  }

  private initializeParticles() {
    for (let y = 0; y <= this.segments.y; y++) {
      for (let x = 0; x <= this.segments.x; x++) {
        const px = (x / this.segments.x - 0.5) * this.width;
        const py = (y / this.segments.y - 0.5) * this.height;
        const pz = 0;
        
        const position = new THREE.Vector3(px, py, pz);
        this.particles.push(position);
        this.previousPositions.push(position.clone());
        this.forces.push(new THREE.Vector3(0, 0, 0));
      }
    }
  }

  get positions(): THREE.Vector3[] {
    return this.particles;
  }

  get velocities(): THREE.Vector3[] {
    return this.particles.map((pos, i) => 
      pos.clone().sub(this.previousPositions[i])
    );
  }

  resetForces() {
    this.forces.forEach(force => force.set(0, 0, 0));
  }

  applyForce(index: number, force: THREE.Vector3) {
    this.forces[index].add(force);
  }

  updatePosition(index: number, position: THREE.Vector3) {
    this.particles[index].copy(position);
  }

  updatePositions(deltaTime: number, damping: number) {
    for (let i = 0; i < this.particles.length; i++) {
      const position = this.particles[i];
      const previous = this.previousPositions[i];
      const force = this.forces[i];

      if (i % (this.segments.x + 1) === 0) continue;

      const temp = position.clone();
      const velocity = position.clone().sub(previous);
      
      const xPos = (i % (this.segments.x + 1)) / this.segments.x;
      const positionDamping = damping * (0.8 + xPos * 0.4);
      
      velocity.multiplyScalar(1 - positionDamping);
      position.add(velocity).add(force.multiplyScalar(deltaTime * deltaTime));
      previous.copy(temp);
    }
  }

  getParticleAt(x: number, y: number): THREE.Vector3 {
    const index = y * (this.segments.x + 1) + x;
    return this.particles[index];
  }

  getIndexAt(x: number, y: number): number {
    return y * (this.segments.x + 1) + x;
  }

  getGridPosition(index: number): { x: number; y: number } {
    const x = index % (this.segments.x + 1);
    const y = Math.floor(index / (this.segments.x + 1));
    return { x, y };
  }
}