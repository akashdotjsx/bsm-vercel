import React from "react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | number
  className?: string
  noMargin?: boolean
  margin?: number
  style?: React.CSSProperties
  color?: string
}

export function LoadingSpinner({ 
  size = "md", 
  className = "", 
  noMargin = false, 
  margin = 0, 
  style,
  color = "#6E72FF",
  ...props 
}: LoadingSpinnerProps) {
  // Convert size prop to pixel value
  let pixelSize: number
  if (typeof size === 'number') {
    pixelSize = size
  } else {
    const sizeMap = {
      sm: 16,
      md: 24,
      lg: 32,
    }
    pixelSize = sizeMap[size]
  }

  const spinnerStyle: React.CSSProperties = {
    width: pixelSize,
    height: pixelSize,
    border: `${Math.max(2, pixelSize / 8)}px solid transparent`,
    borderTop: `${Math.max(2, pixelSize / 8)}px solid ${color}`,
    borderRadius: '50%',
    margin: noMargin ? 0 : margin,
    marginRight: noMargin ? 0 : 8,
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
    ...style
  }

  return (
    <div
      className={`loadingSpinner ${className}`}
      style={spinnerStyle}
      {...props}
    />
  )
}
