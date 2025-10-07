"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMode } from "@/lib/contexts/mode-context"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export function StatsCards() {
  const { isEmployeeMode, isCustomerMode } = useMode()

  const employeeStats = [
    {
      title: "Open Requests",
      value: "24",
      change: "+2 from yesterday",
      trend: "up",
      icon: "🎫",
      color: "text-blue-600",
    },
    {
      title: "Avg Response Time",
      value: "2.4h",
      change: "-0.3h from last week",
      trend: "down",
      icon: "⏱️",
      color: "text-green-600",
    },
    {
      title: "SLA Compliance",
      value: "94.2%",
      change: "+1.2% from last month",
      trend: "up",
      icon: "✅",
      color: "text-emerald-600",
    },
    {
      title: "Employee Satisfaction",
      value: "4.6/5",
      change: "+0.2 from last month",
      trend: "up",
      icon: "😊",
      color: "text-amber-600",
    },
  ]

  const customerStats = [
    {
      title: "Active Tickets",
      value: "18",
      change: "+3 from yesterday",
      trend: "up",
      icon: "🎫",
      color: "text-blue-600",
    },
    {
      title: "First Response Time",
      value: "1.8h",
      change: "-0.5h from last week",
      trend: "down",
      icon: "⚡",
      color: "text-green-600",
    },
    {
      title: "Resolution Rate",
      value: "96.8%",
      change: "+2.1% from last month",
      trend: "up",
      icon: "✅",
      color: "text-emerald-600",
    },
    {
      title: "Customer Satisfaction",
      value: "4.8/5",
      change: "+0.1 from last month",
      trend: "up",
      icon: "⭐",
      color: "text-amber-600",
    },
  ]

  const stats = isEmployeeMode ? employeeStats : customerStats

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-green-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[11px] font-medium text-gray-700">{stat.title}</CardTitle>
            <div className="text-base sm:text-lg">{stat.icon}</div>
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-bold ${stat.color} mb-1`}>{stat.value}</div>
            <div className="flex items-center text-[10px] text-gray-700">
              {getTrendIcon(stat.trend)}
              <span className="ml-1 text-[10px]">{stat.change}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
