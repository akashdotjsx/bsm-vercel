import { NextRequest, NextResponse } from 'next/server'
import { createServerGraphQLClient } from '@/lib/graphql/client'
import { gql } from 'graphql-request'

// GET - Fetch workflows
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organization_id = searchParams.get('organization_id')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')

    const client = createServerGraphQLClient()

    // Build filter
    const filter: any = {}
    
    if (organization_id) {
      filter.organization_id = { eq: organization_id }
    }
    
    if (status) {
      filter.status = { eq: status }
    }
    
    if (search) {
      filter.or = [
        { name: { ilike: `%${search}%` } },
        { description: { ilike: `%${search}%` } }
      ]
    }

    const query = gql`
      query GetWorkflows($filter: workflowsFilter, $first: Int!, $offset: Int!) {
        workflowsCollection(filter: $filter, first: $first, offset: $offset, orderBy: [{ created_at: DescNullsLast }]) {
          edges {
            node {
              id
              name
              description
              status
              category
              definition
              version
              is_template
              created_by
              last_modified_by
              organization_id
              total_executions
              successful_executions
              failed_executions
              created_at
              updated_at
            }
          }
        }
      }
    `

    const variables = {
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      first: limit,
      offset: (page - 1) * limit
    }

    const data: any = await client.request(query, variables)
    
    const workflows = data?.workflowsCollection?.edges?.map((edge: any) => edge.node) || []
    
    return NextResponse.json({ workflows })
  } catch (error: any) {
    console.error('API Error fetching workflows:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}

// POST - Create workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const client = createServerGraphQLClient()
    
    const mutation = gql`
      mutation CreateWorkflow($input: workflowsInsertInput!) {
        insertIntoworkflowsCollection(objects: [$input]) {
          records {
            id
            name
            description
            status
            category
            version
            is_template
            created_at
          }
        }
      }
    `
    
    const result: any = await client.request(mutation, { input: body })
    const workflow = result.insertIntoworkflowsCollection.records[0]
    
    return NextResponse.json({ workflow })
  } catch (error: any) {
    console.error('API Error creating workflow:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create workflow' },
      { status: 500 }
    )
  }
}

// PUT - Update workflow
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 })
    }
    
    const client = createServerGraphQLClient()
    
    const mutation = gql`
      mutation UpdateWorkflow($id: UUID!, $set: workflowsUpdateInput!) {
        updateworkflowsCollection(filter: { id: { eq: $id } }, set: $set) {
          records {
            id
            name
            description
            status
            category
            version
            updated_at
          }
        }
      }
    `
    
    const result: any = await client.request(mutation, { id, set: data })
    const workflow = result.updateworkflowsCollection.records[0]
    
    return NextResponse.json({ workflow })
  } catch (error: any) {
    console.error('API Error updating workflow:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update workflow' },
      { status: 500 }
    )
  }
}

// DELETE - Delete workflow
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 })
    }
    
    const client = createServerGraphQLClient()
    
    const mutation = gql`
      mutation DeleteWorkflow($id: UUID!) {
        deleteFromworkflowsCollection(filter: { id: { eq: $id } }) {
          records {
            id
          }
        }
      }
    `
    
    await client.request(mutation, { id })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API Error deleting workflow:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete workflow' },
      { status: 500 }
    )
  }
}
