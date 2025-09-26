'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/auth-context'

const supabase = createClient()

export function AuthDebug() {
  const { user, profile, organization, loading } = useAuth()
  const [sessionData, setSessionData] = useState<any>(null)
  const [localStorageData, setLocalStorageData] = useState<any[]>([])  
  const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString())

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSessionData(session)
      setTimestamp(new Date().toLocaleTimeString())
    }

    const checkLocalStorage = () => {
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage).filter(key => key.includes('supabase'))
        const data = keys.map(key => ({
          key,
          value: localStorage.getItem(key),
          exists: !!localStorage.getItem(key)
        }))
        setLocalStorageData(data)
      }
    }

    checkSession()
    checkLocalStorage()

    const interval = setInterval(() => {
      checkSession()
      checkLocalStorage()
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed top-4 right-4 bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-sm text-xs z-50 font-mono max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-yellow-400">🐛 Auth Debug</h3>
        <span className="text-gray-400">{timestamp}</span>
      </div>
      
      <div className="space-y-2">
        <div className="border-b border-gray-700 pb-2">
          <div className="text-blue-400 font-bold">Auth Context:</div>
          <div>Loading: {loading ? '✅' : '❌'}</div>
          <div>User: {user?.email || '❌'}</div>
          <div>Profile: {profile?.display_name || '❌'}</div>
          <div>Organization: {organization?.name || '❌'}</div>
        </div>

        <div className="border-b border-gray-700 pb-2">
          <div className="text-green-400 font-bold">Direct Session:</div>
          <div>Session exists: {sessionData ? '✅' : '❌'}</div>
          <div>Session user: {sessionData?.user?.email || '❌'}</div>
          <div>Access token: {sessionData?.access_token ? 'exists' : '❌'}</div>
          <div>Refresh token: {sessionData?.refresh_token ? 'exists' : '❌'}</div>
          <div>Expires at: {sessionData?.expires_at ? new Date(sessionData.expires_at * 1000).toLocaleTimeString() : '❌'}</div>
        </div>

        <div>
          <div className="text-purple-400 font-bold">LocalStorage:</div>
          {localStorageData.length === 0 ? (
            <div className="text-red-400">No supabase keys found</div>
          ) : (
            localStorageData.map(item => (
              <div key={item.key} className="text-xs">
                <span className="text-gray-400">{item.key.split('.').pop()}:</span> {item.exists ? '✅' : '❌'}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}