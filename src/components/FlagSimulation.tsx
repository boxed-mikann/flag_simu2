import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { FlagSimulationProps } from './flag/types';
import { ClothSimulation } from './flag/ClothSimulation';
import { Grid } from '@react-three/drei';

const BASE_WIDTH = 1.0; // 基準となる幅
const SEGMENTS_Y = 15; // Y方向（高さ方向）のセグメント数を固定

const FlagSimulation: React.FC<FlagSimulationProps> = ({
  image,
  position = { x: 0, y: 0, z: 0 },
  windForce,
  poleRotation,
}) => {
  const flagRef = useRef<THREE.Mesh>(null);
  const poleRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(image);
  const simulationRef = useRef<ClothSimulation | null>(null);
  const [flagSize, setFlagSize] = useState({ width: BASE_WIDTH, height: BASE_WIDTH });

  // テクスチャが読み込まれた時に画像のアスペクト比に基づいてサイズを設定
  useEffect(() => {
    if (texture && texture.image) {
      const aspectRatio = texture.image.width / texture.image.height;
      const height = BASE_WIDTH / aspectRatio;
      setFlagSize({ width: BASE_WIDTH, height });

      // アスペクト比に基づいてX方向のセグメント数を計算
      // Y方向は固定で30、X方向はアスペクト比に合わせて調整
      const segmentsX = Math.round(SEGMENTS_Y * aspectRatio);

      // シミュレーションの再初期化
      const simulation = new ClothSimulation({
        width: BASE_WIDTH,
        height,
        segments: { x: segmentsX, y: SEGMENTS_Y },
        mass: 0.05,
        damping: 0.03,
        gravity: 5.0,
        poleRadius: 0.02
      });
      simulationRef.current = simulation;

      if (flagRef.current) {
        flagRef.current.geometry = simulation.getGeometry();
      }
    }
  }, [texture]);

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
  }, [windForce, position, poleRotation]);

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
          <group position={[0, 0, 0]}>
            {/* 旗竿 */}
            <mesh 
              ref={poleRef} 
              position={[Math.sin(poleRotation * Math.PI/180)*flagSize.height * 0.6, Math.cos(poleRotation * Math.PI/180)*flagSize.height * 0.6, 0]}
              rotation={[0, 0, -poleRotation * Math.PI/180]}
              castShadow
              receiveShadow
            >
              <cylinderGeometry args={[0.02, 0.02, flagSize.height * 2.4, 16]} />
              <meshStandardMaterial 
                color="#555555" 
                metalness={0.9} 
                roughness={0.2}
                envMapIntensity={1.0} 
              />
            </mesh>
            
            {/* 旗 */}
            <mesh 
              ref={flagRef}
              position={[0, flagSize.height * 1.2, 0]}
              castShadow 
              receiveShadow
            >
              <meshStandardMaterial
                map={texture}
                side={THREE.DoubleSide}
                transparent={true}
                roughness={0.6}  // より布らしい質感
                metalness={0.1}  // 金属感を抑える
                envMapIntensity={0.5}  // 環境マッピングの強度
                aoMapIntensity={0.5}   // アンビエントオクルージョンの強度
                normalScale={new THREE.Vector2(0.1, 0.1)} // 法線マッピングの強度
              />
            </mesh>
          </group>
      </group>
    </>
  );
};

export default FlagSimulation;