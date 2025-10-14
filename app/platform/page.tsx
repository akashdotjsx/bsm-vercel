import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PlatformAccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/images/kroolo-logo.png" alt="Kroolo" className="h-8" />
          </div>
          <CardTitle className="text-[13px] font-bold text-slate-900">Kroolo BSM Platform Access</CardTitle>
          <CardDescription className="text-[11px]">AI-Native Business Service Management Platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/dashboard">
              <Button className="w-full h-16 text-[11px]" size="lg">
                🏠 Dashboard
              </Button>
            </Link>
            <Link href="/tickets">
              <Button className="w-full h-16 text-[11px] bg-transparent" variant="outline" size="lg">
                🎫 Tickets
              </Button>
            </Link>
            <Link href="/workflows">
              <Button className="w-full h-16 text-[11px] bg-transparent" variant="outline" size="lg">
                ⚡ Workflows
              </Button>
            </Link>
            <Link href="/services">
              <Button className="w-full h-16 text-[11px] bg-transparent" variant="outline" size="lg">
                🛠️ Services
              </Button>
            </Link>
            <Link href="/analytics">
              <Button className="w-full h-16 text-[11px] bg-transparent" variant="outline" size="lg">
                📊 Analytics
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button className="w-full h-16 text-[11px]" variant="secondary" size="lg">
                🔐 Login Page
              </Button>
            </Link>
          </div>


          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">🚀 Platform Features</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Dual-mode operation (Employee Services / Customer Support)</li>
              <li>• AI-powered ticket management and workflow automation</li>
              <li>• Comprehensive service catalogs and analytics</li>
              <li>• Real-time dashboards and reporting</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
