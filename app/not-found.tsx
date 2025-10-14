'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Home, LogIn } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamic import to prevent hydration issues
const KrooloMainLoader = dynamic(() => import('@/components/common/kroolo-main-loader'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-background" />
})

export default function NotFound() {
  const router = useRouter()
  const [showLoader, setShowLoader] = useState(false)

  useEffect(() => {
    // Redirect to login after 5 seconds
    const timeout = setTimeout(() => {
      router.push('/auth/login')
    }, 5000)

    return () => clearTimeout(timeout)
  }, [router])

  const handleLoginRedirect = () => {
    setShowLoader(true)
    router.push('/auth/login')
  }

  if (showLoader) {
    return <KrooloMainLoader />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Page Not Found
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            The page you're looking for doesn't exist or you don't have permission to access it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            You'll be redirected to login in 5 seconds...
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={handleLoginRedirect}
              className="flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              Go to Login
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}