"use client"

// Fix navbar shifting when dropdowns open
export const setupNavbarFix = () => {
  if (typeof window === 'undefined') return

  const observer = new MutationObserver((mutations) => {
    let hasOverflowHidden = false
    
    // Check if body has overflow: hidden
    const bodyStyle = window.getComputedStyle(document.body)
    if (bodyStyle.overflow === 'hidden' || document.body.style.overflow === 'hidden') {
      hasOverflowHidden = true
      console.log('🔍 Detected body overflow hidden')
    }
    
    // Check for Radix portal elements
    const hasPortals = document.querySelector('[data-radix-portal]') !== null
    if (hasPortals) {
      console.log('🔍 Detected Radix portal elements')
    }
    
    if (hasOverflowHidden || hasPortals) {
      document.body.classList.add('dropdown-open')
      console.log('✅ Added dropdown-open class to body')
    } else {
      document.body.classList.remove('dropdown-open')
      console.log('❌ Removed dropdown-open class from body')
    }
  })

  // Watch for changes to body attributes and child elements
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['style'],
    childList: true,
    subtree: true
  })

  // Also watch for DOM changes that might indicate dropdown state
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  })

  return () => observer.disconnect()
}