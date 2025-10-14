/**
 * GraphQL Ticket Details Test Suite
 * 
 * Tests all ticket detail operations including:
 * - Fetching single ticket with all relations
 * - Updating ticket properties
 * - Adding/viewing comments
 * - Managing checklist items
 * - Attachment metadata
 */

import { createGraphQLClient } from '../lib/graphql/client'
import { gql } from 'graphql-request'

// Color helpers for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration: number
}

const results: TestResult[] = []

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now()
  try {
    await testFn()
    const duration = Date.now() - startTime
    results.push({ name, passed: true, duration })
    log(`✅ ${name} (${duration}ms)`, 'green')
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)
    results.push({ name, passed: false, error: errorMessage, duration })
    log(`❌ ${name} (${duration}ms)`, 'red')
    log(`   Error: ${errorMessage}`, 'red')
  }
}

// Test data cleanup
const createdIds = {
  tickets: [] as string[],
  comments: [] as string[],
  checklist: [] as string[],
  attachments: [] as string[],
}

async function cleanup() {
  log('\n🧹 Cleaning up test data...', 'yellow')
  const client = await createGraphQLClient()

  try {
    // Delete checklist items
    if (createdIds.checklist.length > 0) {
      await client.request(gql`
        mutation DeleteChecklistItems($ids: [UUID!]!) {
          deleteFromticket_checklistCollection(filter: { id: { in: $ids } }) {
            affectedCount
          }
        }
      `, { ids: createdIds.checklist })
      log(`   Deleted ${createdIds.checklist.length} checklist items`, 'cyan')
    }

    // Delete comments
    if (createdIds.comments.length > 0) {
      await client.request(gql`
        mutation DeleteComments($ids: [UUID!]!) {
          deleteFromticket_commentsCollection(filter: { id: { in: $ids } }) {
            affectedCount
          }
        }
      `, { ids: createdIds.comments })
      log(`   Deleted ${createdIds.comments.length} comments`, 'cyan')
    }

    // Delete attachments
    if (createdIds.attachments.length > 0) {
      await client.request(gql`
        mutation DeleteAttachments($ids: [UUID!]!) {
          deleteFromticket_attachmentsCollection(filter: { id: { in: $ids } }) {
            affectedCount
          }
        }
      `, { ids: createdIds.attachments })
      log(`   Deleted ${createdIds.attachments.length} attachments`, 'cyan')
    }

    // Delete tickets
    if (createdIds.tickets.length > 0) {
      await client.request(gql`
        mutation DeleteTickets($ids: [UUID!]!) {
          deleteFromticketsCollection(filter: { id: { in: $ids } }) {
            affectedCount
          }
        }
      `, { ids: createdIds.tickets })
      log(`   Deleted ${createdIds.tickets.length} tickets`, 'cyan')
    }

    log('✅ Cleanup completed successfully\n', 'green')
  } catch (error) {
    log(`⚠️  Cleanup encountered errors: ${error}`, 'yellow')
  }
}

// ============================================================================
// TEST: Fetch Single Ticket with All Relations
// ============================================================================

async function testFetchTicketWithRelations() {
  const client = await createGraphQLClient()

  // First create a test ticket
  const createMutation = gql`
    mutation CreateTestTicket($input: ticketsInsertInput!) {
      insertIntoticketsCollection(objects: [$input]) {
        records {
          id
          ticket_number
          title
        }
      }
    }
  `

  const ticketData = {
    title: 'Test Ticket for Relations Query',
    description: 'Testing single ticket fetch with all relations',
    type: 'task',
    priority: 'medium',
    status: 'open',
  }

  const createResult: any = await client.request(createMutation, { input: ticketData })
  const ticketId = createResult.insertIntoticketsCollection.records[0].id
  createdIds.tickets.push(ticketId)

  // Now fetch it with the full query
  const query = gql`
    query GetTicketById($id: UUID!) {
      ticketsCollection(filter: { id: { eq: $id } }) {
        edges {
          node {
            id
            ticket_number
            title
            description
            type
            priority
            status
            created_at
            requester: profiles {
              id
              display_name
              email
            }
            assignee: profiles {
              id
              display_name
            }
            comments: ticket_commentsCollection {
              edges {
                node {
                  id
                  content
                  is_internal
                  created_at
                }
              }
            }
            checklist: ticket_checklistCollection {
              edges {
                node {
                  id
                  text
                  completed
                }
              }
            }
          }
        }
      }
    }
  `

  const result: any = await client.request(query, { id: ticketId })
  
  if (!result.ticketsCollection.edges || result.ticketsCollection.edges.length === 0) {
    throw new Error('Ticket not found')
  }

  const ticket = result.ticketsCollection.edges[0].node
  
  if (ticket.title !== ticketData.title) {
    throw new Error(`Title mismatch: expected "${ticketData.title}", got "${ticket.title}"`)
  }

  if (!ticket.ticket_number) {
    throw new Error('Ticket number not generated')
  }
}

// ============================================================================
// TEST: Update Ticket Properties
// ============================================================================

async function testUpdateTicket() {
  const client = await createGraphQLClient()

  // Create a test ticket
  const createResult: any = await client.request(gql`
    mutation CreateTestTicket($input: ticketsInsertInput!) {
      insertIntoticketsCollection(objects: [$input]) {
        records {
          id
          title
          priority
          status
        }
      }
    }
  `, {
    input: {
      title: 'Test Ticket for Update',
      priority: 'low',
      status: 'new',
      type: 'task',
    }
  })

  const ticketId = createResult.insertIntoticketsCollection.records[0].id
  createdIds.tickets.push(ticketId)

  // Update the ticket
  const updateMutation = gql`
    mutation UpdateTicket($id: UUID!, $updates: ticketsUpdateInput!) {
      updateticketsCollection(filter: { id: { eq: $id } }, set: $updates) {
        records {
          id
          title
          priority
          status
        }
      }
    }
  `

  const updates = {
    title: 'Updated Test Ticket',
    priority: 'high',
    status: 'in_progress',
  }

  const updateResult: any = await client.request(updateMutation, {
    id: ticketId,
    updates
  })

  const updatedTicket = updateResult.updateticketsCollection.records[0]

  if (updatedTicket.title !== updates.title) {
    throw new Error(`Title not updated correctly`)
  }

  if (updatedTicket.priority !== updates.priority) {
    throw new Error(`Priority not updated correctly`)
  }

  if (updatedTicket.status !== updates.status) {
    throw new Error(`Status not updated correctly`)
  }
}

// ============================================================================
// TEST: Add and Fetch Comments
// ============================================================================

async function testAddAndFetchComments() {
  const client = await createGraphQLClient()

  // Create a test ticket
  const ticketResult: any = await client.request(gql`
    mutation CreateTestTicket($input: ticketsInsertInput!) {
      insertIntoticketsCollection(objects: [$input]) {
        records {
          id
        }
      }
    }
  `, {
    input: {
      title: 'Test Ticket for Comments',
      type: 'task',
      priority: 'medium',
      status: 'open',
    }
  })

  const ticketId = ticketResult.insertIntoticketsCollection.records[0].id
  createdIds.tickets.push(ticketId)

  // Add a comment
  const addCommentMutation = gql`
    mutation AddComment($input: ticket_commentsInsertInput!) {
      insertIntoticket_commentsCollection(objects: [$input]) {
        records {
          id
          ticket_id
          content
          is_internal
          is_system
          created_at
        }
      }
    }
  `

  const commentData = {
    ticket_id: ticketId,
    content: 'This is a test comment from GraphQL',
    is_internal: false,
    is_system: false,
  }

  const commentResult: any = await client.request(addCommentMutation, { input: commentData })
  const commentId = commentResult.insertIntoticket_commentsCollection.records[0].id
  createdIds.comments.push(commentId)

  // Fetch ticket with comments
  const query = gql`
    query GetTicketWithComments($id: UUID!) {
      ticketsCollection(filter: { id: { eq: $id } }) {
        edges {
          node {
            id
            comments: ticket_commentsCollection {
              edges {
                node {
                  id
                  content
                  is_internal
                }
              }
            }
          }
        }
      }
    }
  `

  const result: any = await client.request(query, { id: ticketId })
  const comments = result.ticketsCollection.edges[0].node.comments.edges

  if (comments.length === 0) {
    throw new Error('Comment not found after creation')
  }

  const comment = comments.find((c: any) => c.node.id === commentId)
  if (!comment) {
    throw new Error('Created comment not in results')
  }

  if (comment.node.content !== commentData.content) {
    throw new Error('Comment content mismatch')
  }
}

// ============================================================================
// TEST: Checklist CRUD Operations
// ============================================================================

async function testChecklistOperations() {
  const client = await createGraphQLClient()

  // Create a test ticket
  const ticketResult: any = await client.request(gql`
    mutation CreateTestTicket($input: ticketsInsertInput!) {
      insertIntoticketsCollection(objects: [$input]) {
        records {
          id
        }
      }
    }
  `, {
    input: {
      title: 'Test Ticket for Checklist',
      type: 'task',
      priority: 'medium',
      status: 'open',
    }
  })

  const ticketId = ticketResult.insertIntoticketsCollection.records[0].id
  createdIds.tickets.push(ticketId)

  // Add checklist item
  const addItemMutation = gql`
    mutation AddChecklistItem($input: ticket_checklistInsertInput!) {
      insertIntoticket_checklistCollection(objects: [$input]) {
        records {
          id
          ticket_id
          text
          completed
        }
      }
    }
  `

  const itemData = {
    ticket_id: ticketId,
    text: 'Test checklist item',
    completed: false,
  }

  const addResult: any = await client.request(addItemMutation, { input: itemData })
  const itemId = addResult.insertIntoticket_checklistCollection.records[0].id
  createdIds.checklist.push(itemId)

  // Update checklist item
  const updateItemMutation = gql`
    mutation UpdateChecklistItem($id: UUID!, $updates: ticket_checklistUpdateInput!) {
      updateticket_checklistCollection(filter: { id: { eq: $id } }, set: $updates) {
        records {
          id
          text
          completed
        }
      }
    }
  `

  const updateResult: any = await client.request(updateItemMutation, {
    id: itemId,
    updates: { completed: true, text: 'Updated checklist item' }
  })

  const updatedItem = updateResult.updateticket_checklistCollection.records[0]

  if (!updatedItem.completed) {
    throw new Error('Checklist item not marked as completed')
  }

  if (updatedItem.text !== 'Updated checklist item') {
    throw new Error('Checklist item text not updated')
  }

  // Verify checklist in ticket query
  const query = gql`
    query GetTicketWithChecklist($id: UUID!) {
      ticketsCollection(filter: { id: { eq: $id } }) {
        edges {
          node {
            id
            checklist: ticket_checklistCollection {
              edges {
                node {
                  id
                  text
                  completed
                }
              }
            }
          }
        }
      }
    }
  `

  const result: any = await client.request(query, { id: ticketId })
  const checklist = result.ticketsCollection.edges[0].node.checklist.edges

  if (checklist.length === 0) {
    throw new Error('Checklist item not found in ticket query')
  }
}

// ============================================================================
// TEST: Attachment Metadata
// ============================================================================

async function testAttachmentMetadata() {
  const client = await createGraphQLClient()

  // Create a test ticket
  const ticketResult: any = await client.request(gql`
    mutation CreateTestTicket($input: ticketsInsertInput!) {
      insertIntoticketsCollection(objects: [$input]) {
        records {
          id
        }
      }
    }
  `, {
    input: {
      title: 'Test Ticket for Attachments',
      type: 'task',
      priority: 'medium',
      status: 'open',
    }
  })

  const ticketId = ticketResult.insertIntoticketsCollection.records[0].id
  createdIds.tickets.push(ticketId)

  // Add attachment metadata
  const addAttachmentMutation = gql`
    mutation AddAttachment($input: ticket_attachmentsInsertInput!) {
      insertIntoticket_attachmentsCollection(objects: [$input]) {
        records {
          id
          ticket_id
          filename
          file_size
          mime_type
          storage_path
          is_public
        }
      }
    }
  `

  const attachmentData = {
    ticket_id: ticketId,
    filename: 'test-file.pdf',
    file_size: 1024,
    mime_type: 'application/pdf',
    storage_path: '/test/path/test-file.pdf',
    is_public: false,
  }

  const attachmentResult: any = await client.request(addAttachmentMutation, { input: attachmentData })
  const attachmentId = attachmentResult.insertIntoticket_attachmentsCollection.records[0].id
  createdIds.attachments.push(attachmentId)

  // Verify attachment in ticket query
  const query = gql`
    query GetTicketWithAttachments($id: UUID!) {
      ticketsCollection(filter: { id: { eq: $id } }) {
        edges {
          node {
            id
            attachments: ticket_attachmentsCollection {
              edges {
                node {
                  id
                  filename
                  file_size
                  mime_type
                }
              }
            }
          }
        }
      }
    }
  `

  const result: any = await client.request(query, { id: ticketId })
  const attachments = result.ticketsCollection.edges[0].node.attachments.edges

  if (attachments.length === 0) {
    throw new Error('Attachment not found in ticket query')
  }

  const attachment = attachments[0].node

  if (attachment.filename !== attachmentData.filename) {
    throw new Error('Attachment filename mismatch')
  }

  if (attachment.file_size !== attachmentData.file_size) {
    throw new Error('Attachment file size mismatch')
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  log('\n' + '='.repeat(80), 'cyan')
  log('🧪 GraphQL Ticket Details Test Suite', 'cyan')
  log('='.repeat(80) + '\n', 'cyan')

  log('Running ticket detail operation tests...\n', 'blue')

  await runTest('Fetch single ticket with all relations', testFetchTicketWithRelations)
  await runTest('Update ticket properties', testUpdateTicket)
  await runTest('Add and fetch comments', testAddAndFetchComments)
  await runTest('Checklist CRUD operations', testChecklistOperations)
  await runTest('Attachment metadata management', testAttachmentMetadata)

  await cleanup()

  // Summary
  log('='.repeat(80), 'cyan')
  log('📊 Test Summary', 'cyan')
  log('='.repeat(80) + '\n', 'cyan')

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

  log(`Total Tests: ${total}`, 'blue')
  log(`Passed: ${passed}`, 'green')
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green')
  log(`Total Duration: ${totalDuration}ms\n`, 'blue')

  if (failed > 0) {
    log('Failed Tests:', 'red')
    results.filter(r => !r.passed).forEach(r => {
      log(`  ❌ ${r.name}`, 'red')
      log(`     ${r.error}`, 'red')
    })
    log('')
    process.exit(1)
  } else {
    log('✅ All tests passed!', 'green')
    log('')
    process.exit(0)
  }
}

// Handle cleanup on interrupt
process.on('SIGINT', async () => {
  log('\n\n🛑 Test interrupted by user', 'yellow')
  await cleanup()
  process.exit(1)
})

process.on('unhandledRejection', async (error) => {
  log(`\n\n💥 Unhandled rejection: ${error}`, 'red')
  await cleanup()
  process.exit(1)
})

// Run tests
runAllTests().catch(async (error) => {
  log(`\n\n💥 Fatal error: ${error}`, 'red')
  await cleanup()
  process.exit(1)
})
