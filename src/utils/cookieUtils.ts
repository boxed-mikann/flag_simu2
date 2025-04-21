/**
 * Cookie保存用のユーティリティ関数
 */

/**
 * 指定された値をCookieに保存します
 * @param key Cookie名
 * @param value 保存する値
 * @param expiryDays 有効期限（日数）
 */
export const saveToCookie = (key: string, value: string, expiryDays = 30): void => {
  const date = new Date();
  date.setTime(date.getTime() + expiryDays * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${key}=${value};${expires};path=/`;
};

/**
 * 指定されたキーのCookie値を取得します
 * @param key Cookie名
 * @returns 取得した値またはnull
 */
export const getFromCookie = (key: string): string | null => {
  const name = `${key}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  
  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  
  return null;
};

/**
 * 指定されたキーのCookieを削除します
 * @param key Cookie名
 */
export const removeCookie = (key: string): void => {
  document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};