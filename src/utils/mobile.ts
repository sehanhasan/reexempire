
// Mobile utility functions for mobile app

export const isIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

export const isMobileApp = (): boolean => {
  // Check for Capacitor
  if ((window as any).Capacitor) {
    return true;
  }
  
  // Always return true for mobile-only app
  return true;
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
    'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover'
  );
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

export const initializeMobileOptimizations = (): void => {
  if (typeof window !== 'undefined') {
    optimizeViewport();
    enableSafeArea();
  }
};
