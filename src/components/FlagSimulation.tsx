import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
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

const FlagSimulation: React.FC<FlagSimulationProps> = ({
  image,
  size,
  position,
  windForce,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(image);
  
  // 旗のメッシュを生成
  useEffect(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry as THREE.PlaneGeometry;
      const positions = geometry.attributes.position;
      
      // オリジナルの頂点位置を保存（アニメーション用）
      const originalPositions = new Float32Array(positions.array);
      (meshRef.current as any).userData.originalPositions = originalPositions;
    }
  }, [size]);

  // 風の効果によるアニメーション
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry as THREE.PlaneGeometry;
      const positions = geometry.attributes.position;
      const originalPositions = (meshRef.current as any).userData.originalPositions;
      
      if (originalPositions) {
        const time = clock.getElapsedTime();
        
        for (let i = 0; i < positions.count; i++) {
          // X座標のインデックス（i * 3）
          const x = i % (geometry.parameters.widthSegments + 1);
          
          // X座標が大きいほど（右に行くほど）風の影響を強く受ける
          const windEffect = (x / geometry.parameters.widthSegments) * windForce;
          
          // Y座標のアニメーション：sin波で上下の揺れを表現
          const xOffset = originalPositions[i * 3];
          positions.array[i * 3 + 1] = 
            originalPositions[i * 3 + 1] + 
            Math.sin(time * 2 + xOffset * 10) * 0.02 * windEffect;
          
          // Z座標のアニメーション：cos波で前後の揺れを表現
          positions.array[i * 3 + 2] = 
            originalPositions[i * 3 + 2] + 
            Math.cos(time * 2 + xOffset * 10) * 0.01 * windEffect;
        }
        
        positions.needsUpdate = true;
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[position.x, position.y, position.z]}
      rotation={[0, 0, 0]}
    >
      <planeGeometry 
        args={[size.width, size.height, 20, 20]} 
      />
      <meshStandardMaterial 
        map={texture} 
        side={THREE.DoubleSide}
        transparent={true}
      />
    </mesh>
  );
};

export default FlagSimulation;