'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function TestProfilePage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const testProfileFetch = async () => {
      try {
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        console.log('Current user:', currentUser)
        setUser(currentUser)

        if (!currentUser) {
          setTestResult({ error: 'No authenticated user' })
          return
        }

        // Test profile fetch
        console.log('Fetching profile for user ID:', currentUser.id)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        console.log('Profile fetch result:', { profileData, profileError })

        if (profileError) {
          setTestResult({ error: profileError.message, details: profileError })
        } else {
          setTestResult({ success: true, profile: profileData })
        }
      } catch (error) {
        console.error('Test error:', error)
        setTestResult({ error: 'Unexpected error', details: error })
      }
    }

    testProfileFetch()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile Fetch Test</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Current User</h2>
          <pre className="text-sm overflow-auto bg-white p-2 rounded">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Profile Fetch Test Result</h2>
          <pre className="text-sm overflow-auto bg-white p-2 rounded">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}