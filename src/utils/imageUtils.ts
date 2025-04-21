/**
 * 画像処理用のユーティリティ関数
 */

/**
 * データURLから画像オブジェクトを作成します
 * @param dataUrl 画像データURL
 * @returns 画像オブジェクトのPromise
 */
export const createImageFromDataUrl = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
};

/**
 * キャンバス要素から画像データを取得します
 * @param canvas キャンバス要素
 * @param type 画像タイプ（デフォルトはpng）
 * @param quality 画像品質（jpegのみ有効）
 * @returns 画像データURL
 */
export const getImageDataFromCanvas = (
  canvas: HTMLCanvasElement,
  type: string = 'image/png',
  quality: number = 0.92
): string => {
  return canvas.toDataURL(type, quality);
};

/**
 * 背景色を透明にします（簡易的なクロマキー処理）
 * @param imageData 画像データ
 * @param options クロマキーの設定オプション
 * @returns 処理後の画像データ
 */
export const removeBackground = (
  imageData: ImageData,
  options: {
    redThreshold?: number; 
    greenThreshold?: number; 
    blueThreshold?: number;
    tolerance?: number;
  } = {}
): ImageData => {
  const { 
    redThreshold = 100, 
    greenThreshold = 100, 
    blueThreshold = 100,
    tolerance = 50 
  } = options;
  
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // 緑色の背景を検出（クロマキー）
    if (
      g > Math.max(r, b) + tolerance ||
      (r > redThreshold && g > greenThreshold && b > blueThreshold)
    ) {
      data[i + 3] = 0; // アルファチャンネルを0に設定（透明）
    }
  }
  
  return imageData;
};

/**
 * 画像の明るさとコントラストを調整します
 * @param imageData 画像データ
 * @param brightness 明るさ（-100〜100）
 * @param contrast コントラスト（-100〜100）
 * @returns 処理後の画像データ
 */
export const adjustBrightnessContrast = (
  imageData: ImageData,
  brightness: number = 0,
  contrast: number = 0
): ImageData => {
  const data = imageData.data;
  
  // 明るさとコントラストの係数を計算
  const brightnessValue = brightness / 100;
  const contrastFactor = (contrast + 100) / 100; // 1.0が元の値
  
  for (let i = 0; i < data.length; i += 4) {
    // 明るさ調整
    data[i] = data[i] + 255 * brightnessValue;
    data[i + 1] = data[i + 1] + 255 * brightnessValue;
    data[i + 2] = data[i + 2] + 255 * brightnessValue;
    
    // コントラスト調整
    data[i] = Math.max(0, Math.min(255, ((data[i] - 128) * contrastFactor) + 128));
    data[i + 1] = Math.max(0, Math.min(255, ((data[i + 1] - 128) * contrastFactor) + 128));
    data[i + 2] = Math.max(0, Math.min(255, ((data[i + 2] - 128) * contrastFactor) + 128));
  }
  
  return imageData;
};