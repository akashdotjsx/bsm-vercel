"use client"

import { useState, useEffect } from "react"
import { PageContent } from "@/components/layout/page-content"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar, 
  Save, 
  Camera,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  Clock,
  Globe
} from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ProfilePage() {
  const { user, profile, organization, loading, updateProfile } = useAuth()
  const router = useRouter()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  
  // Profile form data
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department: "",
    job_title: "",
    bio: "",
    location: "",
    timezone: "",
    language: "en"
  })
  
  // Password form data
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  })

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile && user) {
      setProfileData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: user.email || "",
        phone: profile.phone || "",
        department: profile.department || "",
        job_title: profile.job_title || "",
        bio: profile.bio || "",
        location: profile.location || "",
        timezone: profile.timezone || "UTC",
        language: profile.language || "en"
      })
    }
  }, [profile, user])

  // Show loading state
  if (loading || !user || !profile) {
    return (
      <PageContent
        title="My Profile"
        description="Manage your personal information and account settings"
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Profile", href: "/profile" },
        ]}
      >
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-muted rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-muted rounded"></div>
                    <div className="h-3 w-32 bg-muted rounded"></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 w-20 bg-muted rounded"></div>
                      <div className="h-9 w-full bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    )
  }

  const handleSaveProfile = async () => {
    setSaveLoading(true)
    setErrorMessage("")
    setSuccessMessage("")
    
    try {
      // TODO: Implement updateProfile mutation
      // await updateProfile(profileData)
      console.log("Updating profile:", profileData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccessMessage("Profile updated successfully!")
      setIsEditing(false)
      
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      setErrorMessage("Failed to update profile. Please try again.")
      setTimeout(() => setErrorMessage(""), 3000)
    } finally {
      setSaveLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setErrorMessage("New passwords don't match")
      setTimeout(() => setErrorMessage(""), 3000)
      return
    }
    
    if (passwordData.new_password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long")
      setTimeout(() => setErrorMessage(""), 3000)
      return
    }

    setSaveLoading(true)
    setErrorMessage("")
    setSuccessMessage("")
    
    try {
      // TODO: Implement password change
      console.log("Changing password")
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccessMessage("Password changed successfully!")
      setIsChangingPassword(false)
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: ""
      })
      
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      setErrorMessage("Failed to change password. Please try again.")
      setTimeout(() => setErrorMessage(""), 3000)
    } finally {
      setSaveLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setIsChangingPassword(false)
    setPasswordData({
      current_password: "",
      new_password: "",
      confirm_password: ""
    })
    // Reset form data
    if (profile && user) {
      setProfileData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: user.email || "",
        phone: profile.phone || "",
        department: profile.department || "",
        job_title: profile.job_title || "",
        bio: profile.bio || "",
        location: profile.location || "",
        timezone: profile.timezone || "UTC",
        language: profile.language || "en"
      })
    }
  }

  const userData = {
    name: `${profile.first_name} ${profile.last_name}`.trim(),
    email: user.email,
    role: profile.role === 'admin' ? 'System Admin' : profile.role === 'manager' ? 'Manager' : profile.role || 'User',
    initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase(),
    joinedDate: profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'
  }

  return (
    <PageContent
      title="My Profile"
      description="Manage your personal information and account settings"
      breadcrumb={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "My Profile", href: "/profile" },
      ]}
    >
      <div className="space-y-6 max-w-4xl">
        {/* Success/Error Messages */}
        {successMessage && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}
        
        {errorMessage && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <X className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700 dark:text-red-400">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-semibold">
                      {userData.initials}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 p-0 rounded-full"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{userData.name}</h2>
                  <p className="text-muted-foreground">{userData.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{userData.role}</Badge>
                    {organization && (
                      <Badge variant="outline">{organization.name}</Badge>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    Joined {userData.joinedDate}
                  </div>
                </div>
              </div>
              
              <div className="space-x-2">
                {!isEditing && !isChangingPassword ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangingPassword(true)}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                    <Button size="sm" onClick={() => setIsEditing(true)}>
                      <User className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </>
                ) : (
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={saveLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={isChangingPassword ? handleChangePassword : handleSaveProfile}
                      disabled={saveLoading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saveLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Form */}
        {isChangingPassword && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password for better security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current_password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      placeholder="Enter current password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="new_password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      placeholder="Enter new password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      placeholder="Confirm new password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your basic profile information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={profileData.first_name}
                  onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                  placeholder="Enter your first name"
                  disabled={!isEditing}
                />
              </div>
              
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={profileData.last_name}
                  onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                  placeholder="Enter your last name"
                  disabled={!isEditing}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    placeholder="Enter your email"
                    disabled={true}
                    className="pl-10"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="Enter your phone number"
                    disabled={!isEditing}
                    className="pl-10"
                  />
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="department">Department</Label>
                <div className="relative">
                  <Input
                    id="department"
                    value={profileData.department}
                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                    placeholder="Enter your department"
                    disabled={!isEditing}
                    className="pl-10"
                  />
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={profileData.job_title}
                  onChange={(e) => setProfileData({ ...profileData, job_title: e.target.value })}
                  placeholder="Enter your job title"
                  disabled={!isEditing}
                />
              </div>
              
              <div>
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <Input
                    id="location"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    placeholder="Enter your location"
                    disabled={!isEditing}
                    className="pl-10"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={profileData.timezone}
                  onValueChange={(value) => setProfileData({ ...profileData, timezone: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                disabled={!isEditing}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
            <CardDescription>
              Organization details and account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Organization</Label>
                <div className="flex items-center p-3 bg-muted/50 rounded-md">
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{organization?.name || 'No organization'}</span>
                </div>
              </div>
              
              <div>
                <Label>Role</Label>
                <div className="flex items-center p-3 bg-muted/50 rounded-md">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{userData.role}</span>
                </div>
              </div>
              
              <div>
                <Label>Account Status</Label>
                <div className="flex items-center p-3 bg-muted/50 rounded-md">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm">Active</span>
                </div>
              </div>
              
              <div>
                <Label>Last Login</Label>
                <div className="flex items-center p-3 bg-muted/50 rounded-md">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContent>
  )
}