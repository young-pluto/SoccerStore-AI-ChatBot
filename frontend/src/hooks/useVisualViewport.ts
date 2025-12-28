import { useEffect, useRef, useCallback } from 'react';

/**
 * useVisualViewport
 * 
 * This hook solves the mobile keyboard problem by tracking the actual visible
 * viewport (visualViewport API) and exposing it as CSS custom properties.
 * 
 * WHY THIS IS NEEDED:
 * - On mobile browsers, `100vh` and `100dvh` represent the LAYOUT viewport
 * - When the keyboard opens, iOS Safari does NOT resize the layout viewport
 * - Instead, the keyboard overlays on top, and only the VISUAL viewport shrinks
 * - The visualViewport API gives us the true visible area
 * 
 * WHAT THIS DOES:
 * - Sets `--visual-viewport-height` to the actual visible height in pixels
 * - Sets `--visual-viewport-offset-top` for iOS Safari address bar compensation
 * - Sets `--keyboard-open` to 1 or 0 for conditional styling
 * - Updates on resize, scroll, and keyboard open/close
 */
export function useVisualViewport() {
  const initialHeight = useRef<number>(0);
  const rafId = useRef<number>(0);

  const updateViewport = useCallback(() => {
    // Cancel any pending RAF to prevent stacking
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(() => {
      const vv = window.visualViewport;
      
      if (vv) {
        const height = vv.height;
        const offsetTop = vv.offsetTop;
        
        // Store initial height to detect keyboard
        if (initialHeight.current === 0) {
          initialHeight.current = height;
        }

        // Keyboard is open if visual viewport is significantly smaller than initial
        // Using 150px threshold to account for address bar changes vs keyboard
        const keyboardOpen = initialHeight.current - height > 150;

        // Set CSS custom properties on documentElement for global access
        const root = document.documentElement;
        root.style.setProperty('--visual-viewport-height', `${height}px`);
        root.style.setProperty('--visual-viewport-offset-top', `${offsetTop}px`);
        root.style.setProperty('--keyboard-open', keyboardOpen ? '1' : '0');
        
        // Also set the bottom offset (for when iOS Safari scrolls the page)
        const bottomOffset = window.innerHeight - height - offsetTop;
        root.style.setProperty('--visual-viewport-bottom', `${bottomOffset}px`);
      } else {
        // Fallback for browsers without visualViewport API
        const height = window.innerHeight;
        document.documentElement.style.setProperty('--visual-viewport-height', `${height}px`);
        document.documentElement.style.setProperty('--visual-viewport-offset-top', '0px');
        document.documentElement.style.setProperty('--visual-viewport-bottom', '0px');
        document.documentElement.style.setProperty('--keyboard-open', '0');
      }
    });
  }, []);

  useEffect(() => {
    // Initial update
    updateViewport();

    const vv = window.visualViewport;

    if (vv) {
      // visualViewport events fire when:
      // - Keyboard opens/closes
      // - User pinch-zooms
      // - Address bar shows/hides
      // - Device orientation changes
      vv.addEventListener('resize', updateViewport);
      vv.addEventListener('scroll', updateViewport);
    }

    // Also listen to window resize as fallback
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    // Reset initial height on orientation change
    const handleOrientationChange = () => {
      initialHeight.current = 0;
      // Delay to let the viewport settle
      setTimeout(updateViewport, 100);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      if (vv) {
        vv.removeEventListener('resize', updateViewport);
        vv.removeEventListener('scroll', updateViewport);
      }
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateViewport]);
}

/**
 * useScrollLock
 * 
 * Prevents body scrolling which causes the "rubber band" effect on iOS Safari.
 * This is essential for a native-like chat experience.
 */
export function useScrollLock() {
  useEffect(() => {
    // Save original styles
    const originalStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      width: document.body.style.width,
      height: document.body.style.height,
      touchAction: document.body.style.touchAction,
    };

    // Lock the body
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.touchAction = 'none';

    // Also lock html element for iOS Safari
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';

    // Prevent touchmove on body (iOS Safari rubber-banding)
    const preventScroll = (e: TouchEvent) => {
      // Allow scrolling within elements that have overflow
      const target = e.target as HTMLElement;
      const scrollableParent = target.closest('.message-list');
      if (!scrollableParent) {
        e.preventDefault();
      }
    };

    document.body.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      // Restore original styles
      document.body.style.overflow = originalStyles.overflow;
      document.body.style.position = originalStyles.position;
      document.body.style.width = originalStyles.width;
      document.body.style.height = originalStyles.height;
      document.body.style.touchAction = originalStyles.touchAction;
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
      document.body.removeEventListener('touchmove', preventScroll);
    };
  }, []);
}

