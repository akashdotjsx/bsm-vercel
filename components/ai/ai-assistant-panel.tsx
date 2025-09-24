"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Bot,
  Zap,
  Target,
  MessageSquare,
  TrendingUp,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Users,
  Clock,
} from "lucide-react"

interface AIInsight {
  type: "triage" | "sentiment" | "suggestion" | "escalation" | "knowledge"
  title: string
  description: string
  confidence: number
  action?: string
  priority?: "low" | "medium" | "high" | "critical"
}

export function AIAssistantPanel({ ticketId }: { ticketId?: string }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [workflowPrompt, setWorkflowPrompt] = useState("")

  const aiInsights: AIInsight[] = [
    {
      type: "triage",
      title: "Auto-Classification Complete",
      description:
        "Classified as Incident → IT Operations → Authentication. Suggested assignee: John Smith (Security Team)",
      confidence: 94,
      action: "Apply Classification",
      priority: "high",
    },
    {
      type: "sentiment",
      title: "Customer Sentiment: Frustrated",
      description:
        'Detected escalation risk. Customer mentioned "third time" and "urgent". Recommend priority escalation.',
      confidence: 87,
      action: "Escalate to Manager",
      priority: "critical",
    },
    {
      type: "suggestion",
      title: "Similar Ticket Detected",
      description: "Found 3 similar tickets resolved in last 30 days. Average resolution time: 2.5 hours.",
      confidence: 91,
      action: "View Similar Cases",
    },
    {
      type: "knowledge",
      title: "Knowledge Article Suggested",
      description: 'KB-401: "Authentication Issues Troubleshooting" matches this ticket (89% relevance)',
      confidence: 89,
      action: "Attach Article",
    },
  ]

  const generateWorkflow = async () => {
    setIsGenerating(true)
    // Simulate AI workflow generation
    setTimeout(() => {
      setIsGenerating(false)
    }, 2000)
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "triage":
        return <Target className="h-4 w-4" />
      case "sentiment":
        return <TrendingUp className="h-4 w-4" />
      case "suggestion":
        return <MessageSquare className="h-4 w-4" />
      case "escalation":
        return <AlertTriangle className="h-4 w-4" />
      case "knowledge":
        return <BookOpen className="h-4 w-4" />
      default:
        return <Bot className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  return (
    <div className="space-y-4">
      {/* AI Workflow Generator */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#7073fc]" />
            AI Workflow Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Describe your workflow in natural language... e.g., 'Create approval workflow for budget requests over $5000 with finance team review'"
            value={workflowPrompt}
            onChange={(e) => setWorkflowPrompt(e.target.value)}
            className="min-h-[80px] text-sm"
          />
          <Button
            onClick={generateWorkflow}
            disabled={!workflowPrompt.trim() || isGenerating}
            className="w-full bg-[#7073fc] hover:bg-[#5a5dfc]"
            size="sm"
          >
            {isGenerating ? (
              <>
                <Bot className="h-4 w-4 mr-2 animate-spin" />
                Generating Workflow...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate Complete Workflow
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bot className="h-4 w-4 text-[#7073fc]" />
            AI Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {aiInsights.map((insight, index) => (
            <div key={index} className="p-3 rounded-lg border bg-highlight">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getInsightIcon(insight.type)}
                  <span className="font-medium text-sm">{insight.title}</span>
                  {insight.priority && (
                    <Badge variant="outline" className={`text-xs ${getPriorityColor(insight.priority)}`}>
                      {insight.priority}
                    </Badge>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {insight.confidence}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{insight.description}</p>
              {insight.action && (
                <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent">
                  {insight.action}
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick AI Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#7073fc]" />
            Quick AI Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8 bg-transparent">
            <MessageSquare className="h-3 w-3 mr-2" />
            Generate Response Draft
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8 bg-transparent">
            <Users className="h-3 w-3 mr-2" />
            Suggest Best Assignee
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8 bg-transparent">
            <Clock className="h-3 w-3 mr-2" />
            Predict Resolution Time
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8 bg-transparent">
            <BookOpen className="h-3 w-3 mr-2" />
            Find Related Articles
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
