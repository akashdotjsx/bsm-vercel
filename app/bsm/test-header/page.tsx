"use client"

import { GlobalHeader } from "@/components/layout/global-header"
import { useEffect } from "react"

export default function TestHeaderPage() {
  useEffect(() => {
    // Auto-click the user dropdown after a short delay to test alignment
    const timer = setTimeout(() => {
      const userDropdownTrigger = document.querySelector('[data-testid="user-dropdown-trigger"]') as HTMLButtonElement
      if (userDropdownTrigger) {
        userDropdownTrigger.click()
        console.log("[v0] Auto-clicked user dropdown for testing")
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalHeader />
      <div className="pt-16 p-8">
        <h1 className="text-2xl font-bold mb-4">Header Dropdown Test Page</h1>
        <p className="text-gray-600 mb-4">
          This page is for testing the header dropdown alignment. The user dropdown should open automatically.
        </p>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Test Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Check if the user dropdown opens without causing horizontal scroll</li>
            <li>Verify the dropdown stays within the viewport boundaries</li>
            <li>Test on different screen sizes (mobile, tablet, desktop)</li>
            <li>Ensure no flickering or layout shifts occur</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
