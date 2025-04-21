import React, { useState, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import FlagSimulation from './components/FlagSimulation';
import Controls from './components/Controls';
import './App.css';

function App() {
  const [flagImage, setFlagImage] = useState<string | null>(null);
  const [flagSize, setFlagSize] = useState({ width: 1, height: 0.6 });
  //const [flagPosition, setFlagPosition] = useState({ x: 0, y: 0, z: 0 });
  const [windForce, setWindForce] = useState(0); // デフォルト値を0に変更
  const [formation, setFormation] = useState({ rows: 1, columns: 1, spacing: 1 });
  const [poleRotation, setPoleRotation] = useState(0); // 追加：旗竿の回転角度
  const [showControls, setShowControls] = useState(true); // コントロールパネル表示のstate
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFlagImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 隊列の旗を生成する関数
  const renderFlags = () => {
    if (!flagImage) return null;

    const flags = [];
    for (let row = 0; row < formation.rows; row++) {
      for (let col = 0; col < formation.columns; col++) {
        const xOffset = (col - (formation.columns - 1) / 2) * formation.spacing * 1.5;
        const zOffset = (row - (formation.rows - 1) / 2) * formation.spacing * 1.5;

        flags.push(
          <FlagSimulation
            key={`flag-${row}-${col}`}
            image={flagImage}
            size={flagSize}
            position={{
              x: xOffset,
              y: 0,
              z: zOffset,
            }}
            windForce={windForce}
            poleRotation={poleRotation} // 追加：回転角度の渡し
          />
        );
      }
    }
    return flags;
  };

  // コントロールパネルの表示/非表示を切り替える関数
  const toggleControls = () => {
    setShowControls(!showControls);
  };

  return (
    <div className="app-container">
      <h1>旗デザインシミュレーター</h1>
      
      <div className="content">
        {/* コントロールパネル表示切替ボタン */}
        <button 
          onClick={toggleControls} 
          className="toggle-controls-btn"
        >
          {showControls ? 'コントロールを隠す' : 'コントロールを表示'}
        </button>

        {/* showControlsの値に応じてコントロールパネルを表示/非表示 */}
        {showControls && (
          <div className="controls-panel">
            <h2>コントロール</h2>
            <div className="upload-section">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <button onClick={() => fileInputRef.current?.click()}>
                旗の画像をアップロード
              </button>
              {flagImage && <p>画像がアップロードされました</p>}
            </div>

            <Controls
              flagSize={flagSize}
              setFlagSize={setFlagSize}
              //flagPosition={flagPosition}
              //setFlagPosition={setFlagPosition}
              windForce={windForce}
              setWindForce={setWindForce}
              formation={formation}
              setFormation={setFormation}
              poleRotation={poleRotation} // 追加：回転角度の渡し
              setPoleRotation={setPoleRotation} // 追加：回転角度の設定関数
            />
          </div>
        )}

        <div className="simulation-panel">
          <Canvas 
            camera={{ position: [2, 2, 4], fov: 50 }}
            shadows
          >
            <color attach="background" args={["#f0f0f0"]} />
            <ambientLight intensity={0.8} />
            <directionalLight 
              position={[5, 5, 5]} 
              intensity={1}
              castShadow
              shadow-mapSize={[2048, 2048]}
            />
            <Suspense fallback={null}>
              {renderFlags()}
            </Suspense>
            <OrbitControls />
          </Canvas>
        </div>
      </div>
    </div>
  );
}

export default App;