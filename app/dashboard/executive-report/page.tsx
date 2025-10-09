"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, TrendingUp } from "lucide-react"

interface ExecutiveReportData {
  summary: {
    totalValue: string
    change: number
    trend: "up" | "down"
    period: string
  }
  details: Array<{
    id: string
    metric: string
    value: string
    change: number
    status: "excellent" | "good" | "needs-attention"
    description: string
    impact: string
  }>
}

export default function ExecutiveReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [reportData, setReportData] = useState<ExecutiveReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const reportTitle = useMemo(() => searchParams.get("title") || "Executive Report", [searchParams])
  const category = useMemo(() => searchParams.get("category") || "general", [searchParams])
  const itemName = useMemo(() => searchParams.get("itemName") || "Unknown", [searchParams])

  useEffect(() => {
    console.log(`[v0] Executive report page: Loading data for`, { reportTitle, category, itemName })

    const generateReportData = (): ExecutiveReportData => {
      const baseDetails = [
        {
          id: "1",
          metric: "Strategic Impact",
          value: "$2.4M",
          change: 18.5,
          status: "excellent" as const,
          description: "Significant positive impact on business objectives",
          impact: "High strategic value delivered to stakeholders",
        },
        {
          id: "2",
          metric: "Operational Excellence",
          value: "94.2%",
          change: 12.3,
          status: "excellent" as const,
          description: "Exceeding operational efficiency targets",
          impact: "Streamlined processes and reduced overhead",
        },
        {
          id: "3",
          metric: "Customer Experience",
          value: "4.8/5",
          change: 8.7,
          status: "good" as const,
          description: "Strong customer satisfaction scores",
          impact: "Enhanced customer loyalty and retention",
        },
        {
          id: "4",
          metric: "Risk Management",
          value: "98.1%",
          change: 5.4,
          status: "excellent" as const,
          description: "Comprehensive risk mitigation coverage",
          impact: "Reduced business risk exposure",
        },
        {
          id: "5",
          metric: "Innovation Index",
          value: "87%",
          change: 15.2,
          status: "good" as const,
          description: "Strong innovation and digital transformation",
          impact: "Future-ready technology capabilities",
        },
      ]

      return {
        summary: {
          totalValue: "$2.4M",
          change: 18.5,
          trend: "up",
          period: "Q2 2024",
        },
        details: baseDetails,
      }
    }

    const data = generateReportData()
    setReportData(data)
    setLoading(false)

    console.log(`[v0] Executive report page: Data loaded successfully`, data.details.length, "metrics")
  }, [reportTitle, category, itemName])

  const handleExport = (format: "csv" | "pdf") => {
    if (!reportData) return

    console.log(`[v0] Exporting executive report as ${format.toUpperCase()}`)

    if (format === "csv") {
      const csvData = [
        ["Metric", "Value", "Change %", "Status", "Description", "Business Impact"],
        ...reportData.details.map((item) => [
          item.metric,
          item.value,
          `${item.change}%`,
          item.status,
          item.description,
          item.impact,
        ]),
      ]

      const csvContent = csvData.map((row) => row.join(",")).join("\n")
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `executive-report-${itemName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      // PDF export as HTML
      const htmlContent = `
        <html>
          <head>
            <title>${reportTitle}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
              .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
              .metric-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: white; }
              .metric-value { font-size: 24px; font-weight: bold; color: #333; margin: 10px 0; }
              .metric-change { color: #10b981; font-weight: bold; }
              .status-excellent { color: #10b981; }
              .status-good { color: #3b82f6; }
              .status-needs-attention { color: #f59e0b; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${reportTitle}</h1>
              <p>Generated on ${new Date().toLocaleDateString()} | Period: ${reportData.summary.period}</p>
            </div>
            <div class="summary">
              <h2>Executive Summary</h2>
              <p><strong>Total Value:</strong> ${reportData.summary.totalValue}</p>
              <p><strong>Change:</strong> <span class="metric-change">+${reportData.summary.change}%</span></p>
            </div>
            <div class="metric-grid">
              ${reportData.details
                .map(
                  (item) => `
                <div class="metric-card">
                  <h3>${item.metric}</h3>
                  <div class="metric-value">${item.value}</div>
                  <p class="metric-change">+${item.change}%</p>
                  <p class="status-${item.status}"><strong>Status:</strong> ${item.status.replace("-", " ").toUpperCase()}</p>
                  <p><strong>Description:</strong> ${item.description}</p>
                  <p><strong>Business Impact:</strong> ${item.impact}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </body>
        </html>
      `

      const blob = new Blob([htmlContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `executive-report-${itemName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.html`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => router.back()} className="text-[13px]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-[13px] font-semibold tracking-tight">{reportTitle}</h1>
              <p className="text-[13px] text-muted-foreground">
                Detailed executive analysis for {itemName} • {reportData?.summary.period}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleExport("csv")} className="text-[13px]">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} className="text-[13px]">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-[11px] font-semibold flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-[13px] font-bold text-green-600">{reportData?.summary.totalValue}</div>
                <div className="text-[13px] text-muted-foreground">Total Business Value</div>
              </div>
              <div className="text-center">
                <div className="text-[13px] font-bold text-blue-600">+{reportData?.summary.change}%</div>
                <div className="text-[13px] text-muted-foreground">Performance Change</div>
              </div>
              <div className="text-center">
                <div className="text-[13px] font-bold text-purple-600">{reportData?.summary.period}</div>
                <div className="text-[13px] text-muted-foreground">Reporting Period</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportData?.details.map((item) => (
            <Card key={item.id} className="bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[11px] font-semibold">{item.metric}</CardTitle>
                  <Badge
                    variant={item.status === "excellent" ? "default" : item.status === "good" ? "secondary" : "outline"}
                    className="text-[11px]"
                  >
                    {item.status.replace("-", " ").toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[13px] font-bold">{item.value}</div>
                    <div className="flex items-center text-green-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span className="text-[13px] font-medium">+{item.change}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-[13px] font-medium text-muted-foreground">Description</div>
                      <div className="text-[13px]">{item.description}</div>
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-muted-foreground">Business Impact</div>
                      <div className="text-[13px]">{item.impact}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
