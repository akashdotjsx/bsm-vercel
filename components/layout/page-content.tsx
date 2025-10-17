"use client"

import type React from "react"
import Link from "next/link"

interface PageContentProps {
  children: React.ReactNode
  breadcrumb?: {
    label: string
    href?: string
  }[]
  title?: string
  description?: string
  className?: string
  titleClassName?: string
  descriptionClassName?: string
}

/**
 * PageContent - Lightweight wrapper for page content
 * Replaces PlatformLayout for use within the persistent dashboard layout.
 * Only renders the content area, not the navbar/sidebar.
 */
export function PageContent({ 
  children, 
  breadcrumb, 
  title, 
  description,
  className = "",
  titleClassName = "",
  descriptionClassName = ""
}: PageContentProps) {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="bg-muted border-b border-border px-4 md:px-6 py-2 flex-shrink-0">
          <div className="flex items-center space-x-2 text-xs md:text-sm text-muted-foreground">
            {breadcrumb.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                {index > 0 && <span>/</span>}
                {item.href ? (
                  <Link href={item.href} className="hover:text-foreground transition-colors truncate">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium truncate">{item.label}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Page Header */}
      {(title || description) && (
        <div className="px-4 md:px-6 py-4 border-b border-border flex-shrink-0">
          {title && <h1 className={`text-[13px] font-bold mb-1 ${titleClassName}`}>{title}</h1>}
          {description && <p className={`text-muted-foreground text-xs ${descriptionClassName}`}>{description}</p>}
        </div>
      )}

      {/* Page Content */}
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        {children}
      </div>
    </div>
  )
}
