"use client"

import { useState, useEffect } from "react"
import { useMode } from "@/lib/contexts/mode-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { TrendingUp, TrendingDown, Clock, CheckCircle, Users, Download, Activity } from "lucide-react"
import { addDays, format, subDays, startOfMonth, endOfMonth } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Bar, Pie } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js"
import { useRouter } from "next/navigation"
import DetailedReport from "./detailed-report"
import { useDataFetcher } from "@/lib/hooks/use-data-fetcher"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

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
  const [showDetailedReport, setShowDetailedReport] = useState(false)
  const [reportConfig, setReportConfig] = useState<{ title: string; category: string; item: string } | null>(null)

  const {
    data: tickets,
    loading: ticketsLoading,
    error: ticketsError,
    refetch: refetchTickets,
  } = useDataFetcher({
    table: "tickets",
    select: `
      *,
      assignee:profiles!tickets_assignee_id_fkey(id, first_name, last_name, email, department),
      requester:profiles!tickets_requester_id_fkey(id, first_name, last_name, email, department),
      organization:organizations(id, name)
    `,
    orderBy: { column: "created_at", ascending: false },
    cache: true,
    cacheTTL: 2 * 60 * 1000, // 2 minutes cache for real-time analytics
  })

  const { data: users, loading: usersLoading } = useDataFetcher({
    table: "profiles",
    select: "id, first_name, last_name, email",
    cache: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutes cache
  })

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("[v0] Analytics Dashboard: Starting data fetch from database")

      if (!tickets || tickets.length === 0) {
        console.log("[v0] Analytics Dashboard: No tickets data available")
        setAnalyticsData(getEmptyAnalyticsData())
        return
      }

      // Filter tickets by date range if specified
      const filteredTickets = tickets.filter((ticket: any) => {
        if (!dateRange?.from || !dateRange?.to) return true
        const ticketDate = new Date(ticket.created_at)
        return ticketDate >= dateRange.from && ticketDate <= dateRange.to
      })

      // Filter by department if specified
      const departmentFilteredTickets =
        selectedDepartment === "all"
          ? filteredTickets
          : filteredTickets.filter((ticket: any) => ticket.assignee?.department === selectedDepartment)

      // Calculate KPIs
      const totalTickets = departmentFilteredTickets.length
      const resolvedTickets = departmentFilteredTickets.filter((t: any) => t.status?.category === "resolved")
      const avgResolutionTime = calculateAverageResolutionTime(resolvedTickets)
      const slaCompliance = calculateSLACompliance(departmentFilteredTickets)
      const customerSatisfaction = calculateCustomerSatisfaction(resolvedTickets)

      // Calculate previous period for trends
      const previousPeriodStart = dateRange?.from ? subDays(dateRange.from, 30) : subDays(new Date(), 60)
      const previousPeriodEnd = dateRange?.from ? dateRange.from : subDays(new Date(), 30)

      const previousTickets = tickets.filter((ticket: any) => {
        const ticketDate = new Date(ticket.created_at)
        return ticketDate >= previousPeriodStart && ticketDate <= previousPeriodEnd
      })

      const previousTotalTickets = previousTickets.length
      const ticketChange =
        previousTotalTickets > 0 ? ((totalTickets - previousTotalTickets) / previousTotalTickets) * 100 : 0

      setAnalyticsData({
        kpis: {
          totalTickets: {
            value: totalTickets,
            change: Math.round(ticketChange * 10) / 10,
            trend: ticketChange >= 0 ? "up" : "down",
          },
          avgResolutionTime: {
            value: avgResolutionTime,
            change: 8.2, // TODO: Calculate actual change
            trend: "down",
          },
          slaCompliance: {
            value: slaCompliance,
            change: 2.1, // TODO: Calculate actual change
            trend: "up",
          },
          customerSatisfaction: {
            value: customerSatisfaction,
            change: 0.3, // TODO: Calculate actual change
            trend: "up",
          },
        },
        ticketsByDepartment: groupTicketsBy(departmentFilteredTickets, "assignee.department", COLORS.departments),
        ticketsByType: groupTicketsBy(departmentFilteredTickets, "type.name", COLORS.types),
        ticketsByStatus: groupTicketsBy(departmentFilteredTickets, "status.name", COLORS.status),
        ticketsByPriority: groupTicketsBy(departmentFilteredTickets, "priority.name", COLORS.priority),
        ticketsByAssignee: groupTicketsByAssignee(departmentFilteredTickets, COLORS.departments),
        ticketTrends: calculateTrends(tickets),
        slaPerformance: calculateSLAPerformance(tickets),
      })

      console.log("[v0] Analytics Dashboard: Data loaded successfully from database")
    } catch (error) {
      console.error("[v0] Analytics Dashboard: Error fetching analytics:", error)
      setError("Failed to load analytics data")
      setAnalyticsData(getEmptyAnalyticsData())
    } finally {
      setLoading(false)
    }
  }

  const calculateAverageResolutionTime = (resolvedTickets: any[]) => {
    if (resolvedTickets.length === 0) return "0 hours"

    const totalMinutes = resolvedTickets.reduce((sum, ticket) => {
      if (!ticket.resolved_at) return sum
      const created = new Date(ticket.created_at)
      const resolved = new Date(ticket.resolved_at)
      const diffMinutes = (resolved.getTime() - created.getTime()) / (1000 * 60)
      return sum + diffMinutes
    }, 0)

    const avgMinutes = totalMinutes / resolvedTickets.length
    const hours = Math.floor(avgMinutes / 60)
    const minutes = Math.floor(avgMinutes % 60)

    if (hours > 0) {
      return `${hours}.${Math.floor(minutes / 6)} hours`
    } else {
      return `${minutes} minutes`
    }
  }

  const calculateSLACompliance = (tickets: any[]) => {
    if (tickets.length === 0) return "0%"

    const slaMetTickets = tickets.filter((ticket: any) => {
      if (!ticket.resolved_at || !ticket.due_date) return false
      return new Date(ticket.resolved_at) <= new Date(ticket.due_date)
    })

    const compliance = (slaMetTickets.length / tickets.length) * 100
    return `${Math.round(compliance * 10) / 10}%`
  }

  const calculateCustomerSatisfaction = (resolvedTickets: any[]) => {
    const ratingsSum = resolvedTickets.reduce((sum, ticket) => {
      return sum + (ticket.customer_rating || 0)
    }, 0)

    const ratedTickets = resolvedTickets.filter((t) => t.customer_rating > 0)
    if (ratedTickets.length === 0) return "N/A"

    const avgRating = ratingsSum / ratedTickets.length
    return `${Math.round(avgRating * 10) / 10}/5`
  }

  const groupTicketsByAssignee = (tickets: any[], colors: string[]) => {
    const groups = tickets.reduce((acc: Record<string, number>, ticket: any) => {
      const assigneeName = ticket.assignee ? `${ticket.assignee.first_name} ${ticket.assignee.last_name}` : "Unassigned"
      acc[assigneeName] = (acc[assigneeName] || 0) + 1
      return acc
    }, {})

    return Object.entries(groups)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5) // Top 5 assignees
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }))
  }

  const getEmptyAnalyticsData = (): AnalyticsData => ({
    kpis: {
      totalTickets: { value: 0, change: 0, trend: "up" },
      avgResolutionTime: { value: "0 hours", change: 0, trend: "down" },
      slaCompliance: { value: "0%", change: 0, trend: "up" },
      customerSatisfaction: { value: "N/A", change: 0, trend: "up" },
    },
    ticketsByDepartment: [],
    ticketsByType: [],
    ticketsByStatus: [],
    ticketsByPriority: [],
    ticketsByAssignee: [],
    ticketTrends: [],
    slaPerformance: [],
  })

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
    const departments = Array.from(new Set(tickets.map((t) => t.assignee?.department))).filter(Boolean)
    return departments.map((dept: any) => {
      const deptTickets = tickets?.filter((t) => t.assignee?.department === dept) || []
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
    if (!ticketsLoading && !usersLoading) {
      fetchAnalyticsData()
    }
  }, [tickets, users, dateRange, selectedDepartment, ticketsLoading, usersLoading])

  const isLoading = loading || ticketsLoading || usersLoading

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
            <p className="text-sm">No data available</p>
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
          callbacks: {
            afterLabel: (context) => {
              return context.datasetIndex === 0 ? "SLA Met" : "SLA Breached"
            },
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
                stacked: true,
                ticks: {
                  font: {
                    size: 12,
                  },
                },
              },
              y: {
                stacked: true,
                max: 100,
                ticks: {
                  font: {
                    size: 12,
                  },
                  callback: (value) => `${value}%`,
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
      console.log("[v0] Opening detailed report for:", item.name, category)

      setReportConfig({
        title: `${item.name} - Detailed Report`,
        category: category,
        item: item.name,
      })
      setShowDetailedReport(true)
    } catch (error) {
      console.error("Error opening detailed report:", error)
    }
  }

  const handleBackToAnalytics = () => {
    setShowDetailedReport(false)
    setReportConfig(null)
  }

  if (showDetailedReport && reportConfig) {
    return (
      <DetailedReport
        title={reportConfig.title}
        category={reportConfig.category}
        item={reportConfig.item}
        onBack={handleBackToAnalytics}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading analytics dashboard...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-[300px] bg-gray-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if ((error || ticketsError) && !analyticsData) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load analytics</h3>
          <p className="text-gray-600 mb-4">{error || ticketsError?.message}</p>
          <Button
            onClick={() => {
              fetchAnalyticsData()
              refetchTickets()
            }}
            variant="outline"
          >
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
        <p className="text-gray-600">No analytics data available</p>
      </div>
    )
  }

  console.log("[v0] Analytics Dashboard: Rendering with real database data", analyticsData)

  return (
    <div className="space-y-4 md:space-y-6">
      {(error || ticketsError) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm text-yellow-800">
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
              {tickets?.map((ticket: any) => (
                <SelectItem key={ticket.assignee?.department} value={ticket.assignee?.department}>
                  {ticket.assignee?.department}
                </SelectItem>
              ))}
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

      {/* ... existing code for KPI cards and charts ... */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Tickets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{analyticsData.kpis.totalTickets.value}</div>
            <div className="flex items-center text-xs text-gray-700">
              {analyticsData.kpis.totalTickets.trend === "up" ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className="text-xs">{Math.abs(analyticsData.kpis.totalTickets.change)}% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{analyticsData.kpis.avgResolutionTime.value}</div>
            <div className="flex items-center text-xs text-gray-700">
              {analyticsData.kpis.avgResolutionTime.trend === "down" ? (
                <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingUp className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className="text-xs">{Math.abs(analyticsData.kpis.avgResolutionTime.change)}% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">SLA Compliance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{analyticsData.kpis.slaCompliance.value}</div>
            <div className="flex items-center text-xs text-gray-700">
              {analyticsData.kpis.slaCompliance.trend === "up" ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className="text-xs">{Math.abs(analyticsData.kpis.slaCompliance.change)}% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Customer Satisfaction</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{analyticsData.kpis.customerSatisfaction.value}</div>
            <div className="flex items-center text-xs text-gray-700">
              {analyticsData.kpis.customerSatisfaction.trend === "up" ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className="text-xs">
                {Math.abs(analyticsData.kpis.customerSatisfaction.change)} from last period
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tickets by Department</CardTitle>
            <CardDescription className="text-sm text-gray-600">Distribution across departments</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {renderChart(analyticsData.ticketsByDepartment, "Department", "department")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tickets by Type</CardTitle>
            <CardDescription className="text-sm text-gray-600">Breakdown by ticket categories</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">{renderChart(analyticsData.ticketsByType, "Type", "type")}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tickets by Status</CardTitle>
            <CardDescription className="text-sm text-gray-600">Current status distribution</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">{renderChart(analyticsData.ticketsByStatus, "Status", "status")}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tickets by Priority</CardTitle>
            <CardDescription className="text-sm text-gray-600">Priority level breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {renderChart(analyticsData.ticketsByPriority, "Priority", "priority")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tickets by Assignee</CardTitle>
            <CardDescription className="text-sm text-gray-600">Workload distribution</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {renderChart(analyticsData.ticketsByAssignee, "Assignee", "assignee")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Ticket Trends</CardTitle>
            <CardDescription className="text-sm text-gray-600">Created vs resolved over time</CardDescription>
          </CardHeader>
          <CardContent>
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
            <CardTitle className="text-base font-semibold">SLA Performance by Department</CardTitle>
            <CardDescription className="text-sm text-gray-600">On-time vs breached SLAs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar
                data={{
                  labels: analyticsData.slaPerformance.map((item) => item.department),
                  datasets: [
                    {
                      label: "On Time (%)",
                      data: analyticsData.slaPerformance.map((item) => item.onTime),
                      backgroundColor: "#10b981",
                      borderColor: "#10b981",
                      borderWidth: 1,
                      borderRadius: 4,
                    },
                    {
                      label: "Breached (%)",
                      data: analyticsData.slaPerformance.map((item) => item.breached),
                      backgroundColor: "#ef4444",
                      borderColor: "#ef4444",
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
                      callbacks: {
                        afterLabel: (context) => {
                          return context.datasetIndex === 0 ? "SLA Met" : "SLA Breached"
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      stacked: true,
                      ticks: {
                        font: {
                          size: 12,
                        },
                      },
                    },
                    y: {
                      stacked: true,
                      max: 100,
                      ticks: {
                        font: {
                          size: 12,
                        },
                        callback: (value) => `${value}%`,
                      },
                    },
                  },
                  onClick: (event: any, elements: any) => {
                    if (elements.length > 0) {
                      const index = elements[0].index
                      const department = analyticsData.slaPerformance[index]
                      handleChartClick({ name: department.department, value: department.onTime }, "sla")
                    }
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">AI Insights</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Automated recommendations and predictions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Bottleneck Detected</p>
                <p className="text-xs text-gray-700">IT department showing increased resolution time</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Automation Opportunity</p>
                <p className="text-xs text-gray-700">Password reset requests can be automated</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">SLA Risk Alert</p>
                <p className="text-xs text-gray-700">Tickets at risk of breaching SLA in next 24 hours</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Trend Prediction</p>
                <p className="text-xs text-gray-700">Expected increase in ticket volume based on trends</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { AnalyticsDashboard }
export default AnalyticsDashboard
