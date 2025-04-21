import React from 'react';

interface Formation {
  rows: number;
  columns: number;
  spacing: number;
}

interface ControlsProps {
  windForce: number;
  setWindForce: React.Dispatch<React.SetStateAction<number>>;
  formation: Formation;
  setFormation: React.Dispatch<React.SetStateAction<Formation>>;
  poleRotation: number;
  setPoleRotation: React.Dispatch<React.SetStateAction<number>>;
}

const Controls: React.FC<ControlsProps> = ({
  windForce,
  setWindForce,
  formation,
  setFormation,
  poleRotation,
  setPoleRotation,
}) => {
  // 角度ボタンのハンドラー関数
  const handleRotationButtonClick = (angle: number) => {
    setPoleRotation(angle);
  };

  return (
    <div className="controls">
      <div className="control-group">
        <h3>風の強さ</h3>
        <div className="slider-container">
          <label htmlFor="wind">風力:</label>
          <input
            type="range"
            id="wind"
            min="0"
            max="3"
            step="0.1"
            value={windForce}
            onChange={(e) => setWindForce(parseFloat(e.target.value))}
          />
          <div className="value-display">{windForce.toFixed(1)}</div>
        </div>
      </div>

      <div className="control-group">
        <h3>隊列設定</h3>
        <div className="slider-container">
          <label htmlFor="rows">列数:</label>
          <input
            type="range"
            id="rows"
            min="1"
            max="5"
            step="1"
            value={formation.rows}
            onChange={(e) =>
              setFormation({
                ...formation,
                rows: parseInt(e.target.value),
              })
            }
          />
          <div className="value-display">{formation.rows}</div>
        </div>
        <div className="slider-container">
          <label htmlFor="columns">行数:</label>
          <input
            type="range"
            id="columns"
            min="1"
            max="5"
            step="1"
            value={formation.columns}
            onChange={(e) =>
              setFormation({
                ...formation,
                columns: parseInt(e.target.value),
              })
            }
          />
          <div className="value-display">{formation.columns}</div>
        </div>
        <div className="slider-container">
          <label htmlFor="spacing">間隔:</label>
          <input
            type="range"
            id="spacing"
            min="0.5"
            max="2"
            step="0.1"
            value={formation.spacing}
            onChange={(e) =>
              setFormation({
                ...formation,
                spacing: parseFloat(e.target.value),
              })
            }
          />
          <div className="value-display">{formation.spacing.toFixed(1)}</div>
        </div>
      </div>

      <div className="control-group">
        <h3>旗竿の回転</h3>
        <div className="slider-container">
          <label htmlFor="poleRotation">回転角度:</label>
          <input
            type="range"
            id="poleRotation"
            min="-180"
            max="180"
            step="1"
            value={poleRotation}
            onChange={(e) => setPoleRotation(parseFloat(e.target.value))}
          />
          <div className="value-display">{poleRotation.toFixed(0)}°</div>
        </div>
        
        {/* 角度ボタン */}
        <div className="rotation-buttons">
          <button 
            className={poleRotation === -90 ? "active" : ""} 
            onClick={() => handleRotationButtonClick(-90)}
          >
            -90°
          </button>
          <button 
            className={poleRotation === -45 ? "active" : ""} 
            onClick={() => handleRotationButtonClick(-45)}
          >
            -45°
          </button>
          <button 
            className={poleRotation === 0 ? "active" : ""} 
            onClick={() => handleRotationButtonClick(0)}
          >
            0°
          </button>
          <button 
            className={poleRotation === 45 ? "active" : ""} 
            onClick={() => handleRotationButtonClick(45)}
          >
            45°
          </button>
          <button 
            className={poleRotation === 90 ? "active" : ""} 
            onClick={() => handleRotationButtonClick(90)}
          >
            90°
          </button>
        </div>
      </div>
    </div>
  );
};

export default Controls;