import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function RecentTickets() {
  const tickets = [
    {
      id: "BSM000001",
      title: "Laptop replacement request",
      status: "in_progress",
      priority: "medium",
      assignee: "IT Support",
      created: "2 hours ago",
    },
    {
      id: "BSM000002",
      title: "VPN access not working",
      status: "open",
      priority: "high",
      assignee: "Network Team",
      created: "4 hours ago",
    },
    {
      id: "BSM000003",
      title: "New employee onboarding",
      status: "pending",
      priority: "medium",
      assignee: "HR Team",
      created: "1 day ago",
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
    <Card>
      <CardHeader>
        <CardTitle>Recent Tickets</CardTitle>
        <CardDescription>Latest service requests and incidents</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-sm">{ticket.id}</span>
                  <Badge variant={getStatusColor(ticket.status)} className="text-xs">
                    {ticket.status.replace("_", " ")}
                  </Badge>
                  <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                    {ticket.priority}
                  </Badge>
                </div>
                <h4 className="font-medium">{ticket.title}</h4>
                <p className="text-sm text-muted-foreground">
                  Assigned to {ticket.assignee} • {ticket.created}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
