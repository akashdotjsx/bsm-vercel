"use client"

import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  HelpCircle, 
  X, 
  Search, 
  Send, 
  ArrowRight,
  Lightbulb,
  Sparkles,
  FileText,
  FileCheck,
  Bot,
  Megaphone
} from "lucide-react"
import Link from "next/link"

interface HelpArticle {
  icon: React.ReactNode
  title: string
  description: string
  href: string
}

interface VideoGuide {
  icon: React.ReactNode
  title: string
  color: string
}

export function HelpCenterDropdown() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const featuredArticles: HelpArticle[] = [
    {
      icon: <Lightbulb className="h-5 w-5" />,
      title: "Getting Started with BSM",
      description: "This guide shows you how to set up and use the Business Service Management platform.",
      href: "/help/getting-started"
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: "Managing Tickets & Workflows",
      description: "Learn how to create and manage tickets efficiently with automation.",
      href: "/help/tickets"
    }
  ]

  const videoGuides: VideoGuide[] = [
    {
      icon: <Lightbulb className="h-8 w-8" />,
      title: "Quick Start Guide",
      color: "bg-amber-500"
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Create Tickets",
      color: "bg-rose-500"
    },
    {
      icon: <FileCheck className="h-8 w-8" />,
      title: "Workflow Setup",
      color: "bg-emerald-500"
    },
    {
      icon: <Bot className="h-8 w-8" />,
      title: "Automation Tips",
      color: "bg-indigo-500"
    }
  ]

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 p-0 relative hover:bg-muted"
        >
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">Help Center</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-[520px] p-0 bg-background border shadow-2xl"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3 border-b">
          <div>
            <h3 className="font-semibold text-foreground" style={{ fontSize: '13px', lineHeight: '20px' }}>Help Center</h3>
            <p className="text-muted-foreground mt-1" style={{ fontSize: '11px', lineHeight: '16px' }}>
              You can always write to us at{" "}
              <a 
                href="mailto:help@kroolo-bsm.com" 
                className="text-blue-600 hover:underline"
              >
                help@kroolo-bsm.com
              </a>
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="p-4 pb-3">
          <h4 className="font-medium text-foreground mb-2" style={{ fontSize: '12px', lineHeight: '18px' }}>
            Find instant answers
          </h4>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Ask any question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-8 bg-muted/50 border-muted-foreground/20"
              style={{ fontSize: '12px' }}
            />
            <Button
              size="sm"
              className="absolute right-0.5 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 bg-primary hover:bg-primary/90"
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Featured Articles */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-foreground" style={{ fontSize: '12px', lineHeight: '18px' }}>
              Featured articles
            </h4>
            <Link 
              href="/help" 
              className="text-blue-600 hover:underline flex items-center gap-1"
              onClick={() => setOpen(false)}
              style={{ fontSize: '11px' }}
            >
              View help center
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-1.5">
            {featuredArticles.map((article, index) => (
              <Link
                key={index}
                href={article.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <div className="scale-75">{article.icon}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-foreground group-hover:text-primary mb-0.5" style={{ fontSize: '12px', lineHeight: '18px' }}>
                    {article.title}
                  </h5>
                  <p className="text-muted-foreground line-clamp-2" style={{ fontSize: '10px', lineHeight: '14px' }}>
                    {article.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-2" />
              </Link>
            ))}
          </div>
        </div>

        {/* Video Guides */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-foreground" style={{ fontSize: '12px', lineHeight: '18px' }}>
              Explore product videos
            </h4>
            <Link 
              href="/help/videos" 
              className="text-blue-600 hover:underline flex items-center gap-1"
              onClick={() => setOpen(false)}
              style={{ fontSize: '11px' }}
            >
              View all videos
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {videoGuides.map((video, index) => (
              <button
                key={index}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className={`w-12 h-12 rounded-xl ${video.color} flex items-center justify-center text-white shadow-sm`}>
                  <div className="scale-75">{video.icon}</div>
                </div>
                <span className="text-center text-muted-foreground group-hover:text-foreground line-clamp-2" style={{ fontSize: '10px', lineHeight: '14px' }}>
                  {video.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/30 p-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 h-8"
            onClick={() => setOpen(false)}
            style={{ fontSize: '11px' }}
          >
            <Megaphone className="h-3 w-3 mr-2" />
            Send Feedback
          </Button>
          <Button
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/90 h-8 px-4"
            onClick={() => setOpen(false)}
            style={{ fontSize: '11px' }}
          >
            Request Demo
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
