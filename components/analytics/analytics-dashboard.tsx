"use client"

import { useState, useEffect } from "react"
import { useMode } from "@/lib/contexts/mode-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Clock, CheckCircle, Users, Download, Activity } from "lucide-react"
import { addDays, format, subDays, startOfMonth, endOfMonth } from "date-fns"
import type { DateRange } from "react-day-picker"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js"
import { Bar, Pie } from "react-chartjs-2"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement)

interface AnalyticsData {
  kpis: {
    totalTickets: { value: number; change: number; trend: "up" | "down" }
    avgResolutionTime: { value: string; change: number; trend: "up" | "down" }
    slaCompliance: { value: string; change: number; trend: "up" | "down" }
    customerSatisfaction: { value: string; change: number; trend: "up" | "down" }
  }
  ticketsByDepartment: Array<{ name: string; value: number; color: string }>
  ticketsByType: Array<{ name: string; value: number; color: string }>
  ticketsByStatus: Array<{ name: string; value: number; color: string }>
  ticketsByPriority: Array<{ name: string; value: number; color: string }>
  ticketsByAssignee: Array<{ name: string; value: number; color: string }>
  ticketTrends: Array<{ date: string; created: number; resolved: number; backlog: number }>
  slaPerformance: Array<{ department: string; onTime: number; breached: number }>
}

const COLORS = {
  departments: ["#3b82f6", "#10b981", "#f59e0b", "#7073fc", "#f97316", "#ef4444"],
  types: ["#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#7073fc"],
  status: ["#f59e0b", "#3b82f6", "#10b981", "#6b7280"],
  priority: ["#dc2626", "#f97316", "#eab308", "#22c55e"],
}

const AnalyticsDashboard = () => {
  const router = useRouter()
  const { mode } = useMode()
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  })
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [chartType, setChartType] = useState("bar")
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; content: string }>({
    visible: false,
    x: 0,
    y: 0,
    content: "",
  })

  const supabase = createClient()

  const applyRealtimeKpis = (totalTicketsCount: number) => {
    setAnalyticsData((prev) => {
      const base = prev ?? getMockAnalyticsData()
      return {
        ...base,
        kpis: {
          totalTickets: { value: totalTicketsCount, change: 0, trend: "up" },
          avgResolutionTime: { value: "0", change: 0, trend: "up" },
          slaCompliance: { value: "0", change: 0, trend: "up" },
          customerSatisfaction: { value: "0", change: 0, trend: "up" },
        },
      }
    })
  }

  const refreshTotalTickets = async () => {
    const { count, error } = await supabase.from("tickets").select("*", { count: "exact", head: true })
    if (error) {
      console.warn("[analytics] Failed to fetch total tickets count:", error.message)
      applyRealtimeKpis(0)
      return
    }
    applyRealtimeKpis(count ?? 0)
  }

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("[analytics] Dashboard: fetching real data from Supabase")

      // Load tickets minimal fields for analytics
      const { data: tickets, error } = await supabase
        .from("tickets")
        .select(`
          id,
          type,
          status,
          priority,
          created_at,
          resolved_at,
          assignee:profiles!tickets_assignee_id_fkey(display_name,department)
        `)

      if (error) {
        console.error("[analytics] Failed to load tickets for analytics:", error.message)
        // Build empty analytics structure; graphs will show 'No data'.
        setAnalyticsData({
          kpis: {
            totalTickets: { value: 0, change: 0, trend: "up" },
            avgResolutionTime: { value: "0", change: 0, trend: "up" },
            slaCompliance: { value: "0", change: 0, trend: "up" },
            customerSatisfaction: { value: "0", change: 0, trend: "up" },
          },
          ticketsByDepartment: [],
          ticketsByType: [],
          ticketsByStatus: [],
          ticketsByPriority: [],
          ticketsByAssignee: [],
          ticketTrends: [],
          // Preserve the existing SLA Performance card (no changes requested)
          slaPerformance: getMockAnalyticsData().slaPerformance,
        })
      } else {
        // Compute analytics from real tickets
        const ticketsByDepartment = groupTicketsBy(
          tickets || [],
          "assignee.department",
          COLORS.departments,
        )
        const ticketsByType = groupTicketsBy(tickets || [], "type", COLORS.types)
        const ticketsByStatus = groupTicketsBy(tickets || [], "status", COLORS.status)
        const ticketsByPriority = groupTicketsBy(tickets || [], "priority", COLORS.priority)
        const ticketsByAssignee = groupTicketsBy(
          (tickets || []).map((t: any) => ({ assignee: { display_name: t.assignee?.display_name || "Unassigned" } })),
          "assignee.display_name",
          COLORS.departments,
        )
        const ticketTrends = calculateTrends(tickets || [])

        setAnalyticsData({
          kpis: {
            totalTickets: { value: tickets?.length || 0, change: 0, trend: "up" },
            avgResolutionTime: { value: "0", change: 0, trend: "up" },
            slaCompliance: { value: "0", change: 0, trend: "up" },
            customerSatisfaction: { value: "0", change: 0, trend: "up" },
          },
          ticketsByDepartment,
          ticketsByType,
          ticketsByStatus,
          ticketsByPriority,
          ticketsByAssignee,
          ticketTrends,
          // Preserve the existing SLA Performance card (no changes requested)
          slaPerformance: getMockAnalyticsData().slaPerformance,
        })
      }

      // Hydrate KPI total from count endpoint (authoritative), do not block UI
      refreshTotalTickets().catch(() => applyRealtimeKpis(0))
      console.log("[analytics] Dashboard: real data loaded (graphs from Supabase, KPIs realtime)")
    } catch (error) {
      console.error("[v0] Analytics Dashboard: Error fetching analytics:", error)
      setError("Failed to load analytics data")
      setAnalyticsData(getMockAnalyticsData()) // Fallback to mock data
    } finally {
      setLoading(false)
    }
  }

  const groupTicketsBy = (tickets: any[], field: string, colors: string[]) => {
    const groups =
      tickets?.reduce(
        (acc, ticket) => {
          let value = ticket
          const fieldParts = field.split(".")
          for (const part of fieldParts) {
            value = value?.[part]
          }
          const key = value || "Unknown"
          acc[key] = (acc[key] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ) || {}

    return Object.entries(groups).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }))
  }

  const calculateTrends = (tickets: any[]) => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = subDays(new Date(), i * 30)
      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)

      const monthTickets =
        tickets?.filter((t) => {
          const created = new Date(t.created_at)
          return created >= monthStart && created <= monthEnd
        }) || []

      const resolvedInMonth =
        tickets?.filter((t) => {
          if (!t.resolved_at) return false
          const resolved = new Date(t.resolved_at)
          return resolved >= monthStart && resolved <= monthEnd
        }) || []

      months.push({
        date: format(date, "MMM"),
        created: monthTickets.length,
        resolved: resolvedInMonth.length,
        backlog: Math.max(0, monthTickets.length - resolvedInMonth.length),
      })
    }
    return months
  }

  const calculateSLAPerformance = (tickets: any[]) => {
    const departments = ["IT", "HR", "Finance", "Legal", "Facilities", "Security"]
    return departments.map((dept) => {
      const deptTickets = tickets?.filter((t) => t.department === dept) || []
      const onTimeTickets = deptTickets.filter((t) => {
        if (!t.resolved_at || !t.due_date) return false
        return new Date(t.resolved_at) <= new Date(t.due_date)
      })
      const onTimePercentage = deptTickets.length > 0 ? (onTimeTickets.length / deptTickets.length) * 100 : 0
      return {
        department: dept,
        onTime: Math.round(onTimePercentage),
        breached: Math.round(100 - onTimePercentage),
      }
    })
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange, selectedDepartment])

  // Realtime subscription for tickets count only (keep graphs unchanged)
  useEffect(() => {
    const channel = supabase
      .channel("realtime-tickets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => {
          // Refresh total and re-build graphs from latest data
          refreshTotalTickets()
          fetchAnalyticsData()
        },
      )
      .subscribe()

    return () => {
      try {
        supabase.removeChannel(channel)
      } catch {}
    }
  }, [])

  const handleExport = async (format: "pdf" | "csv") => {
    if (!analyticsData) return

    try {
      const exportData = {
        dateRange: {
          from: dateRange?.from?.toISOString(),
          to: dateRange?.to?.toISOString(),
        },
        kpis: analyticsData.kpis,
        ticketsByDepartment: analyticsData.ticketsByDepartment,
        ticketsByType: analyticsData.ticketsByType,
        ticketsByStatus: analyticsData.ticketsByStatus,
        ticketsByPriority: analyticsData.ticketsByPriority,
        generatedAt: new Date().toISOString(),
      }

      if (format === "csv") {
        const csvContent = convertToCSV(exportData)
        downloadFile(csvContent, `analytics-report-${format(new Date(), "yyyy-MM-dd")}.csv`, "text/csv")
      } else {
        const pdfContent = convertToPDF(exportData)
        downloadFile(pdfContent, `analytics-report-${format(new Date(), "yyyy-MM-dd")}.txt`, "text/plain")
      }

      alert(`Analytics report exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error("Export error:", error)
      alert("Export failed. Please try again.")
    }
  }

  const convertToCSV = (data: any) => {
    let csv = "Analytics Report\n\n"
    csv += "KPIs\n"
    csv += "Metric,Value,Change,Trend\n"
    csv += `Total Tickets,${data.kpis.totalTickets.value},${data.kpis.totalTickets.change}%,${data.kpis.totalTickets.trend}\n`
    csv += `Avg Resolution Time,${data.kpis.avgResolutionTime.value},${data.kpis.avgResolutionTime.change}%,${data.kpis.avgResolutionTime.trend}\n`
    csv += `SLA Compliance,${data.kpis.slaCompliance.value},${data.kpis.slaCompliance.change}%,${data.kpis.slaCompliance.trend}\n`
    csv += `Customer Satisfaction,${data.kpis.customerSatisfaction.value},${data.kpis.customerSatisfaction.change},${data.kpis.customerSatisfaction.trend}\n\n`

    csv += "Tickets by Department\n"
    csv += "Department,Count\n"
    data.ticketsByDepartment.forEach((item: any) => {
      csv += `${item.name},${item.value}\n`
    })

    return csv
  }

  const convertToPDF = (data: any) => {
    let content = "ANALYTICS REPORT\n"
    content += "================\n\n"
    content += `Generated: ${new Date().toLocaleString()}\n`
    content += `Period: ${data.dateRange.from} to ${data.dateRange.to}\n\n`

    content += "KEY PERFORMANCE INDICATORS\n"
    content += "--------------------------\n"
    content += `Total Tickets: ${data.kpis.totalTickets.value} (${data.kpis.totalTickets.change}% ${data.kpis.totalTickets.trend})\n`
    content += `Avg Resolution Time: ${data.kpis.avgResolutionTime.value} (${data.kpis.avgResolutionTime.change}% ${data.kpis.avgResolutionTime.trend})\n`
    content += `SLA Compliance: ${data.kpis.slaCompliance.value} (${data.kpis.slaCompliance.change}% ${data.kpis.slaCompliance.trend})\n`
    content += `Customer Satisfaction: ${data.kpis.customerSatisfaction.value} (${data.kpis.customerSatisfaction.change} ${data.kpis.customerSatisfaction.trend})\n\n`

    content += "TICKETS BY DEPARTMENT\n"
    content += "--------------------\n"
    data.ticketsByDepartment.forEach((item: any) => {
      content += `${item.name}: ${item.value}\n`
    })

    return content
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const renderChart = (chartData: any[], title: string, category: string) => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-[10px]">No data available</p>
          </div>
        </div>
      )
    }

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: {
            font: {
              size: 12,
            },
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: "#fff",
          titleColor: "#374151",
          bodyColor: "#374151",
          borderColor: "#e5e7eb",
          borderWidth: 1,
          cornerRadius: 6,
          titleFont: {
            size: 12,
          },
          bodyFont: {
            size: 12,
          },
        },
      },
      onClick: (event: any, elements: any) => {
        if (elements.length > 0) {
          const index = elements[0].index
          const item = chartData[index]
          handleChartClick(item, category)
        }
      },
      scales:
        chartType === "pie"
          ? {}
          : {
              x: {
                ticks: {
                  font: {
                    size: 12,
                  },
                },
              },
              y: {
                ticks: {
                  font: {
                    size: 12,
                  },
                },
              },
            },
    }

    if (chartType === "pie") {
      const pieData = {
        labels: chartData.map((item) => item.name),
        datasets: [
          {
            data: chartData.map((item) => item.value),
            backgroundColor: chartData.map((item) => item.color),
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      }

      return (
        <div className="h-[300px]">
          <Pie data={pieData} options={chartOptions} />
        </div>
      )
    } else {
      const barData = {
        labels: chartData.map((item) => item.name),
        datasets: [
          {
            label: title,
            data: chartData.map((item) => item.value),
            backgroundColor: chartData.map((item) => item.color),
            borderColor: chartData.map((item) => item.color),
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      }

      const barOptions = {
        ...chartOptions,
        indexAxis: chartType === "bar" ? ("y" as const) : ("x" as const),
      }

      return (
        <div className="h-[300px]">
          <Bar data={barData} options={barOptions} />
        </div>
      )
    }
  }

  const handleChartClick = async (item: any, category: string) => {
    try {
      console.log("[v0] Navigating to detailed report page for:", item.name, category)

      // Navigate to detailed report page with parameters
      const params = new URLSearchParams({
        title: `${item.name} - Detailed Report`,
        category: category,
        item: item.name,
      })

      router.push(`/analytics/detailed-report?${params.toString()}`)
    } catch (error) {
      console.error("Error navigating to detailed report:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error && !analyticsData) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-[11px] font-medium text-gray-900 mb-2">Failed to load analytics</h3>
          <p className="text-[10px] text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchAnalyticsData} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-[10px] text-gray-600">No analytics data available</p>
      </div>
    )
  }

  console.log("[v0] Analytics Dashboard: Rendering with data", analyticsData)

  return (
    <div className="space-y-4 md:space-y-6">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-[10px] text-yellow-800">
                Using cached data due to connection issues. Some information may not be current.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full lg:w-auto">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Legal">Legal</SelectItem>
              <SelectItem value="Facilities">Facilities</SelectItem>
              <SelectItem value="Security">Security</SelectItem>
            </SelectContent>
          </Select>
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Chart Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="column">Column Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")} className="flex-1 sm:flex-none">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export </span>CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} className="flex-1 sm:flex-none">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export </span>PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-medium">Total Tickets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-[13px] font-bold">{analyticsData.kpis.totalTickets.value}</div>
            <div className="flex items-center text-[10px] text-gray-700">
              {analyticsData.kpis.totalTickets.trend === "up" ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className="text-[10px]">{Math.abs(analyticsData.kpis.totalTickets.change)}% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-[13px] font-bold">{analyticsData.kpis.avgResolutionTime.value}</div>
            <div className="flex items-center text-[10px] text-gray-700">
              {analyticsData.kpis.avgResolutionTime.trend === "down" ? (
                <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingUp className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className="text-[10px]">{Math.abs(analyticsData.kpis.avgResolutionTime.change)}% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-medium">SLA Compliance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-[13px] font-bold">{analyticsData.kpis.slaCompliance.value}</div>
            <div className="flex items-center text-[10px] text-gray-700">
              {analyticsData.kpis.slaCompliance.trend === "up" ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className="text-[10px]">{Math.abs(analyticsData.kpis.slaCompliance.change)}% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-medium">Customer Satisfaction</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-[13px] font-bold">{analyticsData.kpis.customerSatisfaction.value}</div>
            <div className="flex items-center text-[10px] text-gray-700">
              {analyticsData.kpis.customerSatisfaction.trend === "up" ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className="text-[10px]">
                {Math.abs(analyticsData.kpis.customerSatisfaction.change)} from last period
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-[11px] font-semibold">Tickets by Department</CardTitle>
            <CardDescription className="text-[10px] text-gray-600">Distribution across departments</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {renderChart(analyticsData.ticketsByDepartment, "Department", "department")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[11px] font-semibold">Tickets by Type</CardTitle>
            <CardDescription className="text-[10px] text-gray-600">Breakdown by ticket categories</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">{renderChart(analyticsData.ticketsByType, "Type", "type")}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[11px] font-semibold">Tickets by Status</CardTitle>
            <CardDescription className="text-[10px] text-gray-600">Current status distribution</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">{renderChart(analyticsData.ticketsByStatus, "Status", "status")}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[11px] font-semibold">Tickets by Priority</CardTitle>
            <CardDescription className="text-[10px] text-gray-600">Priority level breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {renderChart(analyticsData.ticketsByPriority, "Priority", "priority")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[11px] font-semibold">Tickets by Assignee</CardTitle>
            <CardDescription className="text-[10px] text-gray-600">Workload distribution</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {renderChart(analyticsData.ticketsByAssignee, "Assignee", "assignee")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[11px] font-semibold">Ticket Trends</CardTitle>
            <CardDescription className="text-[10px] text-gray-600">Created vs resolved over time</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px]">
              <Bar
                data={{
                  labels: analyticsData.ticketTrends.map((item) => item.date),
                  datasets: [
                    {
                      label: "Created",
                      data: analyticsData.ticketTrends.map((item) => item.created),
                      backgroundColor: "#3b82f6",
                      borderColor: "#3b82f6",
                      borderWidth: 1,
                      borderRadius: 4,
                    },
                    {
                      label: "Resolved",
                      data: analyticsData.ticketTrends.map((item) => item.resolved),
                      backgroundColor: "#10b981",
                      borderColor: "#10b981",
                      borderWidth: 1,
                      borderRadius: 4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom" as const,
                      labels: {
                        font: {
                          size: 12,
                        },
                        padding: 20,
                      },
                    },
                    tooltip: {
                      backgroundColor: "#fff",
                      titleColor: "#374151",
                      bodyColor: "#374151",
                      borderColor: "#e5e7eb",
                      borderWidth: 1,
                      cornerRadius: 6,
                      titleFont: {
                        size: 12,
                      },
                      bodyFont: {
                        size: 12,
                      },
                    },
                  },
                  scales: {
                    x: {
                      ticks: {
                        font: {
                          size: 12,
                        },
                      },
                    },
                    y: {
                      ticks: {
                        font: {
                          size: 12,
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-[11px] font-semibold">SLA Performance by Department</CardTitle>
            <CardDescription className="text-[10px] text-gray-600">On-time vs breached SLAs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <div className="space-y-3">
                {analyticsData.slaPerformance.map((performance, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-24 text-[10px] font-medium truncate">{performance.department}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                      <div
                        className="h-4 bg-green-500 rounded-full"
                        style={{ width: `${(performance.onTime / 100) * 100}%` }}
                      />
                    </div>
                    <div className="w-12 text-[10px] text-right font-medium">{performance.onTime}%</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[11px] font-semibold">AI Insights</CardTitle>
            <CardDescription className="text-[10px] text-gray-600">
              Automated recommendations and predictions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-medium">Bottleneck Detected</p>
                <p className="text-[10px] text-gray-700">IT department showing 23% increase in resolution time</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-medium">Automation Opportunity</p>
                <p className="text-[10px] text-gray-700">67% of password reset requests can be automated</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-medium">SLA Risk Alert</p>
                <p className="text-[10px] text-gray-700">12 tickets at risk of breaching SLA in next 24 hours</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-medium">Trend Prediction</p>
                <p className="text-[10px] text-gray-700">Expected 15% increase in ticket volume next week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[11px] font-semibold">Real-time Activity</CardTitle>
          <CardDescription className="text-[10px] text-gray-600">Live updates from across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: "2 min ago", event: "High priority ticket created", type: "alert" },
              { time: "5 min ago", event: "SLA breach resolved for IT-2847", type: "success" },
              { time: "8 min ago", event: "New workflow deployed: Laptop Approval", type: "info" },
              { time: "12 min ago", event: "Customer satisfaction survey completed", type: "info" },
              { time: "15 min ago", event: "Bulk ticket assignment completed", type: "success" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 text-[11px]">
                <Badge
                  variant={
                    activity.type === "alert" ? "destructive" : activity.type === "success" ? "default" : "secondary"
                  }
                  className="w-2 h-2 p-0 rounded-full"
                />
                <span className="text-gray-700 text-[10px]">{activity.time}</span>
                <span>{activity.event}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const getMockAnalyticsData = (): AnalyticsData => ({
  kpis: {
    totalTickets: { value: 0, change: 0, trend: "up" },
    avgResolutionTime: { value: "0", change: 0, trend: "up" },
    slaCompliance: { value: "0", change: 0, trend: "up" },
    customerSatisfaction: { value: "0", change: 0, trend: "up" },
  },
  ticketsByDepartment: [],
  ticketsByType: [],
  ticketsByStatus: [],
  ticketsByPriority: [],
  ticketsByAssignee: [],
  ticketTrends: [],
  slaPerformance: [
    { department: "IT", onTime: 92, breached: 8 },
    { department: "HR", onTime: 96, breached: 4 },
    { department: "Finance", onTime: 89, breached: 11 },
    { department: "Legal", onTime: 94, breached: 6 },
    { department: "Facilities", onTime: 87, breached: 13 },
    { department: "Security", onTime: 98, breached: 2 },
  ],
})

export { AnalyticsDashboard }
export default AnalyticsDashboard
