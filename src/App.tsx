import React, { useState, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import FlagSimulation from './components/FlagSimulation';
import Controls from './components/Controls';
import './App.css';

function App() {
  const [flagImage, setFlagImage] = useState<string | null>(null);
  const [flagSize, setFlagSize] = useState({ width: 1, height: 0.6 });
  const [flagPosition, setFlagPosition] = useState({ x: 0, y: 0, z: 0 });
  const [windForce, setWindForce] = useState(1);
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

  return (
    <div className="app-container">
      <h1>旗デザインシミュレーター</h1>
      
      <div className="content">
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
            flagPosition={flagPosition}
            setFlagPosition={setFlagPosition}
            windForce={windForce}
            setWindForce={setWindForce}
          />
        </div>

        <div className="simulation-panel">
          <Canvas camera={{ position: [0, 0, 2], fov: 75 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 10]} intensity={1} />
            <Suspense fallback={null}>
              {flagImage && (
                <FlagSimulation
                  image={flagImage}
                  size={flagSize}
                  position={flagPosition}
                  windForce={windForce}
                />
              )}
            </Suspense>
            <OrbitControls />
          </Canvas>
        </div>
      </div>
    </div>
  );
}

export default App;