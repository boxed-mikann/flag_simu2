import React, { useState, useRef, useEffect } from 'react';
import Slider from './Slider';
import { createImageFromDataUrl, getImageDataFromCanvas, removeBackground, adjustBrightnessContrast } from '../../utils/imageUtils';
import { saveToCookie, getFromCookie } from '../../utils/cookieUtils';
import './ImageEditor.css';

interface ImageEditorProps {
  initialImage?: string;
  onSave: (processedImage: string) => void;
  onCancel: () => void;
  imageId?: string;
}

interface ImageSettings {
  brightness: number;
  contrast: number;
  rotation: number;
  flipHorizontal: boolean;  // 左右反転の状態を追加
  removeBackground: boolean;
  cropData: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

const defaultSettings: ImageSettings = {
  brightness: 0,
  contrast: 0,
  rotation: 0,
  flipHorizontal: false,  // デフォルトは反転なし
  removeBackground: false,
  cropData: null
};

const ImageEditor: React.FC<ImageEditorProps> = ({
  initialImage,
  onSave,
  onCancel,
  imageId = 'default'
}) => {
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [settings, setSettings] = useState<ImageSettings>(defaultSettings);
  const [processing, setProcessing] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [history, setHistory] = useState<ImageSettings[]>([defaultSettings]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Cookieから設定を読み込む
  useEffect(() => {
    const savedSettings = getFromCookie(`flagEditor_${imageId}`);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        setHistory([defaultSettings, parsedSettings]);
        setHistoryIndex(1);
      } catch (e) {
        console.error('設定の読み込みに失敗しました:', e);
      }
    }
  }, [imageId]);
  
  // 画像が変更された場合、処理を適用
  useEffect(() => {
    if (image) {
      applyImageProcessing();
    }
  }, [image, settings]);
  
  // 画像ファイルアップロード処理
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target?.result as string;
        setImage(imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 編集履歴に追加
  const addToHistory = (newSettings: ImageSettings) => {
    // 現在の位置より後の履歴を削除
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSettings);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  // 元に戻す
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSettings(history[historyIndex - 1]);
    }
  };
  
  // やり直し
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSettings(history[historyIndex + 1]);
    }
  };
  
  // 設定変更ハンドラ
  const handleSettingChange = (key: keyof ImageSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    addToHistory(newSettings);
  };
  
  // 設定の保存
  const handleSaveSettings = () => {
    saveToCookie(`flagEditor_${imageId}`, JSON.stringify(settings));
    alert('設定が保存されました');
  };
  
  // リセット機能を追加
  const handleReset = () => {
    setSettings(defaultSettings);
    addToHistory(defaultSettings);
  };

  // トリミング開始
  const startCropping = () => {
    setIsCropping(true);
  };
  
  // トリミング確定
  const confirmCrop = (cropData: { x: number; y: number; width: number; height: number }) => {
    handleSettingChange('cropData', cropData);
    setIsCropping(false);
  };
  
  // トリミングキャンセル
  const cancelCrop = () => {
    setIsCropping(false);
  };
  
  // 画像処理の適用
  const applyImageProcessing = async () => {
    if (!image || !canvasRef.current) return;
    
    setProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context is not available');
      }
      
      // オリジナル画像の読み込み
      const img = await createImageFromDataUrl(image);
      
      // キャンバスのサイズを設定
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 画像を描画
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 変換行列を初期化
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // キャンバスの中心に移動
      ctx.translate(canvas.width / 2, canvas.height / 2);

      // 左右反転の適用
      if (settings.flipHorizontal) {
        ctx.scale(-1, 1);
      }

      // 回転の適用
      if (settings.rotation !== 0) {
        const radians = (settings.rotation * Math.PI) / 180;
        ctx.rotate(radians);
      }

      // 画像を描画（中心を基準に）
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      // 変換をリセット
      ctx.restore();
      
      // クロップの適用
      if (settings.cropData) {
        const { x, y, width, height } = settings.cropData;
        const croppedData = ctx.getImageData(x, y, width, height);
        
        canvas.width = width;
        canvas.height = height;
        ctx.putImageData(croppedData, 0, 0);
      }
      
      // 明るさ・コントラストの適用
      if (settings.brightness !== 0 || settings.contrast !== 0) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const processedData = adjustBrightnessContrast(
          imageData,
          settings.brightness,
          settings.contrast
        );
        ctx.putImageData(processedData, 0, 0);
      }
      
      // 背景削除の適用
      if (settings.removeBackground) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const processedData = removeBackground(ctx, imageData);
        ctx.putImageData(processedData, 0, 0);
      }
      
    } catch (error) {
      console.error('画像処理中にエラーが発生しました:', error);
    } finally {
      setProcessing(false);
    }
  };
  
  // 画像の保存
  const handleSaveImage = () => {
    if (!canvasRef.current) return;
    
    const processedImageUrl = getImageDataFromCanvas(canvasRef.current);
    onSave(processedImageUrl);
  };
  
  return (
    <div className="image-editor">
      <div className="editor-header">
        <h2>旗デザイン編集</h2>
        <div className="editor-actions">
          <button 
            className="editor-button" 
            onClick={handleReset}
            disabled={!image || processing}
            title="編集内容を初期状態に戻します"
          >
            リセット
          </button>
          <button 
            className="editor-button" 
            onClick={handleSaveSettings}
            disabled={!image || processing}
          >
            設定を保存
          </button>
          <button 
            className="editor-button" 
            onClick={handleSaveImage}
            disabled={!image || processing}
          >
            編集を完了
          </button>
          <button 
            className="editor-button secondary" 
            onClick={onCancel}
          >
            キャンセル
          </button>
        </div>
      </div>
      
      <div className="editor-toolbar">
        <button 
          className="editor-button" 
          onClick={() => fileInputRef.current?.click()}
        >
          画像をアップロード
        </button>
        <label htmlFor="editor-image-upload" className="visually-hidden">画像をアップロード</label>
        <input
          type="file"
          ref={fileInputRef}
          id="editor-image-upload" 
          className="hidden-input"
          accept="image/*"
          onChange={handleImageUpload}
          title="画像をアップロード"
        />
        
        <button 
          className="editor-button" 
          onClick={handleUndo}
          disabled={historyIndex <= 0 || processing}
        >
          元に戻す
        </button>
        
        <button 
          className="editor-button" 
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1 || processing}
        >
          やり直し
        </button>
        
        <button 
          className="editor-button" 
          onClick={startCropping}
          disabled={!image || processing || isCropping}
        >
          トリミング
        </button>
        
        <button 
          className={`editor-button ${settings.removeBackground ? 'active' : ''}`}
          onClick={() => handleSettingChange('removeBackground', !settings.removeBackground)}
          disabled={!image || processing}
        >
          背景削除
        </button>
      </div>
      
      <div className="editor-content">
        <div className="editor-canvas-container">
          {processing && <div className="processing-overlay">処理中...</div>}
          <canvas ref={canvasRef} className="editor-canvas" />
          
          {isCropping && image && (
            <CropTool
              image={image}
              onCropComplete={confirmCrop}
              onCancel={cancelCrop}
              canvasRef={cropCanvasRef}
            />
          )}
          
          {!image && (
            <div className="upload-placeholder">
              <p>画像をアップロードしてください</p>
              <button onClick={() => fileInputRef.current?.click()}>
                アップロード
              </button>
            </div>
          )}
        </div>
        
        <div className="editor-controls">
          <div className="control-group">
            <h3>画像調整</h3>
            
            <Slider
              label="明るさ"
              min={-100}
              max={100}
              step={1}
              value={settings.brightness}
              onChange={(value) => handleSettingChange('brightness', value)}
              disabled={!image || processing}
              valueDisplay={`${settings.brightness}%`}
            />
            
            <Slider
              label="コントラスト"
              min={-100}
              max={100}
              step={1}
              value={settings.contrast}
              onChange={(value) => handleSettingChange('contrast', value)}
              disabled={!image || processing}
              valueDisplay={`${settings.contrast}%`}
            />
            
            <Slider
              label="回転"
              min={-180}
              max={180}
              step={1}
              value={settings.rotation}
              onChange={(value) => handleSettingChange('rotation', value)}
              disabled={!image || processing}
              valueDisplay={`${settings.rotation}°`}
            />

            {/* 左右反転のボタンを追加 */}
            <button
              className={`editor-button editor-flip-button ${settings.flipHorizontal ? 'active' : ''}`}
              onClick={() => handleSettingChange('flipHorizontal', !settings.flipHorizontal)}
              disabled={!image || processing}
            >
              左右反転 {settings.flipHorizontal ? '(オン)' : '(オフ)'}
            </button>
          </div>
          
          {/* 角度ボタン */}
          <div className="rotation-buttons">
            <button 
              className={settings.rotation === -90 ? "active" : ""} 
              onClick={() => handleSettingChange('rotation', -90)}
              disabled={!image || processing}
            >
              -90°
            </button>
            <button 
              className={settings.rotation === 0 ? "active" : ""} 
              onClick={() => handleSettingChange('rotation', 0)}
              disabled={!image || processing}
            >
              0°
            </button>
            <button 
              className={settings.rotation === 90 ? "active" : ""} 
              onClick={() => handleSettingChange('rotation', 90)}
              disabled={!image || processing}
            >
              90°
            </button>
            <button 
              className={settings.rotation === 180 ? "active" : ""} 
              onClick={() => handleSettingChange('rotation', 180)}
              disabled={!image || processing}
            >
              180°
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// トリミングツールコンポーネント
interface CropToolProps {
  image: string;
  onCropComplete: (cropData: { x: number; y: number; width: number; height: number }) => void;
  onCancel: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const CropTool: React.FC<CropToolProps> = ({ 
  image, 
  onCropComplete, 
  onCancel,
  canvasRef 
}) => {
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.src = image;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      drawOverlay(ctx, canvas.width, canvas.height);
    };
  }, [canvasRef, image]);
  
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    setCropStart({ x, y });
    setCropEnd({ x, y });
    setIsDragging(true);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current || !cropStart) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);
    
    setCropEnd({ x, y });
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.src = image;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(img, 0, 0);
    
    drawOverlay(ctx, canvasRef.current.width, canvasRef.current.height);
    
    // 選択領域の描画
    const selectionX = Math.min(cropStart.x, x);
    const selectionY = Math.min(cropStart.y, y);
    const selectionWidth = Math.abs(x - cropStart.x);
    const selectionHeight = Math.abs(y - cropStart.y);
    
    // 選択領域を明るく表示
    ctx.clearRect(selectionX, selectionY, selectionWidth, selectionHeight);
    ctx.drawImage(
      img, 
      selectionX, selectionY, selectionWidth, selectionHeight,
      selectionX, selectionY, selectionWidth, selectionHeight
    );
    
    // 枠の描画
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(selectionX, selectionY, selectionWidth, selectionHeight);
  };
  
  const handleMouseUp = () => {
    if (!isDragging || !cropStart || !cropEnd || !canvasRef.current) return;
    
    setIsDragging(false);
    
    const selectionX = Math.min(cropStart.x, cropEnd.x);
    const selectionY = Math.min(cropStart.y, cropEnd.y);
    const selectionWidth = Math.abs(cropEnd.x - cropStart.x);
    const selectionHeight = Math.abs(cropEnd.y - cropStart.y);
    
    // 最小サイズチェック
    if (selectionWidth < 10 || selectionHeight < 10) {
      alert('選択範囲が小さすぎます。もう一度選択してください。');
      return;
    }
    
    onCropComplete({
      x: selectionX,
      y: selectionY,
      width: selectionWidth,
      height: selectionHeight
    });
  };
  
  const drawOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, width, height);
  };
  
  return (
    <div className="crop-tool">
      <canvas
        ref={canvasRef}
        className="crop-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="crop-controls">
        <p>ドラッグして切り取る範囲を選択してください</p>
        <button className="editor-button secondary" onClick={onCancel}>
          キャンセル
        </button>
      </div>
    </div>
  );
};

export default ImageEditor;