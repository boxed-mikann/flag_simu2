import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { FlagSimulationProps } from './flag/types';
import { ClothSimulation } from './flag/ClothSimulation';
import { Grid } from '@react-three/drei';

const FlagSimulation: React.FC<FlagSimulationProps> = ({
  image,
  size,
  position = { x: 0, y: 0, z: 0 }, // デフォルト値を設定
  windForce,
  poleRotation,
}) => {
  const flagRef = useRef<THREE.Mesh>(null);
  const poleRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(image);
  const simulationRef = useRef<ClothSimulation | null>(null);

  // シミュレーションの初期化
  useEffect(() => {
    const simulation = new ClothSimulation({
      width: size.width,
      height: size.height,
      segments: { x: 20, y: 15 },
      mass: 0.05,
      damping: 0.03,
      gravity: 5.0,
      poleRadius: 0.02
    });
    simulationRef.current = simulation;

    if (flagRef.current) {
      flagRef.current.geometry = simulation.getGeometry();
    }

    return () => {
      simulationRef.current = null;
    };
  }, [size]);

  // 回転角度の更新
  
  useEffect(() => {
    if (simulationRef.current) {
      simulationRef.current.setPoleRotation(poleRotation);
    }
  }, [poleRotation]);

  // アニメーションの更新
  useEffect(() => {
    if (!simulationRef.current) return;

    let lastTime = Date.now();
    let frameId: number;

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.02);
      lastTime = currentTime;

      simulationRef.current?.update(windForce, deltaTime);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [windForce, size, position, poleRotation]);

  return (
    <>
      {/* グリッドと座標軸 */}
      <Grid
        args={[10, 10]}
        cellSize={0.5}
        sectionSize={1}
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        position={[0, -1, 0]}
      />
      <axesHelper scale={2} />

      {/* 旗と旗竿のグループ */}
      <group position={[position.x, position.y, position.z]}>
        {/* 下端を中心とした回転グループ */}
          <group position={[0, 0, 0]}> {/* 元の位置に戻す */}
            {/* 旗竿 */}
            <mesh 
              ref={poleRef} 
              position={[Math.sin(poleRotation * Math.PI/180)*size.height * 0.6, Math.cos(poleRotation * Math.PI/180)*size.height * 0.6, 0]}
              rotation={[0, 0, -poleRotation * Math.PI/180]}
            >
              <cylinderGeometry args={[0.02, 0.02, size.height * 2.4, 16]} />
              <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.3} />
            </mesh>
            
            {/* 旗 */}
            <mesh 
              ref={flagRef}
              position={[0,size.height * 1.2, 0]}
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
      </group>
    </>
  );
};

export default FlagSimulation;