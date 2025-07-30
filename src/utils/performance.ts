// Performance optimization utilities

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const memoize = <T extends (...args: any[]) => any>(
  fn: T
): T => {
  const cache = new Map();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

export const lazy = <T>(fn: () => T): (() => T) => {
  let cached = false;
  let result: T;
  return () => {
    if (!cached) {
      result = fn();
      cached = true;
    }
    return result;
  };
};

export const measurePerformance = (name: string, fn: () => void): void => {
  if (typeof performance !== 'undefined') {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.debug(`${name} took ${end - start} milliseconds`);
  } else {
    fn();
  }
};

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

export const isSlowDevice = (): boolean => {
  if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
    return (navigator as any).deviceMemory < 4;
  }
  
  if (typeof navigator !== 'undefined' && 'hardwareConcurrency' in navigator) {
    return navigator.hardwareConcurrency < 4;
  }
  
  return false;
};