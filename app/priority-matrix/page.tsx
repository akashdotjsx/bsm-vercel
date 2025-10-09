import { PlatformLayout } from "@/components/layout/platform-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Save, RotateCcw, Settings } from "lucide-react"

export default function PriorityMatrixPage() {
  console.log("[v0] Priority Matrix page loading")

  const impactLevels = ["High", "Medium", "Low"]
  const urgencyLevels = ["High", "Medium", "Low"]

  const getPriorityLevel = (impact: string, urgency: string) => {
    if (impact === "High" && urgency === "High") return { level: "P1", color: "destructive", label: "Critical" }
    if ((impact === "High" && urgency === "Medium") || (impact === "Medium" && urgency === "High"))
      return { level: "P2", color: "default", label: "High" }
    if (
      (impact === "High" && urgency === "Low") ||
      (impact === "Medium" && urgency === "Medium") ||
      (impact === "Low" && urgency === "High")
    )
      return { level: "P3", color: "secondary", label: "Medium" }
    return { level: "P4", color: "outline", label: "Low" }
  }

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">Priority Matrix</h1>
            <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-1">
              Configure priority levels based on impact and urgency combinations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <RotateCcw className="h-4 w-4" />
              Reset to Default
            </Button>
            <Button className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Priority Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Impact vs Urgency Matrix
            </CardTitle>
            <CardDescription>
              Define priority levels based on the combination of business impact and time urgency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-4 text-left font-medium text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-800">
                      Impact / Urgency
                    </th>
                    {urgencyLevels.map((urgency) => (
                      <th
                        key={urgency}
                        className="p-4 text-center font-medium text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-800 min-w-[120px]"
                      >
                        {urgency} Urgency
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {impactLevels.map((impact) => (
                    <tr key={impact}>
                      <td className="p-4 font-medium text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                        {impact} Impact
                      </td>
                      {urgencyLevels.map((urgency) => {
                        const priority = getPriorityLevel(impact, urgency)
                        return (
                          <td key={urgency} className="p-4 text-center border border-gray-100 dark:border-gray-800">
                            <div className="space-y-2">
                              <Badge variant={priority.color as any} className="text-[10px] font-medium">
                                {priority.level}
                              </Badge>
                              <p className="text-[10px] text-gray-600 dark:text-gray-400">{priority.label}</p>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Priority Definitions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Impact Levels</CardTitle>
              <CardDescription>Define what constitutes different impact levels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-[11px] text-red-600 dark:text-red-400">High Impact</h4>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  Critical business functions affected, multiple users impacted, revenue loss potential
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-[11px] text-yellow-600 dark:text-yellow-400">Medium Impact</h4>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  Important business functions affected, limited user impact, workaround available
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-[11px] text-green-600 dark:text-green-400">Low Impact</h4>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  Minor inconvenience, single user affected, cosmetic issues
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Urgency Levels</CardTitle>
              <CardDescription>Define time sensitivity requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-[11px] text-red-600 dark:text-red-400">High Urgency</h4>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  Immediate attention required, business operations at risk
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-[11px] text-yellow-600 dark:text-yellow-400">Medium Urgency</h4>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  Should be addressed within business hours, planned resolution acceptable
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-[11px] text-green-600 dark:text-green-400">Low Urgency</h4>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  Can be scheduled for future resolution, no immediate impact
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PlatformLayout>
  )
}
