import React from 'react';

interface Size {
  width: number;
  height: number;
}

interface Position {
  x: number;
  y: number;
  z: number;
}

interface ControlsProps {
  flagSize: Size;
  setFlagSize: React.Dispatch<React.SetStateAction<Size>>;
  flagPosition: Position;
  setFlagPosition: React.Dispatch<React.SetStateAction<Position>>;
  windForce: number;
  setWindForce: React.Dispatch<React.SetStateAction<number>>;
}

const Controls: React.FC<ControlsProps> = ({
  flagSize,
  setFlagSize,
  flagPosition,
  setFlagPosition,
  windForce,
  setWindForce,
}) => {
  return (
    <div className="controls">
      <div className="control-group">
        <h3>サイズ調整</h3>
        <div className="slider-container">
          <label htmlFor="width">幅:</label>
          <input
            type="range"
            id="width"
            min="0.1"
            max="2"
            step="0.1"
            value={flagSize.width}
            onChange={(e) =>
              setFlagSize({
                ...flagSize,
                width: parseFloat(e.target.value),
              })
            }
          />
          <div className="value-display">{flagSize.width.toFixed(1)}</div>
        </div>
        <div className="slider-container">
          <label htmlFor="height">高さ:</label>
          <input
            type="range"
            id="height"
            min="0.1"
            max="2"
            step="0.1"
            value={flagSize.height}
            onChange={(e) =>
              setFlagSize({
                ...flagSize,
                height: parseFloat(e.target.value),
              })
            }
          />
          <div className="value-display">{flagSize.height.toFixed(1)}</div>
        </div>
      </div>

      <div className="control-group">
        <h3>位置調整</h3>
        <div className="slider-container">
          <label htmlFor="positionX">X位置:</label>
          <input
            type="range"
            id="positionX"
            min="-2"
            max="2"
            step="0.1"
            value={flagPosition.x}
            onChange={(e) =>
              setFlagPosition({
                ...flagPosition,
                x: parseFloat(e.target.value),
              })
            }
          />
          <div className="value-display">{flagPosition.x.toFixed(1)}</div>
        </div>
        <div className="slider-container">
          <label htmlFor="positionY">Y位置:</label>
          <input
            type="range"
            id="positionY"
            min="-2"
            max="2"
            step="0.1"
            value={flagPosition.y}
            onChange={(e) =>
              setFlagPosition({
                ...flagPosition,
                y: parseFloat(e.target.value),
              })
            }
          />
          <div className="value-display">{flagPosition.y.toFixed(1)}</div>
        </div>
        <div className="slider-container">
          <label htmlFor="positionZ">Z位置:</label>
          <input
            type="range"
            id="positionZ"
            min="-2"
            max="2"
            step="0.1"
            value={flagPosition.z}
            onChange={(e) =>
              setFlagPosition({
                ...flagPosition,
                z: parseFloat(e.target.value),
              })
            }
          />
          <div className="value-display">{flagPosition.z.toFixed(1)}</div>
        </div>
      </div>

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
    </div>
  );
};

export default Controls;