"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTickets } from '@/hooks/use-tickets'
import { useTicketsGQL } from '@/hooks/use-tickets-gql'
import { useProfilesGQL } from '@/hooks/use-users-gql'
import { userAPI } from '@/lib/api/users'
import { Loader2, Zap, Globe } from 'lucide-react'

/**
 * Test page to compare REST vs GraphQL performance
 * 
 * Navigate to: /test-graphql
 */
export default function TestGraphQLPage() {
  const [restTime, setRestTime] = useState<number | null>(null)
  const [graphqlTime, setGraphqlTime] = useState<number | null>(null)
  const [restData, setRestData] = useState<any>(null)
  const [graphqlData, setGraphqlData] = useState<any>(null)
  
  // Test 1: Tickets with REST
  const [testingRest, setTestingRest] = useState(false)
  const testREST = async () => {
    setTestingRest(true)
    setRestTime(null)
    setRestData(null)
    
    const start = performance.now()
    try {
      // Simulating multiple REST calls
      const ticketsResponse = await fetch('/api/tickets?limit=10')
      const ticketsData = await ticketsResponse.json()
      
      const end = performance.now()
      setRestTime(end - start)
      setRestData(ticketsData)
    } catch (error) {
      console.error('REST Error:', error)
    } finally {
      setTestingRest(false)
    }
  }
  
  // Test 2: Tickets with GraphQL
  const [testingGraphQL, setTestingGraphQL] = useState(false)
  const testGraphQL = async () => {
    setTestingGraphQL(true)
    setGraphqlTime(null)
    setGraphqlData(null)
    
    const start = performance.now()
    try {
      const { createGraphQLClient } = await import('@/lib/graphql/client')
      const { GET_TICKETS_QUERY } = await import('@/lib/graphql/queries')
      
      const client = await createGraphQLClient()
      const data = await client.request(GET_TICKETS_QUERY, {
        first: 10,
        orderBy: [{ created_at: 'DescNullsLast' }]
      })
      
      const end = performance.now()
      setGraphqlTime(end - start)
      setGraphqlData(data)
    } catch (error) {
      console.error('GraphQL Error:', error)
    } finally {
      setTestingGraphQL(false)
    }
  }

  const improvement = restTime && graphqlTime 
    ? ((restTime - graphqlTime) / restTime * 100).toFixed(1)
    : null

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">GraphQL Phase 1 Test</h1>
          <p className="text-muted-foreground">
            Compare REST API vs GraphQL performance for fetching tickets
          </p>
        </div>

        {/* Test Controls */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* REST Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                REST API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testREST} 
                disabled={testingRest}
                className="w-full"
                variant="outline"
              >
                {testingRest ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Testing REST...
                  </>
                ) : (
                  'Test REST API'
                )}
              </Button>
              
              {restTime !== null && (
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-center">
                    {restTime.toFixed(0)}ms
                  </div>
                  <Badge variant="secondary" className="w-full justify-center">
                    {restData?.tickets?.length || 0} tickets fetched
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* GraphQL Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-500" />
                GraphQL
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testGraphQL} 
                disabled={testingGraphQL}
                className="w-full"
                variant="default"
              >
                {testingGraphQL ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Testing GraphQL...
                  </>
                ) : (
                  'Test GraphQL'
                )}
              </Button>
              
              {graphqlTime !== null && (
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-center text-purple-600">
                    {graphqlTime.toFixed(0)}ms
                  </div>
                  <Badge variant="default" className="w-full justify-center">
                    {graphqlData?.ticketsCollection?.edges?.length || 0} tickets fetched
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Comparison */}
        {restTime && graphqlTime && (
          <Card className="border-2 border-purple-500">
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">REST</div>
                  <div className="text-xl font-bold">{restTime.toFixed(0)}ms</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">GraphQL</div>
                  <div className="text-xl font-bold text-purple-600">{graphqlTime.toFixed(0)}ms</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Improvement</div>
                  <div className="text-xl font-bold text-green-600">
                    {improvement}% faster
                  </div>
                </div>
              </div>

              <div className="relative pt-4">
                <div className="overflow-hidden h-4 text-xs flex rounded bg-gray-200">
                  <div 
                    style={{ width: `${(graphqlTime / restTime) * 100}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500 transition-all"
                  />
                </div>
                <p className="text-sm text-center mt-2 text-muted-foreground">
                  GraphQL is {improvement}% faster than REST for this query
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hook Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Live Hook Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* REST Hook Example */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                REST Hook (useTickets)
              </h3>
              <RESTExample />
            </div>

            {/* GraphQL Hook Example */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-purple-600">
                <Zap className="w-4 h-4" />
                GraphQL Hook (useTicketsGQL)
              </h3>
              <GraphQLExample />
            </div>
          </CardContent>
        </Card>

        {/* Documentation Link */}
        <Card className="bg-purple-50 dark:bg-purple-950">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">Ready to migrate?</h3>
              <p className="text-sm text-muted-foreground">
                Check out the complete migration guide in GRAPHQL_MIGRATION.md
              </p>
              <Button variant="link" className="text-purple-600">
                View Migration Guide →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function RESTExample() {
  const { tickets, loading, error } = useTickets({ limit: 5 })
  
  if (loading) return <div className="text-sm text-muted-foreground">Loading REST data...</div>
  if (error) return <div className="text-sm text-red-500">Error: {error}</div>
  
  return (
    <div className="text-sm space-y-1">
      <Badge variant="outline">{tickets.length} tickets loaded</Badge>
      {tickets.slice(0, 3).map((ticket: any) => (
        <div key={ticket.id} className="text-muted-foreground truncate">
          • {ticket.title}
        </div>
      ))}
    </div>
  )
}

function GraphQLExample() {
  const { tickets, loading, error } = useTicketsGQL({ limit: 5 })
  
  if (loading) return <div className="text-sm text-muted-foreground">Loading GraphQL data...</div>
  if (error) return <div className="text-sm text-red-500">Error: {error}</div>
  
  return (
    <div className="text-sm space-y-1">
      <Badge variant="default" className="bg-purple-600">{tickets.length} tickets loaded</Badge>
      {tickets.slice(0, 3).map((ticket: any) => (
        <div key={ticket.id} className="text-muted-foreground truncate">
          • {ticket.title} {ticket.requester && `(by ${ticket.requester.display_name})`}
        </div>
      ))}
    </div>
  )
}
