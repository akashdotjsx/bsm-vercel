"use client"

import type React from "react"

import { useState, useRef } from "react"
import { PageContent } from "@/components/layout/page-content"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Save,
  Eye,
  Settings,
  MessageSquare,
  History,
  Type,
  List,
  Hash,
  Quote,
  Code,
  Lightbulb,
  Link,
  Table,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { JSX } from "react/jsx-runtime" // Import JSX to fix the undeclared variable error

interface Block {
  id: string
  type: string
  content: string
  level?: number
}

interface SlashCommand {
  id: string
  label: string
  icon: React.ReactNode
  type: string
  category: "FORMAT" | "INSERT"
  level?: number
}

export default function ArticleEditPage() {
  const router = useRouter()
  const params = useParams()
  const [title, setTitle] = useState("Setting up Billing Automation")
  const [blocks, setBlocks] = useState<Block[]>([
    {
      id: "1",
      type: "paragraph",
      content:
        "This comprehensive guide will walk you through the process of configuring automated billing processes and invoice generation in your BSM platform.",
    },
  ])
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 })
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showPublish, setShowPublish] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const slashCommands: SlashCommand[] = [
    { id: "h1", label: "Heading 1", icon: <Type className="h-4 w-4" />, type: "heading", category: "FORMAT", level: 1 },
    { id: "h2", label: "Heading 2", icon: <Type className="h-4 w-4" />, type: "heading", category: "FORMAT", level: 2 },
    { id: "h3", label: "Heading 3", icon: <Type className="h-4 w-4" />, type: "heading", category: "FORMAT", level: 3 },
    { id: "bullet", label: "Bullet list", icon: <List className="h-4 w-4" />, type: "bullet-list", category: "FORMAT" },
    {
      id: "numbered",
      label: "Numbered list",
      icon: <Hash className="h-4 w-4" />,
      type: "numbered-list",
      category: "FORMAT",
    },
    {
      id: "accordion",
      label: "Accordion",
      icon: <ChevronDown className="h-4 w-4" />,
      type: "accordion",
      category: "FORMAT",
    },
    { id: "callout", label: "Callout", icon: <Lightbulb className="h-4 w-4" />, type: "callout", category: "FORMAT" },
    {
      id: "blockquote",
      label: "Blockquote",
      icon: <Quote className="h-4 w-4" />,
      type: "blockquote",
      category: "FORMAT",
    },
    { id: "code", label: "Code block", icon: <Code className="h-4 w-4" />, type: "code-block", category: "FORMAT" },
    { id: "link", label: "Link to article", icon: <Link className="h-4 w-4" />, type: "link", category: "INSERT" },
    { id: "table", label: "Table", icon: <Table className="h-4 w-4" />, type: "table", category: "INSERT" },
  ]

  const filteredCommands = slashCommands.filter((cmd) => cmd.label.toLowerCase().includes(searchQuery.toLowerCase()))

  const formatCommands = filteredCommands.filter((cmd) => cmd.category === "FORMAT")
  const insertCommands = filteredCommands.filter((cmd) => cmd.category === "INSERT")

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    if (e.key === "/") {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setSlashMenuPosition({ x: rect.left, y: rect.bottom + 5 })
        setActiveBlockId(blockId)
        setShowSlashMenu(true)
        setSearchQuery("")
      }
    } else if (e.key === "Enter" && !showSlashMenu) {
      e.preventDefault()
      addNewBlock(blockId)
    } else if (e.key === "Escape") {
      setShowSlashMenu(false)
    }
  }

  const addNewBlock = (afterBlockId: string) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type: "paragraph",
      content: "",
    }
    const blockIndex = blocks.findIndex((b) => b.id === afterBlockId)
    const newBlocks = [...blocks]
    newBlocks.splice(blockIndex + 1, 0, newBlock)
    setBlocks(newBlocks)
  }

  const handleSlashCommand = (command: SlashCommand) => {
    if (!activeBlockId) return

    const blockIndex = blocks.findIndex((b) => b.id === activeBlockId)
    if (blockIndex === -1) return

    const updatedBlocks = [...blocks]
    const currentBlock = updatedBlocks[blockIndex]

    const content = currentBlock.content.replace(/\/$/, "")

    updatedBlocks[blockIndex] = {
      ...currentBlock,
      type: command.type,
      content: content || getPlaceholderText(command.type),
      level: command.level,
    }

    setBlocks(updatedBlocks)
    setShowSlashMenu(false)
    setActiveBlockId(null)

    setTimeout(() => {
      const blockElement = document.querySelector(`[data-block-id="${activeBlockId}"]`)
      if (blockElement) {
        const input = blockElement.querySelector("input, textarea") as HTMLElement
        input?.focus()
      }
    }, 0)
  }

  const getPlaceholderText = (type: string): string => {
    switch (type) {
      case "heading":
        return "Heading"
      case "bullet-list":
        return "• List item"
      case "numbered-list":
        return "1. List item"
      case "blockquote":
        return "Quote text"
      case "code-block":
        return "// Code here"
      case "callout":
        return "💡 Important information"
      case "accordion":
        return "▼ Accordion title"
      case "table":
        return "| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |"
      default:
        return "Type something..."
    }
  }

  const updateBlockContent = (blockId: string, content: string) => {
    setBlocks(blocks.map((block) => (block.id === blockId ? { ...block, content } : block)))
  }

  const renderBlock = (block: Block) => {
    const baseClasses = "w-full border-none outline-none resize-none text-[13px] bg-transparent"

    const blockWrapper = (children: React.ReactNode) => <div data-block-id={block.id}>{children}</div>

    switch (block.type) {
      case "heading":
        const HeadingTag = `h${block.level || 1}` as keyof JSX.IntrinsicElements
        const headingSize = block.level === 1 ? "text-[13px]" : block.level === 2 ? "text-[13px]" : "text-[11px]"
        return blockWrapper(
          <HeadingTag className={`${headingSize} font-bold outline-none`}>
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlockContent(block.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              className={`${baseClasses} ${headingSize} font-bold`}
              placeholder="Heading"
            />
          </HeadingTag>,
        )
      case "bullet-list":
        return blockWrapper(
          <div className="flex items-start gap-2">
            <span className="mt-2 text-[13px]">•</span>
            <textarea
              value={block.content.replace(/^• /, "")}
              onChange={(e) => updateBlockContent(block.id, `• ${e.target.value}`)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              className={baseClasses}
              placeholder="List item"
              rows={1}
            />
          </div>,
        )
      case "numbered-list":
        return blockWrapper(
          <div className="flex items-start gap-2">
            <span className="mt-2 text-[13px]">1.</span>
            <textarea
              value={block.content.replace(/^1\. /, "")}
              onChange={(e) => updateBlockContent(block.id, `1. ${e.target.value}`)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              className={baseClasses}
              placeholder="List item"
              rows={1}
            />
          </div>,
        )
      case "blockquote":
        return blockWrapper(
          <div className="border-l-4 border-gray-300 pl-4 italic">
            <textarea
              value={block.content}
              onChange={(e) => updateBlockContent(block.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              className={`${baseClasses} italic`}
              placeholder="Quote text"
              rows={2}
            />
          </div>,
        )
      case "code-block":
        return blockWrapper(
          <div className="bg-muted rounded p-3 font-mono">
            <textarea
              value={block.content}
              onChange={(e) => updateBlockContent(block.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              className={`${baseClasses} font-mono bg-muted`}
              placeholder="// Code here"
              rows={3}
            />
          </div>,
        )
      case "callout":
        return blockWrapper(
          <div className="bg-blue-50/50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded p-3 flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
            <textarea
              value={block.content.replace(/^💡 /, "")}
              onChange={(e) => updateBlockContent(block.id, `💡 ${e.target.value}`)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              className={`${baseClasses} bg-transparent`}
              placeholder="Important information"
              rows={2}
            />
          </div>,
        )
      case "accordion":
        return blockWrapper(
          <div className="border rounded">
            <div className="p-3 bg-muted flex items-center gap-2">
              <ChevronDown className="h-4 w-4" />
              <input
                type="text"
                value={block.content.replace(/^▼ /, "")}
                onChange={(e) => updateBlockContent(block.id, `▼ ${e.target.value}`)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                className={`${baseClasses} bg-muted`}
                placeholder="Accordion title"
              />
            </div>
          </div>,
        )
      default:
        return blockWrapper(
          <textarea
            value={block.content}
            onChange={(e) => updateBlockContent(block.id, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, block.id)}
            className={baseClasses}
            placeholder="Type '/' for commands"
            rows={1}
          />,
        )
    }
  }

  const handlePublish = () => {
    console.log("[v0] Publishing article with blocks:", { title, blocks })
    alert("Article published successfully!")
    setShowPublish(false)
    router.push(`/knowledge-base/article/${params.id}`)
  }

  return (
    <PageContent
      breadcrumb={[
        { label: "Knowledge Base", href: "/knowledge-base" },
        { label: "Billing & Finance", href: "/knowledge-base/category/billing-finance" },
        { label: "Edit Article" },
      ]}
    >
      <div className="space-y-6 text-[13px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-[13px]">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-[13px] bg-transparent">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" className="text-[13px] bg-transparent">
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments
            </Button>
            <Button variant="outline" size="sm" className="text-[13px] bg-transparent">
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button variant="outline" size="sm" className="text-[13px] bg-transparent">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" size="sm" className="text-[13px] bg-transparent">
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={() => setShowPublish(true)} className="bg-[#7073fc] hover:bg-[#5a5dfc] text-[13px]">
              Publish
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-[13px] font-bold border-none p-0 focus-visible:ring-0"
                  placeholder="Article title"
                />
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[11px]">
                    Draft
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div ref={editorRef} className="space-y-4 min-h-[500px]">
                  {blocks.map((block) => (
                    <div key={block.id} className="group relative">
                      {renderBlock(block)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Editor Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-[13px]">
                <p>
                  • Type <code>/</code> to open block menu
                </p>
                <p>
                  • Press <code>Enter</code> to create new block
                </p>
                <p>
                  • Use <code>Escape</code> to close menus
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Slash Command Menu */}
      {showSlashMenu && (
        <div
          className="fixed bg-popover border rounded-lg shadow-lg z-50 w-64 max-h-80 overflow-y-auto"
          style={{ left: slashMenuPosition.x, top: slashMenuPosition.y }}
        >
          <div className="p-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commands..."
              className="text-[13px]"
              autoFocus
            />
          </div>

          {formatCommands.length > 0 && (
            <div>
              <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">FORMAT</div>
              {formatCommands.map((command) => (
                <button
                  key={command.id}
                  onClick={() => handleSlashCommand(command)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 text-[13px]"
                >
                  {command.icon}
                  {command.label}
                </button>
              ))}
            </div>
          )}

          {insertCommands.length > 0 && (
            <div>
              <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">INSERT</div>
              {insertCommands.map((command) => (
                <button
                  key={command.id}
                  onClick={() => handleSlashCommand(command)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 text-[13px]"
                >
                  {command.icon}
                  {command.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Publish Dialog */}
      <Dialog open={showPublish} onOpenChange={setShowPublish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Article</DialogTitle>
            <DialogDescription className="text-[13px]">
              Are you sure you want to publish this article? It will be visible to all users.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublish(false)} className="text-[13px]">
              Cancel
            </Button>
            <Button onClick={handlePublish} className="bg-[#7073fc] hover:bg-[#5a5dfc] text-[13px]">
              Publish Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContent>
  )
}
