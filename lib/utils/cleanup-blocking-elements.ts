/**
 * Global utility to clean up blocking UI elements
 * 
 * This fixes the issue where React Query Devtools and other overlays
 * block the UI even after modals close.
 * 
 * PROBLEM: React Query Devtools panel (.tsqd-main-panel) with display:none
 * was still capturing pointer events and blocking the entire UI
 * 
 * SOLUTION: Completely remove blocking elements from DOM, don't just hide them
 */

export function cleanupBlockingElements() {
  // Force body to be clean
  document.body.style.overflow = '';
  document.body.style.pointerEvents = '';
  document.body.removeAttribute('inert');
  
  // Remove all Radix portals that might be lingering
  const portals = document.querySelectorAll('[data-radix-portal]');
  portals.forEach(portal => {
    const isAlertDialog = portal.querySelector('[data-radix-alert-dialog-overlay]');
    if (isAlertDialog) {
      portal.remove();
    }
  });
  
  // CRITICAL FIX: Remove React Query Devtools if blocking
  const devtools = document.querySelector('.tsqd-main-panel');
  if (devtools) {
    devtools.remove(); // REMOVE from DOM, not just hide!
  }
  
  // Remove any other full-screen blocking overlays
  const allEls = document.querySelectorAll('*');
  allEls.forEach((el) => {
    const style = window.getComputedStyle(el);
    const zIndex = parseInt(style.zIndex);
    
    // Check for high z-index overlays that cover most of the screen
    if (zIndex >= 40 && (style.position === 'fixed' || style.position === 'absolute')) {
      const rect = el.getBoundingClientRect();
      
      // If it covers more than 50% of the screen, it's likely a blocker
      if (rect.width > window.innerWidth * 0.5 && rect.height > window.innerHeight * 0.5) {
        // Don't remove if it's a legitimate modal that should stay
        const isLegitimateModal = el.closest('[role="dialog"]') || 
                                  el.closest('[role="alertdialog"]') ||
                                  el.hasAttribute('data-state');
        
        if (!isLegitimateModal) {
          (el as HTMLElement).remove();
        }
      }
    }
  });
}

/**
 * Run continuous cleanup for a short period after modal operations
 * This ensures any delayed elements are also removed
 */
export function continuousCleanup(durationMs: number = 2000, intervalMs: number = 50) {
  const cleanupInterval = setInterval(() => {
    cleanupBlockingElements();
  }, intervalMs);
  
  // Stop cleanup after duration
  setTimeout(() => {
    clearInterval(cleanupInterval);
  }, durationMs);
  
  return () => clearInterval(cleanupInterval);
}

/**
 * Cleanup after modal closes
 * Use this in onClose/onOpenChange handlers
 */
export function cleanupAfterModalClose() {
  // Immediate cleanup
  cleanupBlockingElements();
  
  // Then run continuous cleanup for 2 seconds to catch any stragglers
  continuousCleanup(2000, 50);
}
