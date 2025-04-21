import React from 'react';
import './Slider.css';

interface SliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
  step?: number;
  valueDisplay?: string;
}

const Slider: React.FC<SliderProps> = ({
  min,
  max,
  value,
  onChange,
  disabled = false,
  label,
  step = 1,
  valueDisplay,
}) => {
  // 一意のIDを生成（ラベルとスライダーを関連付けるため）
  const sliderId = `slider-${label?.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div className="editor-slider-container">
      {label && (
        <label htmlFor={sliderId} className="editor-slider-label">
          {label}
        </label>
      )}
      <input
        id={sliderId}
        type="range"
        className="editor-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        title={label || "スライダー"}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label || "スライダー"}
      />
      {valueDisplay && <span className="editor-slider-value">{valueDisplay}</span>}
    </div>
  );
};

export default Slider;