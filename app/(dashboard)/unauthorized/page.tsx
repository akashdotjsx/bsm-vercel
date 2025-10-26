'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react'

export default function UnauthorizedPage() {
  const router = useRouter()
  const { profile, isAdmin, isManager } = useAuth()

  return (
    <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center bg-background p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-500" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription className="text-base">
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Current Role:</strong>{' '}
              <span className="text-foreground capitalize">{profile?.role || 'User'}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              This page requires elevated permissions that your current role doesn't have.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">What you can do:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Go back to the previous page</li>
              <li>Return to your dashboard</li>
              {!isAdmin && !isManager && (
                <li>Contact your administrator for access</li>
              )}
            </ul>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
