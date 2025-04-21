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
    backgroundColors?: Array<[number, number, number]>;
    tolerance?: number;
    edgeThreshold?: number;
  } = {}
): ImageData => {
  const {
    backgroundColors = [],
    tolerance = 30,
    edgeThreshold = 30
  } = options;

  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // エッジ検出用の配列
  const edges = new Uint8Array(width * height);

  // 簡易的なSobelフィルタでエッジを検出
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // 周辺ピクセルの輝度を計算
      const gx = (
        data[idx + 4] - data[idx - 4] +
        2 * (data[idx + 4 + width * 4] - data[idx - 4 + width * 4]) +
        data[idx + 4 + width * 8] - data[idx - 4 + width * 8]
      ) / 4;
      
      const gy = (
        data[idx + width * 8] - data[idx] +
        2 * (data[idx + 4 + width * 8] - data[idx + 4]) +
        data[idx + 8 + width * 8] - data[idx + 8]
      ) / 4;
      
      edges[y * width + x] = Math.sqrt(gx * gx + gy * gy) > edgeThreshold ? 255 : 0;
    }
  }

  // 背景削除処理
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const pixelIndex = Math.floor(i / 4);

    // 選択された背景色との差異を計算
    let minColorDiff = Infinity;
    for (const bgColor of backgroundColors) {
      const colorDiff = Math.sqrt(
        Math.pow(r - bgColor[0], 2) +
        Math.pow(g - bgColor[1], 2) +
        Math.pow(b - bgColor[2], 2)
      );
      minColorDiff = Math.min(minColorDiff, colorDiff);
    }
    
    // エッジ付近かどうかを確認
    const isNearEdge = edges[pixelIndex] > 0;
    
    // 背景判定（いずれかの背景色に近い場合）
    if ((minColorDiff < tolerance * 3 || backgroundColors.length === 0) && !isNearEdge) {
      // アルファ値を徐々に変化させる
      const alpha = Math.min(255, minColorDiff * (255 / (tolerance * 3)));
      data[i + 3] = alpha;
    }
  }

  return imageData;
}

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