"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, FileText, Download } from "lucide-react"
import { format, subDays } from "date-fns"

export default function DetailedReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [reportData, setReportData] = useState<any[]>([])
  const [reportTitle, setReportTitle] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const title = searchParams.get("title") || "Detailed Report"
    const cat = searchParams.get("category") || "general"
    const itemName = searchParams.get("item") || "Unknown"

    console.log("[v0] Detailed report page: Loading data for", { title, cat, itemName })

    setReportTitle(`${itemName} - Detailed Report`)
    setCategory(cat)

    // Generate mock detailed data
    const mockDetailedData = Array.from({ length: Math.floor(Math.random() * 50) + 20 }, (_, index) => ({
      id: `TKT-${String(index + 1).padStart(4, "0")}`,
      title: `Sample ticket for ${itemName} - ${index + 1}`,
      department: cat === "department" ? itemName : ["IT", "HR", "Finance", "Legal"][Math.floor(Math.random() * 4)],
      type: cat === "type" ? itemName : ["Incident", "Request", "Change", "Problem"][Math.floor(Math.random() * 4)],
      status:
        cat === "status" ? itemName : ["Open", "In Progress", "Resolved", "Closed"][Math.floor(Math.random() * 4)],
      priority: cat === "priority" ? itemName : ["Critical", "High", "Medium", "Low"][Math.floor(Math.random() * 4)],
      assignee: ["John Smith", "Sarah Johnson", "Mike Chen", "Emily Davis", "Unassigned"][
        Math.floor(Math.random() * 5)
      ],
      account: ["Acme Corp", "TechStart Inc", "Global Solutions", "Innovation Labs"][Math.floor(Math.random() * 4)],
      created: format(subDays(new Date(), Math.floor(Math.random() * 30)), "yyyy-MM-dd HH:mm"),
      updated: format(subDays(new Date(), Math.floor(Math.random() * 7)), "yyyy-MM-dd HH:mm"),
      resolutionTime: `${Math.floor(Math.random() * 48) + 1}h ${Math.floor(Math.random() * 60)}m`,
      slaStatus: Math.random() > 0.2 ? "Met" : "Breached",
      customerRating: Math.floor(Math.random() * 5) + 1,
    }))

    setReportData(mockDetailedData)
    setLoading(false)

    console.log("[v0] Detailed report page: Data loaded successfully", mockDetailedData.length, "records")
  }, []) // Empty dependency array to run only once on mount

  const exportReport = (format: "csv" | "pdf") => {
    if (format === "csv") {
      const headers = [
        "Ticket ID",
        "Title",
        "Department",
        "Type",
        "Status",
        "Priority",
        "Assignee",
        "Account",
        "Created",
        "Updated",
        "Resolution Time",
        "SLA Status",
        "Rating",
      ]

      const csvContent = [
        headers.join(","),
        ...reportData.map((ticket) =>
          [
            ticket.id,
            `"${ticket.title.replace(/"/g, '""')}"`,
            ticket.department,
            ticket.type,
            ticket.status,
            ticket.priority,
            ticket.assignee,
            ticket.account,
            ticket.created,
            ticket.updated,
            ticket.resolutionTime,
            ticket.slaStatus,
            ticket.customerRating,
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${reportTitle.replace(/[^a-z0-9]/gi, "_")}_detailed_report.csv`
      link.click()
    } else if (format === "pdf") {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            h1 { color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; }
            .status-open { background-color: #fee2e2; color: #dc2626; }
            .status-progress { background-color: #dbeafe; color: #2563eb; }
            .status-resolved { background-color: #f0fdf4; color: #16a34a; }
            .priority-critical { background-color: #fee2e2; color: #dc2626; }
            .priority-high { background-color: #fef3c7; color: #d97706; }
          </style>
        </head>
        <body>
          <h1>${reportTitle}</h1>
          <p>Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}</p>
          <p>Total Records: ${reportData.length}</p>
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th><th>Title</th><th>Department</th><th>Type</th>
                <th>Status</th><th>Priority</th><th>Assignee</th><th>Account</th>
                <th>Created</th><th>Resolution Time</th><th>SLA Status</th><th>Rating</th>
              </tr>
            </thead>
            <tbody>
              ${reportData
                .map(
                  (ticket) => `
                <tr>
                  <td>${ticket.id}</td>
                  <td>${ticket.title}</td>
                  <td>${ticket.department}</td>
                  <td>${ticket.type}</td>
                  <td><span class="badge status-${ticket.status.toLowerCase().replace(" ", "-")}">${ticket.status}</span></td>
                  <td><span class="badge priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span></td>
                  <td>${ticket.assignee}</td>
                  <td>${ticket.account}</td>
                  <td>${ticket.created}</td>
                  <td>${ticket.resolutionTime}</td>
                  <td>${ticket.slaStatus}</td>
                  <td>${ticket.customerRating}/5</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </body>
        </html>
      `

      const blob = new Blob([htmlContent], { type: "text/html" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${reportTitle.replace(/[^a-z0-9]/gi, "_")}_detailed_report.html`
      link.click()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/bsm/analytics")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Analytics
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 text-[13px] leading-relaxed">{reportTitle}</h1>
                <p className="text-[13px] text-gray-600 mt-1 leading-relaxed">
                  Detailed breakdown of tickets • {reportData.length} records
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => exportReport("csv")} className="text-[13px]">
                <FileText className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => exportReport("pdf")} className="text-[13px]">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card p-4 rounded-lg shadow-sm">
              <div className="text-[13px] text-gray-600 leading-relaxed">Total Tickets</div>
              <div className="text-2xl font-semibold text-gray-900">{reportData.length}</div>
            </div>
            <div className="bg-card p-4 rounded-lg shadow-sm">
              <div className="text-[13px] text-gray-600 leading-relaxed">Open Tickets</div>
              <div className="text-2xl font-semibold text-red-600">
                {reportData.filter((t) => t.status === "Open").length}
              </div>
            </div>
            <div className="bg-card p-4 rounded-lg shadow-sm">
              <div className="text-[13px] text-gray-600 leading-relaxed">Resolved Tickets</div>
              <div className="text-2xl font-semibold text-green-600">
                {reportData.filter((t) => t.status === "Resolved").length}
              </div>
            </div>
            <div className="bg-card p-4 rounded-lg shadow-sm">
              <div className="text-[13px] text-gray-600 leading-relaxed">SLA Compliance</div>
              <div className="text-2xl font-semibold text-blue-600">
                {Math.round((reportData.filter((t) => t.slaStatus === "Met").length / reportData.length) * 100)}%
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[13px] leading-relaxed">Ticket ID</TableHead>
                  <TableHead className="text-[13px] leading-relaxed">Title</TableHead>
                  <TableHead className="text-[13px] leading-relaxed">Department</TableHead>
                  <TableHead className="text-[13px] leading-relaxed">Type</TableHead>
                  <TableHead className="text-[13px] leading-relaxed">Status</TableHead>
                  <TableHead className="text-[13px] leading-relaxed">Priority</TableHead>
                  <TableHead className="text-[13px] leading-relaxed">Assignee</TableHead>
                  <TableHead className="text-[13px] leading-relaxed">Account</TableHead>
                  <TableHead className="text-[13px] leading-relaxed">Created</TableHead>
                  <TableHead className="text-[13px] leading-relaxed">Resolution Time</TableHead>
                  <TableHead className="text-[13px] leading-relaxed">SLA Status</TableHead>
                  <TableHead className="text-[13px] leading-relaxed">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((ticket, index) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-[13px] leading-relaxed">{ticket.id}</TableCell>
                    <TableCell className="text-[13px] leading-relaxed max-w-xs truncate" title={ticket.title}>
                      {ticket.title}
                    </TableCell>
                    <TableCell className="text-[13px] leading-relaxed">{ticket.department}</TableCell>
                    <TableCell className="text-[13px] leading-relaxed">
                      <Badge variant="outline" className="text-[13px]">
                        {ticket.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[13px] leading-relaxed">
                      <Badge
                        variant={
                          ticket.status === "Open"
                            ? "destructive"
                            : ticket.status === "In Progress"
                              ? "default"
                              : ticket.status === "Resolved"
                                ? "secondary"
                                : "outline"
                        }
                        className="text-[13px]"
                      >
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[13px] leading-relaxed">
                      <Badge
                        variant={
                          ticket.priority === "Critical" || ticket.priority === "High"
                            ? "destructive"
                            : ticket.priority === "Medium"
                              ? "default"
                              : "secondary"
                        }
                        className="text-[13px]"
                      >
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[13px] leading-relaxed">{ticket.assignee}</TableCell>
                    <TableCell className="text-[13px] leading-relaxed">{ticket.account}</TableCell>
                    <TableCell className="text-[13px] leading-relaxed">{ticket.created}</TableCell>
                    <TableCell className="text-[13px] leading-relaxed">{ticket.resolutionTime}</TableCell>
                    <TableCell className="text-[13px] leading-relaxed">
                      <Badge variant={ticket.slaStatus === "Met" ? "secondary" : "destructive"} className="text-[13px]">
                        {ticket.slaStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[13px] leading-relaxed">{ticket.customerRating}/5</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
