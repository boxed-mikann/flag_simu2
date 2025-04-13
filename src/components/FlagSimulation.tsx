import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

interface FlagSimulationProps {
  image: string;
  size: {
    width: number;
    height: number;
  };
  position: {
    x: number;
    y: number;
    z: number;
  };
  windForce: number;
}

class ClothSimulation {
  private particles: THREE.Vector3[];
  private originalPositions: THREE.Vector3[];
  private previousPositions: THREE.Vector3[];
  private constraints: { p1: number; p2: number; distance: number }[];
  private forces: THREE.Vector3[];
  private geometry: THREE.BufferGeometry;
  private w: number;
  private h: number;
  private segments: { x: number; y: number };
  private mass: number;
  private damping: number;
  private gravity: number;

  constructor(width: number, height: number, segments: { x: number; y: number }) {
    this.w = width;
    this.h = height;
    this.segments = segments;
    this.mass = 0.1;
    this.damping = 0.03;
    this.gravity = 9.8;

    this.particles = [];
    this.originalPositions = [];
    this.previousPositions = [];
    this.forces = [];
    this.constraints = [];
    this.geometry = new THREE.BufferGeometry();

    this.init();
  }

  private init() {
    // パーティクルの初期化
    for (let y = 0; y <= this.segments.y; y++) {
      for (let x = 0; x <= this.segments.x; x++) {
        const px = (x / this.segments.x - 0.5) * this.w;
        const py = (y / this.segments.y - 0.5) * this.h;
        const pz = 0;
        
        const position = new THREE.Vector3(px, py, pz);
        this.particles.push(position);
        this.originalPositions.push(position.clone());
        this.previousPositions.push(position.clone());
        this.forces.push(new THREE.Vector3(0, 0, 0));
      }
    }

    // 構造的な接続の作成
    const getIndex = (x: number, y: number) => y * (this.segments.x + 1) + x;

    // 水平方向の接続
    for (let y = 0; y <= this.segments.y; y++) {
      for (let x = 0; x < this.segments.x; x++) {
        const p1 = getIndex(x, y);
        const p2 = getIndex(x + 1, y);
        const distance = this.particles[p1].distanceTo(this.particles[p2]);
        this.constraints.push({ p1, p2, distance });
      }
    }

    // 垂直方向の接続
    for (let x = 0; x <= this.segments.x; x++) {
      for (let y = 0; y < this.segments.y; y++) {
        const p1 = getIndex(x, y);
        const p2 = getIndex(x, y + 1);
        const distance = this.particles[p1].distanceTo(this.particles[p2]);
        this.constraints.push({ p1, p2, distance });
      }
    }

    // 対角線の接続
    for (let y = 0; y < this.segments.y; y++) {
      for (let x = 0; x < this.segments.x; x++) {
        const p1 = getIndex(x, y);
        const p2 = getIndex(x + 1, y + 1);
        const distance = this.particles[p1].distanceTo(this.particles[p2]);
        this.constraints.push({ p1, p2, distance });

        const p3 = getIndex(x + 1, y);
        const p4 = getIndex(x, y + 1);
        const distance2 = this.particles[p3].distanceTo(this.particles[p4]);
        this.constraints.push({ p1: p3, p2: p4, distance: distance2 });
      }
    }

    // ジオメトリの初期化
    const positions = new Float32Array((this.segments.x + 1) * (this.segments.y + 1) * 3);
    const uvs = new Float32Array((this.segments.x + 1) * (this.segments.y + 1) * 2);
    const indices = [];

    // 頂点とUVの設定
    for (let y = 0; y <= this.segments.y; y++) {
      for (let x = 0; x <= this.segments.x; x++) {
        const i = y * (this.segments.x + 1) + x;
        positions[i * 3] = this.particles[i].x;
        positions[i * 3 + 1] = this.particles[i].y;
        positions[i * 3 + 2] = this.particles[i].z;

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

  update(windForce: number, deltaTime: number) {
    // 力のリセット
    this.forces.forEach(force => force.set(0, 0, 0));

    // 重力と風の力を適用
    const time = Date.now() * 0.001;
    for (let i = 0; i < this.particles.length; i++) {
      // 左端は固定
      if (i % (this.segments.x + 1) === 0) continue;

      const force = this.forces[i];
      
      // 重力
      force.y -= this.gravity * this.mass;

      // 風力
      const windX = Math.sin(time * 2) * windForce;
      const windY = Math.cos(time * 1.5) * windForce * 0.1;
      const windZ = Math.sin(time * 3) * windForce * 0.3;
      force.add(new THREE.Vector3(windX, windY, windZ));
    }

    // バーレー積分による位置の更新
    for (let i = 0; i < this.particles.length; i++) {
      if (i % (this.segments.x + 1) === 0) continue; // 左端は固定

      const position = this.particles[i];
      const previous = this.previousPositions[i];
      const force = this.forces[i];

      const temp = position.clone();
      
      // 速度の計算（現在位置 - 前回位置）
      const velocity = position.clone().sub(previous);
      
      // 減衰の適用
      velocity.multiplyScalar(1 - this.damping);
      
      // 新しい位置の計算
      position.add(velocity).add(force.multiplyScalar(deltaTime * deltaTime));
      
      // 前回の位置を更新
      previous.copy(temp);
    }

    // 制約の解決
    const iterations = 3;
    for (let i = 0; i < iterations; i++) {
      this.constraints.forEach(({ p1, p2, distance }) => {
        const pos1 = this.particles[p1];
        const pos2 = this.particles[p2];
        
        const diff = pos2.clone().sub(pos1);
        const currentDist = diff.length();
        
        if (currentDist === 0) return;
        
        const correctionFactor = (currentDist - distance) / currentDist;
        const correction = diff.multiplyScalar(correctionFactor * 0.5);

        // 左端のパーティクルは動かさない
        if (p1 % (this.segments.x + 1) !== 0) {
          pos1.add(correction);
        }
        if (p2 % (this.segments.x + 1) !== 0) {
          pos2.sub(correction);
        }
      });
    }

    // ジオメトリの更新
    const positions = this.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < this.particles.length; i++) {
      positions[i * 3] = this.particles[i].x;
      positions[i * 3 + 1] = this.particles[i].y;
      positions[i * 3 + 2] = this.particles[i].z;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  getGeometry(): THREE.BufferGeometry {
    return this.geometry;
  }
}

const FlagSimulation: React.FC<FlagSimulationProps> = ({
  image,
  size,
  position,
  windForce,
}) => {
  const flagRef = useRef<THREE.Mesh>(null);
  const poleRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(image);
  const simulationRef = useRef<ClothSimulation | null>(null);

  // シミュレーションの初期化
  useEffect(() => {
    const simulation = new ClothSimulation(
      size.width,
      size.height,
      { x: 20, y: 15 }
    );
    simulationRef.current = simulation;

    if (flagRef.current) {
      flagRef.current.geometry = simulation.getGeometry();
    }

    return () => {
      simulationRef.current = null;
    };
  }, [size]);

  // アニメーションの更新
  useEffect(() => {
    if (!simulationRef.current) return;

    let lastTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.02);
      lastTime = currentTime;

      simulationRef.current?.update(windForce, deltaTime);
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [windForce]);

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 旗竿 */}
      <mesh 
        ref={poleRef} 
        position={[-size.width / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.02, 0.02, size.height * 1.2, 16]} />
        <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.3} />
      </mesh>
      
      {/* 旗 */}
      <mesh 
        ref={flagRef}
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial
          map={texture}
          side={THREE.DoubleSide}
          transparent={true}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
};

export default FlagSimulation;