import { NextRequest, NextResponse } from 'next/server'
import { executeGraphQLQueryServer } from '@/lib/supabase/graphql'

// Example API route using GraphQL with server-side Supabase client
export async function GET(request: NextRequest) {
  try {
    // Example query to get all tables in your database
    const query = `
      query GetDatabaseSchema {
        __schema {
          types {
            name
            kind
            fields {
              name
              type {
                name
                kind
              }
            }
          }
        }
      }
    `

    const result = await executeGraphQLQueryServer(query)

    if (result.errors) {
      return NextResponse.json(
        { error: 'GraphQL query failed', details: result.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'GraphQL query executed successfully'
    })
  } catch (error) {
    console.error('GraphQL API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Example POST endpoint for mutations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, variables } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const result = await executeGraphQLQueryServer(query, variables)

    if (result.errors) {
      return NextResponse.json(
        { error: 'GraphQL mutation failed', details: result.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'GraphQL mutation executed successfully'
    })
  } catch (error) {
    console.error('GraphQL API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}