"use client"

import { useAuth } from "@/lib/contexts/auth-context"

export function PermissionsDebug() {
  const { user, profile, permissions, loading, permissionsLoading, canView } = useAuth()

  if (loading || permissionsLoading) {
    return <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">Loading auth data...</div>
  }

  return (
    <div className="p-4 bg-gray-100 border border-gray-400 rounded space-y-2 text-xs">
      <h3 className="font-bold text-sm">Debug: Auth State</h3>
      
      <div><strong>User Email:</strong> {user?.email || 'None'}</div>
      <div><strong>Profile Role:</strong> {profile?.role || 'None'}</div>
      <div><strong>Profile Name:</strong> {profile?.first_name} {profile?.last_name}</div>
      
      <div><strong>Permissions Count:</strong> {permissions.length}</div>
      <div><strong>Permissions:</strong> 
        <pre className="text-xs bg-white p-2 mt-1 rounded border">
          {JSON.stringify(permissions, null, 2)}
        </pre>
      </div>
      
      <div className="space-y-1">
        <div><strong>Permission Checks:</strong></div>
        <div>canView('tickets'): {canView('tickets').toString()}</div>
        <div>canView('services'): {canView('services').toString()}</div>
        <div>canView('knowledge_base'): {canView('knowledge_base').toString()}</div>
        <div>canView('workflows'): {canView('workflows').toString()}</div>
      </div>
    </div>
  )
}