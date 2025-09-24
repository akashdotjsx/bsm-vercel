"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Image from "next/image"

export default function SetupAdminPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const createAdminUser = async () => {
    setStatus("loading")
    setMessage("")

    try {
      const response = await fetch("/api/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage("Admin user created successfully with confirmed email! You can now login.")
      } else {
        setStatus("error")
        setMessage(data.error || "Failed to create admin user")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Network error occurred")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/images/kroolo-logo.png" alt="Kroolo" width={120} height={40} className="h-10 w-auto" />
          </div>
          <CardTitle>Setup Admin User</CardTitle>
          <CardDescription>Create the admin user account for Kroolo BSM platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            <p className="font-medium mb-2">Admin Credentials:</p>
            <p>
              <strong>Email:</strong> shashank@kroolo.com
            </p>
            <p>
              <strong>Password:</strong> Test@123
            </p>
          </div>

          <Button onClick={createAdminUser} disabled={status === "loading"} className="w-full">
            {status === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {status === "loading" ? "Creating Admin User..." : "Create Admin User"}
          </Button>

          {status === "success" && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-3 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              {message}
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              {message}
            </div>
          )}

          {status === "success" && (
            <Button asChild className="w-full">
              <a href="/auth/login">Go to Login Page</a>
            </Button>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <a href="/auth/login" className="text-blue-600 hover:underline dark:text-blue-400">
              Already have an account? Go to Login
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
