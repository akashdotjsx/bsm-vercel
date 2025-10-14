"use client"

import { useState } from "react"
import { TeamSelector } from "@/components/users/team-selector"
import { UserSelector } from "@/components/users/user-selector"
import { UserAvatar } from "@/components/users/user-avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"

// Demo data
const demoUsers = [
  {
    id: "1",
    first_name: "John",
    last_name: "Doe", 
    display_name: "John Doe",
    email: "john@example.com",
    role: "admin",
    department: "Engineering",
    is_active: true,
    avatar_url: ""
  },
  {
    id: "2", 
    first_name: "Jane",
    last_name: "Smith",
    display_name: "Jane Smith", 
    email: "jane@example.com",
    role: "manager",
    department: "Product",
    is_active: true,
    avatar_url: ""
  },
  {
    id: "3",
    first_name: "Mike",
    last_name: "Wilson",
    email: "mike@example.com", 
    role: "agent",
    department: "Support",
    is_active: false,
    avatar_url: ""
  },
  {
    id: "4",
    first_name: "Sarah",
    last_name: "Johnson",
    email: "sarah@example.com",
    role: "agent", 
    department: "Sales",
    is_active: true,
    avatar_url: ""
  },
  {
    id: "5",
    first_name: "Alex",
    last_name: "Brown",
    email: "alex@example.com",
    role: "manager",
    department: "Marketing",
    is_active: true,
    avatar_url: ""
  }
]

const demoTeams = [
  {
    id: "team1",
    name: "Frontend Team",
    description: "UI/UX Development Team",
    department: "Engineering", 
    is_active: true,
    lead_id: "1",
    team_members: [
      { user: demoUsers[0], role: "lead" },
      { user: demoUsers[1], role: "member" },
      { user: demoUsers[3], role: "member" }
    ]
  },
  {
    id: "team2", 
    name: "Support Squad",
    description: "Customer Support Team",
    department: "Support",
    is_active: true,
    lead_id: "2",
    team_members: [
      { user: demoUsers[1], role: "lead" },
      { user: demoUsers[2], role: "member" },
      { user: demoUsers[4], role: "member" }
    ]
  }
]

export function UIDemo() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [isDark, setIsDark] = useState(false)

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'dark bg-gray-900' : 'bg-muted/50'}`}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[13px] font-bold text-foreground">UI Components Demo</h1>
            <p className="text-muted-foreground mt-2">Enhanced user selection components with better UI and dark mode support</p>
          </div>
          <Button onClick={toggleTheme} variant="outline" size="icon">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        {/* User Avatars Section */}
        <Card>
          <CardHeader>
            <CardTitle>User Avatars</CardTitle>
            <CardDescription>Different sizes and configurations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-3">Small Size</h4>
              <div className="flex flex-wrap gap-4">
                {demoUsers.map((user) => (
                  <UserAvatar 
                    key={user.id} 
                    user={user} 
                    size="sm" 
                    showName 
                    showRole 
                    showStatus
                    showDepartment
                  />
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-3">Medium Size</h4>
              <div className="flex flex-wrap gap-4">
                {demoUsers.slice(0, 3).map((user) => (
                  <UserAvatar 
                    key={user.id} 
                    user={user} 
                    size="md" 
                    showName 
                    showRole 
                    showStatus
                    showDepartment
                  />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Large Size</h4>
              <div className="flex flex-wrap gap-6">
                {demoUsers.slice(0, 2).map((user) => (
                  <UserAvatar 
                    key={user.id} 
                    user={user} 
                    size="lg" 
                    showName 
                    showRole 
                    showStatus
                    showDepartment
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Selector Section */}
        <Card>
          <CardHeader>
            <CardTitle>User Selector</CardTitle>
            <CardDescription>Single user selection with enhanced UI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <UserSelector
                users={demoUsers}
                value={selectedUser}
                onValueChange={setSelectedUser}
                placeholder="Choose a user..."
                className="w-full max-w-md"
              />
              {selectedUser && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Selected user ID: {selectedUser}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Selector Section */}
        <Card>
          <CardHeader>
            <CardTitle>Team Selector</CardTitle>
            <CardDescription>Multi-user selection with team auto-tagging</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <TeamSelector
                teams={demoTeams}
                users={demoUsers}
                selectedUserIds={selectedUsers}
                onUsersChange={setSelectedUsers}
                placeholder="Select teams or individual users..."
                className="w-full max-w-lg"
              />
              {selectedUsers.length > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Selected users ({selectedUsers.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((userId) => {
                      const user = demoUsers.find(u => u.id === userId)
                      return user ? (
                        <UserAvatar 
                          key={userId}
                          user={user}
                          size="sm"
                          showName
                          showRole
                        />
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Display Section */}
        <Card>
          <CardHeader>
            <CardTitle>Team Displays</CardTitle>
            <CardDescription>How teams are presented in the improved UI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {demoTeams.map((team) => (
                <div key={team.id} className="p-4 border rounded-lg 0">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{team.name.substring(0, 2)}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{team.name}</h4>
                      <p className="text-sm text-muted-foreground">{team.department} • {team.team_members?.length} members</p>
                    </div>
                  </div>
                  <div className="flex -space-x-2">
                    {team.team_members?.slice(0, 5).map((member) => (
                      <UserAvatar 
                        key={member.user.id}
                        user={member.user}
                        size="sm"
                        showStatus
                        className="ring-2 ring-background"
                      />
                    ))}
                    {(team.team_members?.length || 0) > 5 && (
                      <div className="w-6 h-6 rounded-full bg-muted ring-2 ring-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                        +{(team.team_members?.length || 0) - 5}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}