import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, User, MessageSquare, Paperclip, Edit } from "lucide-react"
import { PlatformLayout } from "@/components/layout/platform-layout"

interface TicketDetailPageProps {
  params: {
    id: string
  }
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  // Mock ticket data - in real app, fetch from API
  const ticket = {
    id: params.id,
    title: "Laptop replacement request",
    description:
      "Current laptop is running slow and needs replacement. The system frequently freezes and takes a long time to boot up. This is affecting my productivity significantly.",
    status: "in_progress",
    priority: "medium",
    assignee: {
      name: "IT Support Team",
      email: "it-support@kroolo.com",
      avatar: "/placeholder.svg",
    },
    requester: {
      name: "John Doe",
      email: "john.doe@kroolo.com",
      avatar: "/placeholder.svg",
    },
    created: "2024-01-15T10:30:00Z",
    updated: "2024-01-15T14:20:00Z",
    category: "IT Equipment",
    subcategory: "Hardware Request",
    sla: "2 business days",
    attachments: [
      { name: "laptop-specs.pdf", size: "245 KB" },
      { name: "performance-screenshot.png", size: "1.2 MB" },
    ],
  }

  const comments = [
    {
      id: 1,
      author: "John Doe",
      avatar: "/placeholder.svg",
      content: "I've attached the current laptop specifications and a screenshot showing the performance issues.",
      timestamp: "2024-01-15T10:35:00Z",
      type: "user",
    },
    {
      id: 2,
      author: "IT Support",
      avatar: "/placeholder.svg",
      content:
        "Thank you for the details. I've reviewed your request and current laptop specs. We'll need to order a new laptop for you. I'll update you once the order is placed.",
      timestamp: "2024-01-15T14:20:00Z",
      type: "agent",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "destructive"
      case "in_progress":
        return "default"
      case "pending":
        return "secondary"
      case "resolved":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  return (
    <PlatformLayout breadcrumb={[{ label: "Tickets", href: "/tickets" }, { label: `#${ticket.id}` }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{ticket.title}</h1>
            <p className="text-sm text-muted-foreground">Ticket #{ticket.id}</p>
          </div>
          <Button size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Ticket
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Details */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{ticket.description}</p>

                {ticket.attachments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Attachments</h4>
                    <div className="space-y-2">
                      {ticket.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-primary hover:underline cursor-pointer">{attachment.name}</span>
                          <span className="text-muted-foreground">({attachment.size})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{comment.author[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{comment.author}</span>
                        <Badge variant={comment.type === "agent" ? "default" : "secondary"} className="text-xs">
                          {comment.type === "agent" ? "Agent" : "User"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))}

                <div className="mt-6">
                  <Textarea placeholder="Add a comment..." className="min-h-[100px]" />
                  <div className="flex justify-between items-center mt-2">
                    <Button variant="outline" size="sm">
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attach File
                    </Button>
                    <Button size="sm">Add Comment</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={getStatusColor(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Priority</span>
                  <Badge variant={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                </div>

                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Assignee</span>
                  <Select defaultValue="current">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">{ticket.assignee.name}</SelectItem>
                      <SelectItem value="network">Network Team</SelectItem>
                      <SelectItem value="security">Security Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Select defaultValue={ticket.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Requester:</span>
                  <span>{ticket.requester.name}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(ticket.created).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Updated:</span>
                  <span>{new Date(ticket.updated).toLocaleDateString()}</span>
                </div>

                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <span className="ml-2">{ticket.category}</span>
                </div>

                <div>
                  <span className="text-muted-foreground">SLA:</span>
                  <span className="ml-2">{ticket.sla}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PlatformLayout>
  )
}
