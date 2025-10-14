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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from "next-themes"
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
  const { theme } = useTheme()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const featuredArticles: HelpArticle[] = [
    {
      icon: <Lightbulb className="h-4 w-4" />,
      title: "Getting Started with BSM",
      description: "This guide shows you how to set up and use the Business Service Management platform.",
      href: "/help/getting-started"
    },
    {
      icon: <Sparkles className="h-4 w-4" />,
      title: "Managing Tickets & Workflows",
      description: "Learn how to create and manage tickets efficiently with automation.",
      href: "/help/tickets"
    }
  ]

  const videoGuides: VideoGuide[] = [
    {
      icon: <Lightbulb className="h-6 w-6" />,
      title: "Quick Start Guide",
      color: "bg-amber-500"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Create Tickets",
      color: "bg-rose-500"
    },
    {
      icon: <FileCheck className="h-6 w-6" />,
      title: "Workflow Setup",
      color: "bg-emerald-500"
    },
    {
      icon: <Bot className="h-6 w-6" />,
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
          className="h-7 w-7 p-0 relative"
          title="Help Center"
        >
          <HelpCircle className="h-4 w-4" style={{ color: theme === 'dark' ? '#d1d5db' : '#000000' }} />
          <span className="sr-only">Help Center</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        alignOffset={-20}
        className="w-[440px] p-0 border border-border bg-popover shadow-lg rounded-lg"
      >
        {/* Header */}
        <div className="p-3 pb-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Help Center</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground text-[11px] mb-3">
            You can always write to us at{" "}
            <a 
              href="mailto:help@kroolo-bsm.com" 
              className="text-primary hover:underline"
            >
              help@kroolo-bsm.com
            </a>
          </p>
        </div>

        {/* Search Bar */}
        <div className="px-3 pb-3">
          <h4 className="text-xs font-medium text-foreground mb-2">
            Find instant answers
          </h4>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Ask any question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-10 h-9 bg-muted/50 border-0 text-xs focus-visible:ring-1"
            />
            <Button
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 bg-primary hover:bg-primary/90"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Featured Articles */}
        <div className="px-3 pb-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-foreground">
              Featured articles
            </h4>
            <Link 
              href="/help" 
              className="text-primary hover:underline flex items-center gap-1 text-[11px]"
              onClick={() => setOpen(false)}
            >
              View help center
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-1">
            {featuredArticles.map((article, index) => (
              <Link
                key={index}
                href={article.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-2.5 p-2.5 rounded-md hover:bg-accent transition-colors group"
              >
                <div className="p-1.5 rounded-full bg-primary/10 flex-shrink-0 mt-0.5">
                  <div className="text-primary">{article.icon}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-medium text-foreground group-hover:text-primary mb-0.5">
                    {article.title}
                  </h5>
                  <p className="text-muted-foreground line-clamp-2 text-[10px] leading-tight">
                    {article.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Video Guides */}
        <div className="px-3 pb-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-foreground">
              Explore product videos
            </h4>
            <Link 
              href="/help/videos" 
              className="text-primary hover:underline flex items-center gap-1 text-[11px]"
              onClick={() => setOpen(false)}
            >
              View all videos
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {videoGuides.map((video, index) => (
              <button
                key={index}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-accent transition-colors group"
              >
                <div className={`w-12 h-12 rounded-xl ${video.color} flex items-center justify-center text-white`}>
                  {video.icon}
                </div>
                <span className="text-center text-muted-foreground group-hover:text-foreground line-clamp-2 text-[10px] leading-tight">
                  {video.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-primary/10 h-8 text-[11px]"
            onClick={() => setOpen(false)}
          >
            <Megaphone className="h-3.5 w-3.5 mr-1.5" />
            Send Feedback
          </Button>
          <Button
            size="sm"
            variant="default"
            className="h-8 px-3 text-[11px]"
            onClick={() => setOpen(false)}
          >
            Request Demo
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
