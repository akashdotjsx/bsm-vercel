"use client"

import { PlatformLayout } from "@/components/layout/platform-layout"
import { Button } from "@/components/ui/button"
import { MessageSquare, Users, Clock, Zap } from "lucide-react"

export default function LiveChatPage() {
  return (
    <PlatformLayout
      breadcrumb={[
        { label: "Customer Support", href: "/dashboard" },
        { label: "Live Chat", href: "/live-chat" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Live Chat</h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time customer support conversations</p>
          </div>
          <Button>
            <MessageSquare className="mr-2 h-4 w-4" />
            Start New Chat
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Chats</p>
                <p className="text-2xl font-semibold">12</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Queue</p>
                <p className="text-2xl font-semibold">3</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-semibold">2m</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Satisfaction</p>
                <p className="text-2xl font-semibold">4.8</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface Placeholder */}
        <div className="bg-card rounded-lg border p-8 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Live Chat Interface</h3>
          <p className="text-muted-foreground mb-4">
            Real-time chat interface would be implemented here with WebSocket connections
          </p>
          <Button>Initialize Chat System</Button>
        </div>
      </div>
    </PlatformLayout>
  )
}
