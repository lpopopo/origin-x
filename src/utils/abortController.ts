// AbortController polyfill for environments that don't support it
export class AbortControllerPolyfill {
  public signal: AbortSignalPolyfill;

  constructor() {
    this.signal = new AbortSignalPolyfill();
  }

  abort(): void {
    this.signal._abort();
  }
}

export class AbortSignalPolyfill {
  public aborted: boolean = false;
  private _onabort: (() => void) | null = null;

  constructor() {
    this.aborted = false;
  }

  get onabort(): (() => void) | null {
    return this._onabort;
  }

  set onabort(handler: (() => void) | null) {
    this._onabort = handler;
  }

  addEventListener(type: string, listener: () => void): void {
    if (type === 'abort') {
      this._onabort = listener;
    }
  }

  removeEventListener(type: string, listener: () => void): void {
    if (type === 'abort' && this._onabort === listener) {
      this._onabort = null;
    }
  }

  _abort(): void {
    if (!this.aborted) {
      this.aborted = true;
      if (this._onabort) {
        this._onabort();
      }
    }
  }
}

/**
 * 获取兼容的AbortController
 * 在支持的环境下使用原生实现，否则使用polyfill
 */
export function getAbortController(): AbortControllerPolyfill | AbortController {
  if (typeof AbortController !== 'undefined') {
    return new AbortController();
  }
  return new AbortControllerPolyfill();
}

/**
 * 检查当前环境是否支持原生AbortController
 */
export function supportsAbortController(): boolean {
  return typeof AbortController !== 'undefined';
}