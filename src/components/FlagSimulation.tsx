import React, { useEffect } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { useCylinder, useBox, usePointToPointConstraint } from '@react-three/cannon';

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

const FlagSimulation: React.FC<FlagSimulationProps> = ({
  image,
  size,
  position,
  windForce,
}) => {
  const texture = useTexture(image);

  // 旗竿の作成（円柱）- Static（固定）オブジェクト
  const [poleRef] = useCylinder(() => ({
    args: [0.02, 0.02, size.height * 1.2, 16],
    position: [position.x - size.width / 2, position.y, position.z],
    rotation: [0, 0, 0],
    type: "Static",
  }));

  // 旗の物理シミュレーション用のボックスを作成 - Dynamic（動的）オブジェクト
  const [flagRef] = useBox(() => ({
    args: [size.width, size.height, 0.01],
    position: [position.x, position.y, position.z],
    rotation: [0, 0, 0],
    mass: 0.1,
    type: "Dynamic",
    material: {
      friction: 0.2,
      restitution: 0.2,
    },
    // 空気抵抗をシミュレート
    linearDamping: 0.8,
    angularDamping: 0.8,
  }));

  // 旗と旗竿を接続（左端を固定）
  usePointToPointConstraint(
    flagRef,
    poleRef,
    {
      pivotA: [-size.width / 2, 0, 0], // 旗の左端
      pivotB: [0, 0, 0], // 旗竿の中心
    }
  );

  // テクスチャの設定
  const materialProps = {
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    // クロス調の材質設定
    roughness: 0.8,
    metalness: 0.2,
  };

  return (
    <>
      {/* 旗竿 */}
      <mesh ref={poleRef as any} castShadow>
        <cylinderGeometry args={[0.02, 0.02, size.height * 1.2, 16]} />
        <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.3} />
      </mesh>
      
      {/* 旗 */}
      <mesh ref={flagRef as any} castShadow receiveShadow>
        <boxGeometry args={[size.width, size.height, 0.01]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
    </>
  );
};

export default FlagSimulation;