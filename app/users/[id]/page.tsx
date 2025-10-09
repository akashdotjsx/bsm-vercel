"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Mail, 
  Phone, 
  Building, 
  User, 
  Calendar,
  Shield,
  ArrowLeft,
  Ticket,
  Settings
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  bio?: string
  phone?: string
  department?: string
  position?: string
  status: string
  created_at: string
  user_roles?: Array<{
    roles: {
      id: string
      name: string
      description: string
    }
  }>
}

interface UserPageProps {
  params: {
    id: string
  }
}

export default function UserPage({ params }: UserPageProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${params.id}`)
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          setError('User not found')
        }
      } catch (err) {
        setError('Failed to load user')
        console.error('Error fetching user:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [params.id])

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-9 w-24" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
                <Skeleton className="h-5 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto mb-2" />
                <Skeleton className="h-5 w-20 mx-auto rounded-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <h2 className="text-[13px] font-bold text-muted-foreground mb-4">User Not Found</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-[13px] font-bold tracking-tight">{user.full_name}</h1>
          <p className="text-muted-foreground">{user.position} {user.department && `• ${user.department}`}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* User Info Card */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="w-20 h-20 mx-auto mb-4">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="text-[11px]">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-[13px]">{user.full_name}</CardTitle>
              <CardDescription>{user.position || 'User'}</CardDescription>
              <Badge variant="secondary" className={getStatusColor(user.status)}>
                {user.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.bio && (
                <div>
                  <h4 className="text-sm font-medium mb-1">About</h4>
                  <p className="text-sm text-muted-foreground">{user.bio}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>
                
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                )}
                
                {user.department && (
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.department}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {user.user_roles && user.user_roles.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Roles
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {user.user_roles.map((userRole, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {userRole.roles.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity & Actions */}
        <div className="md:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[11px] flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start" asChild>
                  <Link href={`/tickets?assignee=${user.id}`}>
                    <Ticket className="h-4 w-4 mr-2" />
                    View Assigned Tickets
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href={`/tickets?requester=${user.id}`}>
                    <User className="h-4 w-4 mr-2" />
                    View Requested Tickets
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" disabled>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" className="justify-start" disabled>
                  <Phone className="h-4 w-4 mr-2" />
                  Call User
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[11px]">Recent Activity</CardTitle>
              <CardDescription>User activity and ticket interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Activity tracking coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}