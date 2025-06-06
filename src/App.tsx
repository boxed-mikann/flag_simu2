import React, { useState, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import FlagSimulation from './components/FlagSimulation';
import Controls from './components/Controls';
import ImageEditor from './components/ImageEditor/ImageEditor';
import './App.css';

function App() {
  const [flagImage, setFlagImage] = useState<string | null>(null);
  const [windForce, setWindForce] = useState(0);
  const [formation, setFormation] = useState({ rows: 1, columns: 1, spacing: 1 });
  const [poleRotation, setPoleRotation] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFlagImage(result);
        setShowEditor(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // 編集された画像を設定
  const handleSaveEditedImage = (processedImage: string) => {
    setFlagImage(processedImage);
    setShowEditor(false);
  };

  // 編集をキャンセル
  const handleCancelEdit = () => {
    setShowEditor(false);
  };

  // 画像編集モードを開始
  const startImageEdit = () => {
    setShowEditor(true);
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
            position={{
              x: xOffset,
              y: 0,
              z: zOffset,
            }}
            windForce={windForce}
            poleRotation={poleRotation}
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
      
      {showEditor ? (
        <ImageEditor
          initialImage={flagImage || undefined}
          onSave={handleSaveEditedImage}
          onCancel={handleCancelEdit}
          imageId="mainFlag"
        />
      ) : (
        <div className="content">
          <button 
            onClick={toggleControls} 
            className="toggle-controls-btn"
          >
            {showControls ? 'コントロールを隠す' : 'コントロールを表示'}
          </button>

          {showControls && (
            <div className="controls-panel">
              <h2>コントロール</h2>
              <div className="upload-section">
                <label htmlFor="flag-image-upload" className="visually-hidden">旗の画像をアップロード</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  id="flag-image-upload"
                  className="hidden-input"
                  title="旗の画像をアップロード"
                />
                <button onClick={() => fileInputRef.current?.click()}>
                  旗の画像をアップロード
                </button>
                
                {flagImage && (
                  <div className="image-preview-container">
                    <p>アップロード済み</p>
                    <div className="image-preview">
                      <img src={flagImage} alt="旗のプレビュー" />
                    </div>
                    <button onClick={startImageEdit} className="edit-image-btn">
                      画像を編集
                    </button>
                  </div>
                )}
              </div>

              <Controls
                windForce={windForce}
                setWindForce={setWindForce}
                formation={formation}
                setFormation={setFormation}
                poleRotation={poleRotation}
                setPoleRotation={setPoleRotation}
              />
            </div>
          )}

          <div className="simulation-panel">
            <Canvas 
              camera={{ position: [2, 2, 4], fov: 50 }}
              shadows
            >
              <color attach="background" args={["#e8e8e8"]} /> {/* より明るい背景色 */}
              {/* 自然な環境光 */}
              <ambientLight intensity={0.5} color="#ffffff" />
              
              {/* メインの太陽光 */}
              <directionalLight 
                position={[5, 5, 5]} 
                intensity={10}
                color="#fffaf0"
                castShadow
                shadow-mapSize={[2048, 2048]}
              />
              
              {/* 補助光（影を柔らかくする） */}
              <directionalLight
                position={[-5, 3, -5]}
                intensity={0.3}
                color="#b0c4de"
              />
              <Suspense fallback={null}>
                {renderFlags()}
              </Suspense>
              <OrbitControls />
            </Canvas>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;