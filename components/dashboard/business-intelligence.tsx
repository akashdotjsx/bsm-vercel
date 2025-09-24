"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Filler,
} from "chart.js"
import { Bar, Doughnut, Line } from "react-chartjs-2"
import {
  TrendingDown,
  DollarSign,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Zap,
  Shield,
} from "lucide-react"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
)

interface StakeholderDashboardData {
  executiveKpis: {
    businessImpact: { value: string; change: number; trend: "up" | "down" }
    operationalEfficiency: { value: string; change: number; trend: "up" | "down" }
    customerSatisfaction: { value: string; change: number; trend: "up" | "down" }
    costSavings: { value: string; change: number; trend: "up" | "down" }
    riskMitigation: { value: string; change: number; trend: "up" | "down" }
    serviceAvailability: { value: string; change: number; trend: "up" | "down" }
  }
  departmentPerformance: Array<{
    name: string
    efficiency: number
    satisfaction: number
    incidents: number
    color: string
  }>
  serviceDelivery: Array<{
    service: string
    performance: number
    sla: number
    incidents: number
    color: string
  }>
  financialImpact: Array<{
    month: string
    costSavings: number
    efficiency: number
    roi: number
  }>
  riskMetrics: Array<{
    category: string
    high: number
    medium: number
    low: number
    color: string
  }>
  customerMetrics: Array<{
    metric: string
    current: number
    target: number
    trend: number
  }>
}

export function BusinessIntelligence() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<StakeholderDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStakeholderData = () => {
      console.log("[v0] Stakeholder Dashboard: Starting data fetch")

      const mockData: StakeholderDashboardData = {
        executiveKpis: {
          businessImpact: { value: "$2.4M", change: 18.5, trend: "up" },
          operationalEfficiency: { value: "94.2%", change: 12.3, trend: "up" },
          customerSatisfaction: { value: "4.8/5", change: 8.7, trend: "up" },
          costSavings: { value: "$890K", change: 22.1, trend: "up" },
          riskMitigation: { value: "98.1%", change: 5.4, trend: "up" },
          serviceAvailability: { value: "99.9%", change: 2.1, trend: "up" },
        },
        departmentPerformance: [
          { name: "IT Operations", efficiency: 96, satisfaction: 4.8, incidents: 12, color: "#667eea" },
          { name: "Human Resources", efficiency: 92, satisfaction: 4.6, incidents: 8, color: "#f093fb" },
          { name: "Finance", efficiency: 89, satisfaction: 4.4, incidents: 15, color: "#4facfe" },
          { name: "Legal & Compliance", efficiency: 94, satisfaction: 4.7, incidents: 5, color: "#43e97b" },
          { name: "Facilities", efficiency: 91, satisfaction: 4.5, incidents: 18, color: "#fa709a" },
        ],
        serviceDelivery: [
          { service: "Infrastructure", performance: 98, sla: 95, incidents: 8, color: "#667eea" },
          { service: "Applications", performance: 94, sla: 90, incidents: 12, color: "#43e97b" },
          { service: "Security", performance: 99, sla: 98, incidents: 3, color: "#f093fb" },
          { service: "Data & Analytics", performance: 92, sla: 88, incidents: 6, color: "#4facfe" },
        ],
        financialImpact: [
          { month: "Jan", costSavings: 120, efficiency: 89, roi: 145 },
          { month: "Feb", costSavings: 135, efficiency: 91, roi: 152 },
          { month: "Mar", costSavings: 148, efficiency: 93, roi: 168 },
          { month: "Apr", costSavings: 162, efficiency: 94, roi: 175 },
          { month: "May", costSavings: 178, efficiency: 96, roi: 189 },
          { month: "Jun", costSavings: 195, efficiency: 97, roi: 201 },
        ],
        riskMetrics: [
          { category: "Security", high: 2, medium: 8, low: 15, color: "#ff6b6b" },
          { category: "Compliance", high: 1, medium: 5, low: 12, color: "#feca57" },
          { category: "Operational", high: 3, medium: 12, low: 28, color: "#48dbfb" },
          { category: "Financial", high: 0, medium: 4, low: 9, color: "#667eea" },
        ],
        customerMetrics: [
          { metric: "Service Quality", current: 4.8, target: 4.5, trend: 8.2 },
          { metric: "Response Time", current: 95, target: 90, trend: 12.5 },
          { metric: "Resolution Rate", current: 98, target: 95, trend: 6.8 },
          { metric: "User Adoption", current: 87, target: 85, trend: 15.3 },
        ],
      }

      setDashboardData(mockData)
      setLoading(false)
      console.log("[v0] Stakeholder Dashboard: Data loaded successfully")
    }

    fetchStakeholderData()
  }, [])

  const handleChartClick = (chartType: string, itemName: string) => {
    console.log(`[v0] Navigating to detailed report for: ${itemName} ${chartType}`)
    const params = new URLSearchParams({
      title: `${itemName} - Executive Report`,
      category: chartType,
      itemName: itemName,
    })
    router.push(`/dashboard/executive-report?${params.toString()}`)
  }

  const handleExportReport = (format: "csv" | "pdf") => {
    console.log(`[v0] Exporting stakeholder dashboard as ${format.toUpperCase()}`)

    if (format === "csv") {
      const csvData = [
        ["Section", "Metric", "Value", "Change", "Trend"],
        [
          "Executive KPIs",
          "Business Impact",
          dashboardData?.executiveKpis.businessImpact.value || "",
          `${dashboardData?.executiveKpis.businessImpact.change}%`,
          dashboardData?.executiveKpis.businessImpact.trend || "",
        ],
        [
          "Executive KPIs",
          "Operational Efficiency",
          dashboardData?.executiveKpis.operationalEfficiency.value || "",
          `${dashboardData?.executiveKpis.operationalEfficiency.change}%`,
          dashboardData?.executiveKpis.operationalEfficiency.trend || "",
        ],
        [
          "Executive KPIs",
          "Customer Satisfaction",
          dashboardData?.executiveKpis.customerSatisfaction.value || "",
          `${dashboardData?.executiveKpis.customerSatisfaction.change}%`,
          dashboardData?.executiveKpis.customerSatisfaction.trend || "",
        ],
        [
          "Executive KPIs",
          "Cost Savings",
          dashboardData?.executiveKpis.costSavings.value || "",
          `${dashboardData?.executiveKpis.costSavings.change}%`,
          dashboardData?.executiveKpis.costSavings.trend || "",
        ],
        [
          "Executive KPIs",
          "Risk Mitigation",
          dashboardData?.executiveKpis.riskMitigation.value || "",
          `${dashboardData?.executiveKpis.riskMitigation.change}%`,
          dashboardData?.executiveKpis.riskMitigation.trend || "",
        ],
        [
          "Executive KPIs",
          "Service Availability",
          dashboardData?.executiveKpis.serviceAvailability.value || "",
          `${dashboardData?.executiveKpis.serviceAvailability.change}%`,
          dashboardData?.executiveKpis.serviceAvailability.trend || "",
        ],
        ["", "", "", "", ""], // Empty row for separation
        ["Department Performance", "Department", "Efficiency %", "Satisfaction", "Incidents"],
        ...(dashboardData?.departmentPerformance.map((dept) => [
          "Department Performance",
          dept.name,
          `${dept.efficiency}%`,
          `${dept.satisfaction}/5`,
          dept.incidents.toString(),
        ]) || []),
        ["", "", "", "", ""], // Empty row for separation
        ["Service Delivery", "Service", "Performance %", "SLA Target %", "Incidents"],
        ...(dashboardData?.serviceDelivery.map((service) => [
          "Service Delivery",
          service.service,
          `${service.performance}%`,
          `${service.sla}%`,
          service.incidents.toString(),
        ]) || []),
        ["", "", "", "", ""], // Empty row for separation
        ["Financial Impact", "Month", "Cost Savings ($K)", "Efficiency %", "ROI %"],
        ...(dashboardData?.financialImpact.map((item) => [
          "Financial Impact",
          item.month,
          item.costSavings.toString(),
          `${item.efficiency}%`,
          `${item.roi}%`,
        ]) || []),
        ["", "", "", "", ""], // Empty row for separation
        ["Customer Metrics", "Metric", "Current", "Target", "Trend %"],
        ...(dashboardData?.customerMetrics.map((metric) => [
          "Customer Metrics",
          metric.metric,
          metric.current.toString(),
          metric.target.toString(),
          `${metric.trend}%`,
        ]) || []),
      ]

      const csvContent = csvData.map((row) => row.join(",")).join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `executive-dashboard-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      console.log("[v0] CSV export completed successfully")
    } else {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Executive Dashboard Report</title>
              <meta charset="utf-8">
              <style>
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                  margin: 20px; 
                  color: #333;
                  line-height: 1.6;
                }
                .header { 
                  text-align: center; 
                  margin-bottom: 40px; 
                  border-bottom: 2px solid #e5e7eb;
                  padding-bottom: 20px;
                }
                .header h1 { 
                  color: #1f2937; 
                  margin: 0 0 10px 0; 
                  font-size: 28px;
                }
                .header p { 
                  color: #6b7280; 
                  margin: 0;
                  font-size: 14px;
                }
                .section { 
                  margin-bottom: 30px; 
                  page-break-inside: avoid;
                }
                .section-title { 
                  font-size: 18px; 
                  font-weight: 600; 
                  color: #1f2937; 
                  margin-bottom: 15px;
                  border-left: 4px solid #3b82f6;
                  padding-left: 12px;
                }
                .kpi-grid { 
                  display: grid; 
                  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
                  gap: 20px; 
                  margin-bottom: 30px; 
                }
                .kpi-card { 
                  border: 1px solid #e5e7eb; 
                  padding: 20px; 
                  border-radius: 8px; 
                  background: #f9fafb;
                }
                .kpi-card h3 { 
                  margin: 0 0 10px 0; 
                  font-size: 14px; 
                  color: #6b7280; 
                  font-weight: 500;
                }
                .kpi-value { 
                  font-size: 24px; 
                  font-weight: 700; 
                  color: #1f2937; 
                  margin-bottom: 5px;
                }
                .kpi-change { 
                  color: #10b981; 
                  font-size: 12px; 
                  font-weight: 500;
                }
                .data-table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin-top: 15px;
                }
                .data-table th, .data-table td { 
                  padding: 12px; 
                  text-align: left; 
                  border-bottom: 1px solid #e5e7eb;
                  font-size: 13px;
                }
                .data-table th { 
                  background-color: #f3f4f6; 
                  font-weight: 600; 
                  color: #374151;
                }
                .data-table tr:hover { 
                  background-color: #f9fafb; 
                }
                .print-button {
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  background: #3b82f6;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 500;
                }
                .print-button:hover {
                  background: #2563eb;
                }
              </style>
            </head>
            <body>
              <button class="print-button no-print" onclick="window.print()">Print/Save as PDF</button>
              
              <div class="header">
                <h1>Executive Dashboard Report</h1>
                <p>Generated on ${new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</p>
              </div>

              <div class="section">
                <div class="section-title">Executive KPIs</div>
                <div class="kpi-grid">
                  <div class="kpi-card">
                    <h3>Business Impact</h3>
                    <div class="kpi-value">${dashboardData?.executiveKpis.businessImpact.value}</div>
                    <div class="kpi-change">+${dashboardData?.executiveKpis.businessImpact.change}% vs last quarter</div>
                  </div>
                  <div class="kpi-card">
                    <h3>Operational Efficiency</h3>
                    <div class="kpi-value">${dashboardData?.executiveKpis.operationalEfficiency.value}</div>
                    <div class="kpi-change">+${dashboardData?.executiveKpis.operationalEfficiency.change}% efficiency gain</div>
                  </div>
                  <div class="kpi-card">
                    <h3>Customer Satisfaction</h3>
                    <div class="kpi-value">${dashboardData?.executiveKpis.customerSatisfaction.value}</div>
                    <div class="kpi-change">+${dashboardData?.executiveKpis.customerSatisfaction.change}% satisfaction score</div>
                  </div>
                  <div class="kpi-card">
                    <h3>Cost Savings</h3>
                    <div class="kpi-value">${dashboardData?.executiveKpis.costSavings.value}</div>
                    <div class="kpi-change">+${dashboardData?.executiveKpis.costSavings.change}% annual savings</div>
                  </div>
                  <div class="kpi-card">
                    <h3>Risk Mitigation</h3>
                    <div class="kpi-value">${dashboardData?.executiveKpis.riskMitigation.value}</div>
                    <div class="kpi-change">+${dashboardData?.executiveKpis.riskMitigation.change}% risk coverage</div>
                  </div>
                  <div class="kpi-card">
                    <h3>Service Availability</h3>
                    <div class="kpi-value">${dashboardData?.executiveKpis.serviceAvailability.value}</div>
                    <div class="kpi-change">+${dashboardData?.executiveKpis.serviceAvailability.change}% uptime</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Department Performance</div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Efficiency</th>
                      <th>Satisfaction</th>
                      <th>Incidents</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      dashboardData?.departmentPerformance
                        .map(
                          (dept) => `
                      <tr>
                        <td>${dept.name}</td>
                        <td>${dept.efficiency}%</td>
                        <td>${dept.satisfaction}/5</td>
                        <td>${dept.incidents}</td>
                      </tr>
                    `,
                        )
                        .join("") || ""
                    }
                  </tbody>
                </table>
              </div>

              <div class="section">
                <div class="section-title">Service Delivery Performance</div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Performance</th>
                      <th>SLA Target</th>
                      <th>Incidents</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      dashboardData?.serviceDelivery
                        .map(
                          (service) => `
                      <tr>
                        <td>${service.service}</td>
                        <td>${service.performance}%</td>
                        <td>${service.sla}%</td>
                        <td>${service.incidents}</td>
                      </tr>
                    `,
                        )
                        .join("") || ""
                    }
                  </tbody>
                </table>
              </div>

              <div class="section">
                <div class="section-title">Financial Impact Trends</div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Cost Savings ($K)</th>
                      <th>Efficiency</th>
                      <th>ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      dashboardData?.financialImpact
                        .map(
                          (item) => `
                      <tr>
                        <td>${item.month}</td>
                        <td>$${item.costSavings}K</td>
                        <td>${item.efficiency}%</td>
                        <td>${item.roi}%</td>
                      </tr>
                    `,
                        )
                        .join("") || ""
                    }
                  </tbody>
                </table>
              </div>

              <div class="section">
                <div class="section-title">Customer Success Metrics</div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Current</th>
                      <th>Target</th>
                      <th>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      dashboardData?.customerMetrics
                        .map(
                          (metric) => `
                      <tr>
                        <td>${metric.metric}</td>
                        <td>${metric.current}${metric.metric.includes("Time") ? "%" : metric.metric.includes("Quality") ? "/5" : "%"}</td>
                        <td>${metric.target}${metric.metric.includes("Time") ? "%" : metric.metric.includes("Quality") ? "/5" : "%"}</td>
                        <td>+${metric.trend}%</td>
                      </tr>
                    `,
                        )
                        .join("") || ""
                    }
                  </tbody>
                </table>
              </div>
            </body>
          </html>
        `

        printWindow.document.write(htmlContent)
        printWindow.document.close()

        // Focus the print window and trigger print dialog
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
        }, 500)

        console.log("[v0] PDF export window opened successfully")
      } else {
        console.error("[v0] Failed to open print window for PDF export")
        alert("Please allow popups to export PDF reports")
      }
    }
  }

  const departmentChartData = {
    labels: dashboardData?.departmentPerformance.map((dept) => dept.name) || [],
    datasets: [
      {
        label: "Efficiency %",
        data: dashboardData?.departmentPerformance.map((dept) => dept.efficiency) || [],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#7073fc", "#f97316"],
        borderColor: ["#3b82f6", "#10b981", "#f59e0b", "#7073fc", "#f97316"],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const serviceDeliveryChartData = {
    labels: dashboardData?.serviceDelivery.map((service) => service.service) || [],
    datasets: [
      {
        label: "Performance",
        data: dashboardData?.serviceDelivery.map((service) => service.performance) || [],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"],
        borderColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"],
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: "SLA Target",
        data: dashboardData?.serviceDelivery.map((service) => service.sla) || [],
        backgroundColor: "#94a3b8",
        borderColor: "#94a3b8",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const financialTrendData = {
    labels: dashboardData?.financialImpact.map((item) => item.month) || [],
    datasets: [
      {
        label: "Cost Savings ($K)",
        data: dashboardData?.financialImpact.map((item) => item.costSavings) || [],
        borderColor: "#10b981",
        backgroundColor: "#10b981",
        fill: false,
        tension: 0.1,
        borderWidth: 2,
      },
      {
        label: "ROI %",
        data: dashboardData?.financialImpact.map((item) => item.roi) || [],
        borderColor: "#3b82f6",
        backgroundColor: "#3b82f6",
        fill: false,
        tension: 0.1,
        borderWidth: 2,
      },
    ],
  }

  const riskDistributionData = {
    labels: ["High Risk", "Medium Risk", "Low Risk"],
    datasets: [
      {
        data: [
          dashboardData?.riskMetrics.reduce((sum, risk) => sum + risk.high, 0) || 0,
          dashboardData?.riskMetrics.reduce((sum, risk) => sum + risk.medium, 0) || 0,
          dashboardData?.riskMetrics.reduce((sum, risk) => sum + risk.low, 0) || 0,
        ],
        backgroundColor: ["#ef4444", "#f59e0b", "#10b981"],
        borderColor: ["#ef4444", "#f59e0b", "#10b981"],
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          font: { size: 12 },
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
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { font: { size: 12 } },
      },
      x: {
        ticks: { font: { size: 12 } },
      },
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0) {
        const index = elements[0].index
        const chartType = event.chart.canvas.id
        if (chartType === "department-chart" && dashboardData?.departmentPerformance[index]) {
          handleChartClick("department-performance", dashboardData.departmentPerformance[index].name)
        } else if (chartType === "service-chart" && dashboardData?.serviceDelivery[index]) {
          handleChartClick("service-delivery", dashboardData.serviceDelivery[index].service)
        }
      }
    },
  }

  const lineChartOptions = {
    ...chartOptions,
    onClick: () => {
      handleChartClick("financial-trends", "Financial Performance")
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: { font: { size: 12 }, padding: 20 },
      },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#374151",
        bodyColor: "#374151",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        cornerRadius: 6,
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
      },
    },
    cutout: "65%",
    onClick: () => {
      handleChartClick("risk-analysis", "Risk Management")
    },
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Strategic insights and key performance indicators for stakeholders
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleExportReport("csv")} className="text-[13px]">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExportReport("pdf")} className="text-[13px]">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleChartClick("business-impact", "Business Impact")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Business Impact</span>
              </div>
              {dashboardData?.executiveKpis.businessImpact.trend === "up" ? (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{dashboardData?.executiveKpis.businessImpact.value}</div>
              <div className="flex items-center text-xs text-gray-600 mt-1">
                <span className="text-green-600">+{dashboardData?.executiveKpis.businessImpact.change}%</span>
                <span className="ml-1">vs last quarter</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleChartClick("operational-efficiency", "Operational Efficiency")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Operational Efficiency</span>
              </div>
              {dashboardData?.executiveKpis.operationalEfficiency.trend === "up" ? (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{dashboardData?.executiveKpis.operationalEfficiency.value}</div>
              <div className="flex items-center text-xs text-gray-600 mt-1">
                <span className="text-green-600">+{dashboardData?.executiveKpis.operationalEfficiency.change}%</span>
                <span className="ml-1">efficiency gain</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleChartClick("customer-satisfaction", "Customer Satisfaction")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">Customer Satisfaction</span>
              </div>
              {dashboardData?.executiveKpis.customerSatisfaction.trend === "up" ? (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{dashboardData?.executiveKpis.customerSatisfaction.value}</div>
              <div className="flex items-center text-xs text-gray-600 mt-1">
                <span className="text-green-600">+{dashboardData?.executiveKpis.customerSatisfaction.change}%</span>
                <span className="ml-1">satisfaction score</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleChartClick("cost-savings", "Cost Savings")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium">Cost Savings</span>
              </div>
              {dashboardData?.executiveKpis.costSavings.trend === "up" ? (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{dashboardData?.executiveKpis.costSavings.value}</div>
              <div className="flex items-center text-xs text-gray-600 mt-1">
                <span className="text-green-600">+{dashboardData?.executiveKpis.costSavings.change}%</span>
                <span className="ml-1">annual savings</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleChartClick("risk-mitigation", "Risk Mitigation")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium">Risk Mitigation</span>
              </div>
              {dashboardData?.executiveKpis.riskMitigation.trend === "up" ? (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{dashboardData?.executiveKpis.riskMitigation.value}</div>
              <div className="flex items-center text-xs text-gray-600 mt-1">
                <span className="text-green-600">+{dashboardData?.executiveKpis.riskMitigation.change}%</span>
                <span className="ml-1">risk coverage</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleChartClick("service-availability", "Service Availability")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-cyan-600" />
                <span className="text-sm font-medium">Service Availability</span>
              </div>
              {dashboardData?.executiveKpis.serviceAvailability.trend === "up" ? (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{dashboardData?.executiveKpis.serviceAvailability.value}</div>
              <div className="flex items-center text-xs text-gray-600 mt-1">
                <span className="text-green-600">+{dashboardData?.executiveKpis.serviceAvailability.change}%</span>
                <span className="ml-1">uptime</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center">
              <Building2 className="mr-2 h-4 w-4" />
              Department Performance
            </CardTitle>
            <p className="text-sm text-gray-600">Efficiency metrics by department</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div
              className="h-64 cursor-pointer"
              onClick={() => handleChartClick("department-performance", "All Departments")}
            >
              <Bar id="department-chart" data={departmentChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center">
              <Target className="mr-2 h-4 w-4" />
              Service Delivery Performance
            </CardTitle>
            <p className="text-sm text-gray-600">Performance vs SLA targets</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 cursor-pointer" onClick={() => handleChartClick("service-delivery", "All Services")}>
              <Bar id="service-chart" data={serviceDeliveryChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Financial Impact Trends
            </CardTitle>
            <p className="text-sm text-gray-600">Cost savings and ROI progression</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div
              className="h-64 cursor-pointer"
              onClick={() => handleChartClick("financial-trends", "Financial Trends")}
            >
              <Line data={financialTrendData} options={lineChartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Risk Distribution
            </CardTitle>
            <p className="text-sm text-gray-600">Risk levels across all categories</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 cursor-pointer" onClick={() => handleChartClick("risk-analysis", "Risk Analysis")}>
              <Doughnut data={riskDistributionData} options={doughnutOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Customer Success Metrics
          </CardTitle>
          <p className="text-sm text-gray-600">Key customer satisfaction indicators</p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardData?.customerMetrics.map((metric, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => handleChartClick("customer-metrics", metric.metric)}
              >
                <div className="text-sm font-medium text-gray-700 mb-2">{metric.metric}</div>
                <div className="text-xl font-bold text-gray-900 mb-1">
                  {metric.current}
                  {metric.metric.includes("Time") ? "%" : metric.metric.includes("Quality") ? "/5" : "%"}
                </div>
                <div className="text-xs text-gray-600">
                  Target: {metric.target}
                  {metric.metric.includes("Time") ? "%" : metric.metric.includes("Quality") ? "/5" : "%"}
                </div>
                <div className="text-xs text-green-600 mt-1">+{metric.trend}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
