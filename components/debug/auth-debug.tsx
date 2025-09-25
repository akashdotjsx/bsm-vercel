'use client'

import { useAuth } from '@/lib/contexts/auth-context'

export function AuthDebug() {
  const { user, profile, organization, loading } = useAuth()

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-lg max-w-md text-xs z-50">
      <h3 className="font-bold mb-2">Auth Debug Info</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Loading:</strong> {loading ? 'true' : 'false'}
        </div>
        
        <div>
          <strong>User:</strong> {user ? user.email : 'null'}
        </div>
        
        <div>
          <strong>Profile:</strong>
          {profile ? (
            <div className="ml-2 mt-1">
              <div>ID: {profile.id}</div>
              <div>Name: {profile.first_name} {profile.last_name}</div>
              <div>Role: {profile.role}</div>
              <div>Department: {profile.department}</div>
              <div>Active: {profile.is_active ? 'true' : 'false'}</div>
            </div>
          ) : (
            ' null'
          )}
        </div>
        
        <div>
          <strong>Organization:</strong>
          {organization ? (
            <div className="ml-2 mt-1">
              <div>Name: {organization.name}</div>
              <div>Tier: {organization.subscription_tier}</div>
            </div>
          ) : (
            ' null'
          )}
        </div>
      </div>
    </div>
  )
}