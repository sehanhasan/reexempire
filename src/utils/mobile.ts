// Mobile utility functions for better mobile app integration

export const isIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

export const isMobileApp = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for Capacitor
  if ((window as any).Capacitor) {
    return true;
  }
  
  // Check for mobile webview patterns
  const mobilePatterns = [
    /iPhone|iPad|iPod|Android/i,
    /Mobile|Tablet/i,
    /WebView/i,
    /wv/i // Android WebView
  ];
  
  return mobilePatterns.some(pattern => pattern.test(userAgent));
};

export const disableZoom = (): void => {
  // Prevent pinch zoom on mobile
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('gesturechange', (e) => e.preventDefault());
  document.addEventListener('gestureend', (e) => e.preventDefault());
  
  // Prevent double tap zoom
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
};

export const enableSafeArea = (): void => {
  // Add safe area padding for notched devices
  if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
    document.documentElement.style.setProperty(
      '--safe-area-inset-top',
      'env(safe-area-inset-top)'
    );
    document.documentElement.style.setProperty(
      '--safe-area-inset-bottom',
      'env(safe-area-inset-bottom)'
    );
  }
};

export const optimizeViewport = (): void => {
  // Set optimal viewport for mobile
  let viewport = document.querySelector('meta[name=viewport]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    document.head.appendChild(viewport);
  }
  
  viewport.setAttribute(
    'content',
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
  );
};

export const initializeMobileOptimizations = (): void => {
  if (typeof window !== 'undefined') {
    optimizeViewport();
    enableSafeArea();
    
    if (isMobileApp() || isIframe()) {
      disableZoom();
    }
  }
};