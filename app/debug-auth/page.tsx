'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { useEffect } from 'react'

export default function AuthDebugPage() {
  const { user, profile, organization, loading, hasRole, isAdmin, isManager, isAgent } = useAuth()

  useEffect(() => {
    console.log('=== AUTH DEBUG PAGE ===')
    console.log('Loading:', loading)
    console.log('User:', user)
    console.log('Profile:', profile)
    console.log('Organization:', organization)
    console.log('hasRole("admin"):', hasRole('admin'))
    console.log('hasRole(["admin", "manager"]):', hasRole(['admin', 'manager']))
    console.log('isAdmin:', isAdmin)
    console.log('isManager:', isManager)
    console.log('isAgent:', isAgent)
  }, [user, profile, organization, loading, hasRole, isAdmin, isManager, isAgent])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Information</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">User</h2>
          <pre className="text-sm overflow-auto bg-white p-2 rounded">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Profile</h2>
          <pre className="text-sm overflow-auto bg-white p-2 rounded">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Organization</h2>
          <pre className="text-sm overflow-auto bg-white p-2 rounded">
            {JSON.stringify(organization, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Role Checks</h2>
          <div className="space-y-2 text-sm">
            <div>Loading: {loading ? 'true' : 'false'}</div>
            <div>hasRole('admin'): {hasRole('admin') ? 'true' : 'false'}</div>
            <div>hasRole(['admin', 'manager']): {hasRole(['admin', 'manager']) ? 'true' : 'false'}</div>
            <div>isAdmin: {isAdmin ? 'true' : 'false'}</div>
            <div>isManager: {isManager ? 'true' : 'false'}</div>
            <div>isAgent: {isAgent ? 'true' : 'false'}</div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Expected Behavior</h2>
          <div className="text-sm space-y-1">
            <div>For admin@kroolo.com with role 'admin':</div>
            <ul className="ml-4 list-disc">
              <li>Should see Administration menu in sidebar</li>
              <li>Should be able to access /users page</li>
              <li>isAdmin should be true</li>
              <li>hasRole('admin') should be true</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}