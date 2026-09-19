/**
 * 安全存储：file:// 是不透明源，localStorage 会抛 SecurityError；
 * Safari 无痕模式同样会抛。任何直接读写都可能整页白屏，必须兜底。
 */
export const store = {
  get(k) {
    try {
      return window.localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      window.localStorage.setItem(k, v);
    } catch {
      /* 静默降级 */
    }
  },
  remove(k) {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* 静默降级 */
    }
  },
};
