import Taro from '@tarojs/taro';

// Cookie存储的键名
const COOKIE_STORAGE_KEY = 'app_cookies';

// Cookie数据结构
interface CookieItem {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number; // 时间戳
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

// Cookie管理器类
export class CookieManager {
  /**
   * 解析Set-Cookie响应头
   * @param setCookieHeader Set-Cookie响应头的值
   * @param domain 请求的域名
   * @returns 解析后的Cookie对象
   */
  static parseCookie(setCookieHeader: string, domain: string): CookieItem | null {
    if (!setCookieHeader) return null;

    const parts = setCookieHeader.split(';').map(part => part.trim());
    const [nameValue] = parts;

    if (!nameValue || !nameValue.includes('=')) return null;

    const [name, value] = nameValue.split('=', 2);

    const cookie: CookieItem = {
      name: name.trim(),
      value: value.trim(),
      domain,
      path: '/'
    };

    // 解析其他属性
    parts.slice(1).forEach(part => {
      const [key, val] = part.split('=', 2);
      const lowerKey = key.toLowerCase();

      switch (lowerKey) {
        case 'expires':
          cookie.expires = new Date(val).getTime();
          break;
        case 'max-age':
          cookie.expires = Date.now() + parseInt(val) * 1000;
          break;
        case 'domain':
          cookie.domain = val;
          break;
        case 'path':
          cookie.path = val;
          break;
        case 'httponly':
          cookie.httpOnly = true;
          break;
        case 'secure':
          cookie.secure = true;
          break;
        case 'samesite':
          cookie.sameSite = val.toLowerCase() as 'strict' | 'lax' | 'none';
          break;
      }
    });

    return cookie;
  }

  /**
   * 从本地存储获取所有Cookie
   */
  static getAllCookies(): CookieItem[] {
    try {
      const cookiesStr = Taro.getStorageSync(COOKIE_STORAGE_KEY);
      if (!cookiesStr) return [];

      const cookies: CookieItem[] = JSON.parse(cookiesStr);

      // 过滤掉已过期的Cookie
      const now = Date.now();
      return cookies.filter(cookie => {
        if (cookie.expires && cookie.expires < now) {
          return false;
        }
        return true;
      });
    } catch (error) {
      console.error('获取Cookie失败:', error);
      return [];
    }
  }

  /**
   * 保存Cookie到本地存储
   */
  static saveCookies(cookies: CookieItem[]): void {
    try {
      Taro.setStorageSync(COOKIE_STORAGE_KEY, JSON.stringify(cookies));
    } catch (error) {
      console.error('保存Cookie失败:', error);
    }
  }

  /**
   * 添加或更新Cookie
   */
  static setCookie(cookie: CookieItem): void {
    const cookies = this.getAllCookies();

    // 查找是否已存在同名同域的Cookie
    const existingIndex = cookies.findIndex(c =>
      c.name === cookie.name &&
      c.domain === cookie.domain &&
      c.path === cookie.path
    );

    if (existingIndex >= 0) {
      // 更新现有Cookie
      cookies[existingIndex] = cookie;
    } else {
      // 添加新Cookie
      cookies.push(cookie);
    }

    this.saveCookies(cookies);
  }

  /**
   * 获取指定域名的Cookie字符串
   * @param domain 域名
   * @param path 路径（可选）
   * @returns Cookie字符串，格式为: "name1=value1; name2=value2"
   */
  static getCookieString(domain: string, path: string = '/'): string {
    const cookies = this.getAllCookies();

    // 过滤出匹配域名和路径的Cookie
    const matchedCookies = cookies.filter(cookie => {
      // 检查域名匹配
      if (cookie.domain) {
        // 如果cookie域名以.开头，则支持子域名
        if (cookie.domain.startsWith('.')) {
          const cookieDomain = cookie.domain.slice(1);
          if (!domain.endsWith(cookieDomain)) {
            return false;
          }
        } else if (cookie.domain !== domain) {
          return false;
        }
      }

      // 检查路径匹配
      if (cookie.path && !path.startsWith(cookie.path)) {
        return false;
      }

      return true;
    });

    // 组装Cookie字符串
    return matchedCookies
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');
  }

  /**
   * 删除指定的Cookie
   */
  static removeCookie(name: string, domain: string, path: string = '/'): void {
    const cookies = this.getAllCookies();
    const updatedCookies = cookies.filter(cookie =>
      !(cookie.name === name && cookie.domain === domain && cookie.path === path)
    );
    this.saveCookies(updatedCookies);
  }

  /**
   * 清除所有Cookie
   */
  static clearAllCookies(): void {
    try {
      Taro.removeStorageSync(COOKIE_STORAGE_KEY);
    } catch (error) {
      console.error('清除Cookie失败:', error);
    }
  }

  /**
   * 清除指定域名的所有Cookie
   */
  static clearDomainCookies(domain: string): void {
    const cookies = this.getAllCookies();
    const updatedCookies = cookies.filter(cookie => cookie.domain !== domain);
    this.saveCookies(updatedCookies);
  }

  /**
   * 处理响应头中的Set-Cookie
   * @param response Taro.request的响应对象
   * @param requestUrl 请求的URL
   */
  static handleSetCookieHeaders(response: any, requestUrl: string): void {
    if (!response.header && !response.headers) return;

    // 获取响应头对象
    const headers = response.header || response.headers || {};

    // 从URL中提取域名
    const domain = this.extractDomainFromUrl(requestUrl);
    if (!domain) return;

    // 处理Set-Cookie头（可能有多个）
    Object.keys(headers).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'set-cookie') {
        const setCookieValue = headers[key];

        // 处理单个或多个Set-Cookie
        const cookieHeaders = Array.isArray(setCookieValue) ? setCookieValue : [setCookieValue];

        cookieHeaders.forEach(cookieHeader => {
          const cookie = this.parseCookie(cookieHeader, domain);
          if (cookie) {
            console.log('保存Cookie:', cookie);
            this.setCookie(cookie);
          }
        });
      }
    });
  }

  /**
   * 从URL中提取域名
   */
  static extractDomainFromUrl(url: string): string | null {
    try {
      // 移除协议部分
      const urlWithoutProtocol = url.replace(/^https?:\/\//, '');

      // 提取域名部分（移除路径和查询参数）
      const domain = urlWithoutProtocol.split('/')[0].split('?')[0];

      // 移除端口号
      return domain.split(':')[0];
    } catch (error) {
      console.error('解析URL域名失败:', error);
      return null;
    }
  }

  /**
   * 检查当前环境是否需要手动管理Cookie
   */
  static isManualCookieRequired(): boolean {
    const env = Taro.getEnv();

    // 在小程序环境下需要手动管理Cookie
    return env !== Taro.ENV_TYPE.WEB;
  }

  /**
   * 获取调试信息
   */
  static getDebugInfo(): {
    environment: string;
    cookieCount: number;
    cookies: CookieItem[]
  } {
    const env = Taro.getEnv();
    const cookies = this.getAllCookies();

    return {
      environment: env,
      cookieCount: cookies.length,
      cookies: cookies
    };
  }
}