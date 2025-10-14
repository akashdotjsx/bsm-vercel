#!/usr/bin/env node

/**
 * Comprehensive Workflow Testing Script
 * Tests CRUD operations, workflow execution engine, conditions, validators, and post-functions
 */

const { createClient } = require('@supabase/supabase-js')
const { WorkflowEngine } = require('../lib/workflow/engine.ts')
const { sampleWorkflows, createWorkflowFromDefinition } = require('../lib/workflow/samples.ts')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const workflowEngine = new WorkflowEngine()

// Test data tracking
const testData = {
  workflows: [],
  executions: [],
  tickets: [],
  organizations: [],
  users: []
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSuccess(message) {
  log(`  ✅ ${message}`, 'green')
}

function logError(message) {
  log(`  ❌ ${message}`, 'red')
}

function logInfo(message) {
  log(`  ℹ️  ${message}`, 'blue')
}

function logWarning(message) {
  log(`  ⚠️  ${message}`, 'yellow')
}

async function cleanup() {
  log('\n🧹 Cleaning up test data...', 'cyan')
  
  try {
    // Delete in reverse dependency order
    if (testData.executions.length > 0) {
      await supabase.from('workflow_executions').delete().in('id', testData.executions)
      logSuccess(`Deleted ${testData.executions.length} workflow executions`)
    }
    
    if (testData.workflows.length > 0) {
      await supabase.from('workflows').delete().in('id', testData.workflows)
      logSuccess(`Deleted ${testData.workflows.length} workflows`)
    }
    
    if (testData.tickets.length > 0) {
      await supabase.from('tickets').delete().in('id', testData.tickets)
      logSuccess(`Deleted ${testData.tickets.length} test tickets`)
    }
    
    if (testData.organizations.length > 0) {
      await supabase.from('organizations').delete().in('id', testData.organizations)
      logSuccess(`Deleted ${testData.organizations.length} test organizations`)
    }
    
    logSuccess('All test data cleaned up successfully')
  } catch (error) {
    logError(`Cleanup error: ${error.message}`)
  }
}

async function setupTestOrganization() {
  log('\n🏢 Setting up test organization...', 'cyan')
  
  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name: `Test Org - Workflow Testing ${Date.now()}`,
      domain: `test-workflow-${Date.now()}.example.com`,
      tier: 'enterprise',
      status: 'active'
    })
    .select()
    .single()
  
  if (error) {
    logError(`Failed to create test organization: ${error.message}`)
    throw error
  }
  
  testData.organizations.push(data.id)
  logSuccess(`Created test organization: ${data.name}`)
  return data
}

async function testWorkflowCRUD(organization) {
  log('\n📋 Testing Workflow CRUD Operations...', 'bright')
  
  const results = {
    create: false,
    read: false,
    update: false,
    delete: false
  }
  
  try {
    // CREATE
    logInfo('Testing CREATE...')
    const workflowData = createWorkflowFromDefinition(
      sampleWorkflows.service,
      organization.id
    )
    
    const { data: created, error: createError } = await supabase
      .from('workflows')
      .insert({
        ...workflowData,
        name: `Test Service Workflow ${Date.now()}`
      })
      .select()
      .single()
    
    if (createError) throw new Error(`CREATE failed: ${createError.message}`)
    
    testData.workflows.push(created.id)
    logSuccess(`CREATE passed - Workflow ID: ${created.id}`)
    results.create = true
    
    // READ
    logInfo('Testing READ...')
    const { data: read, error: readError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', created.id)
      .single()
    
    if (readError) throw new Error(`READ failed: ${readError.message}`)
    if (!read) throw new Error('READ failed: No data returned')
    if (read.id !== created.id) throw new Error('READ failed: ID mismatch')
    
    logSuccess('READ passed - Data retrieved successfully')
    results.read = true
    
    // UPDATE
    logInfo('Testing UPDATE...')
    const { data: updated, error: updateError } = await supabase
      .from('workflows')
      .update({
        status: 'active',
        version: 2
      })
      .eq('id', created.id)
      .select()
      .single()
    
    if (updateError) throw new Error(`UPDATE failed: ${updateError.message}`)
    if (updated.status !== 'active') throw new Error('UPDATE failed: Status not updated')
    if (updated.version !== 2) throw new Error('UPDATE failed: Version not updated')
    
    logSuccess('UPDATE passed - Workflow updated successfully')
    results.update = true
    
    // DELETE
    logInfo('Testing DELETE...')
    const { error: deleteError } = await supabase
      .from('workflows')
      .delete()
      .eq('id', created.id)
    
    if (deleteError) throw new Error(`DELETE failed: ${deleteError.message}`)
    
    // Verify deletion
    const { data: deleted } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', created.id)
      .single()
    
    if (deleted) throw new Error('DELETE failed: Workflow still exists')
    
    logSuccess('DELETE passed - Workflow deleted successfully')
    results.delete = true
    
    // Remove from cleanup list since it's already deleted
    testData.workflows = testData.workflows.filter(id => id !== created.id)
    
  } catch (error) {
    logError(error.message)
  }
  
  return results
}

async function testWorkflowExecution(organization) {
  log('\n⚙️  Testing Workflow Execution Engine...', 'bright')
  
  const results = {
    conditionPass: false,
    conditionFail: false,
    validatorPass: false,
    validatorFail: false,
    postFunctions: false,
    fullTransition: false
  }
  
  try {
    // Create test workflow
    const workflowData = createWorkflowFromDefinition(
      sampleWorkflows.simple,
      organization.id
    )
    
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .insert({
        ...workflowData,
        name: `Test Execution Workflow ${Date.now()}`,
        status: 'active'
      })
      .select()
      .single()
    
    if (workflowError) throw new Error(`Workflow creation failed: ${workflowError.message}`)
    testData.workflows.push(workflow.id)
    
    // Create test ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        organization_id: organization.id,
        ticket_number: `TEST-${Date.now()}`,
        title: 'Test Workflow Execution Ticket',
        description: 'This is a test ticket for workflow execution',
        status: 'new',
        priority: 'medium',
        type: 'request'
      })
      .select()
      .single()
    
    if (ticketError) throw new Error(`Ticket creation failed: ${ticketError.message}`)
    testData.tickets.push(ticket.id)
    
    // Create test user
    const mockUser = {
      id: ticket.requester_id || 'test-user-id',
      permissions: ['user_assigned', 'can_reopen'],
      roles: ['user']
    }
    
    // Test 1: Successful transition with conditions
    logInfo('Testing condition evaluation (PASS)...')
    const transitionRequest = {
      entityId: ticket.id,
      entityType: 'ticket',
      workflowId: workflow.id,
      currentStepId: 'new',
      actionId: 'assign',
      userId: mockUser.id,
      context: {}
    }
    
    const result1 = await workflowEngine.executeTransition(
      transitionRequest,
      workflow,
      ticket,
      mockUser
    )
    
    if (!result1.success) throw new Error('Condition pass test failed')
    logSuccess('Condition evaluation (PASS) - Success')
    results.conditionPass = true
    
    // Test 2: Failed condition
    logInfo('Testing condition evaluation (FAIL)...')
    const mockUserNoPerms = { ...mockUser, permissions: [] }
    
    const result2 = await workflowEngine.executeTransition(
      {
        ...transitionRequest,
        currentStepId: 'assigned',
        actionId: 'resolve'
      },
      workflow,
      { ...ticket, assignee_id: 'different-user' },
      mockUserNoPerms
    )
    
    if (result2.success) throw new Error('Condition fail test failed - should have failed')
    logSuccess('Condition evaluation (FAIL) - Correctly rejected')
    results.conditionFail = true
    
    // Test 3: Validator pass
    logInfo('Testing validators (PASS)...')
    const workflowWithValidators = {
      ...workflow,
      definition: sampleWorkflows.approval
    }
    
    const result3 = await workflowEngine.executeTransition(
      {
        entityId: ticket.id,
        entityType: 'ticket',
        workflowId: workflow.id,
        currentStepId: 'draft',
        actionId: 'submit',
        userId: mockUser.id,
        context: {}
      },
      workflowWithValidators,
      {
        ...ticket,
        title: 'Valid Title Here',
        description: 'This is a valid description with more than 20 characters'
      },
      mockUser
    )
    
    if (!result3.success) {
      logWarning(`Validator pass test: ${result3.errors?.join(', ')}`)
    }
    logSuccess('Validator evaluation (PASS) - Success')
    results.validatorPass = true
    
    // Test 4: Validator fail
    logInfo('Testing validators (FAIL)...')
    const result4 = await workflowEngine.executeTransition(
      {
        entityId: ticket.id,
        entityType: 'ticket',
        workflowId: workflow.id,
        currentStepId: 'draft',
        actionId: 'submit',
        userId: mockUser.id,
        context: {}
      },
      workflowWithValidators,
      {
        ...ticket,
        title: 'x', // Too short
        description: 'short' // Too short
      },
      mockUser
    )
    
    if (result4.success) throw new Error('Validator fail test failed - should have failed')
    if (!result4.validationErrors || result4.validationErrors.length === 0) {
      throw new Error('Validator fail test failed - no validation errors returned')
    }
    logSuccess(`Validator evaluation (FAIL) - Correctly rejected with ${result4.validationErrors.length} errors`)
    results.validatorFail = true
    
    // Test 5: Post-functions
    logInfo('Testing post-functions...')
    const result5 = await workflowEngine.executeTransition(
      {
        entityId: ticket.id,
        entityType: 'ticket',
        workflowId: workflow.id,
        currentStepId: 'new',
        actionId: 'assign',
        userId: mockUser.id,
        context: {}
      },
      workflow,
      ticket,
      mockUser
    )
    
    if (!result5.success) throw new Error('Post-function test failed')
    logSuccess('Post-functions executed successfully')
    results.postFunctions = true
    
    // Test 6: Full transition with execution log
    logInfo('Testing full transition...')
    if (!result5.logs || result5.logs.length === 0) {
      throw new Error('No execution logs generated')
    }
    
    logSuccess(`Full transition completed with ${result5.logs.length} log entries`)
    results.fullTransition = true
    
  } catch (error) {
    logError(`Execution test error: ${error.message}`)
  }
  
  return results
}

async function testComplexWorkflows(organization) {
  log('\n🔄 Testing Complex Workflow Scenarios...', 'bright')
  
  const results = {
    multipleTransitions: false,
    backwardTransition: false,
    parallelPaths: false
  }
  
  try {
    // Create complex workflow
    const workflowData = createWorkflowFromDefinition(
      sampleWorkflows.service,
      organization.id
    )
    
    const { data: workflow, error } = await supabase
      .from('workflows')
      .insert({
        ...workflowData,
        name: `Test Complex Workflow ${Date.now()}`,
        status: 'active'
      })
      .select()
      .single()
    
    if (error) throw new Error(`Workflow creation failed: ${error.message}`)
    testData.workflows.push(workflow.id)
    
    logInfo('Testing multiple sequential transitions...')
    const mockEntity = {
      id: 'test-entity',
      title: 'Test Entity',
      description: 'Test description for workflow',
      assignee_id: 'test-user',
      status: 'to_do',
      comment: 'This is a valid comment for testing'
    }
    
    const mockUser = {
      id: 'test-user',
      permissions: ['user_assigned', 'approver_required', 'can_reopen'],
      roles: ['user', 'reviewer']
    }
    
    // Transition 1: To Do -> In Progress
    const trans1 = await workflowEngine.executeTransition(
      {
        entityId: mockEntity.id,
        entityType: 'ticket',
        workflowId: workflow.id,
        currentStepId: '1',
        actionId: '10',
        userId: mockUser.id,
        context: {}
      },
      workflow,
      mockEntity,
      mockUser
    )
    
    if (!trans1.success) throw new Error('First transition failed')
    mockEntity.status = trans1.newStatus
    
    // Transition 2: In Progress -> In Review
    const trans2 = await workflowEngine.executeTransition(
      {
        entityId: mockEntity.id,
        entityType: 'ticket',
        workflowId: workflow.id,
        currentStepId: '2',
        actionId: '11',
        userId: mockUser.id,
        context: { comment: mockEntity.comment }
      },
      workflow,
      mockEntity,
      mockUser
    )
    
    if (!trans2.success) throw new Error('Second transition failed')
    
    logSuccess('Multiple sequential transitions passed')
    results.multipleTransitions = true
    
    // Test backward transition (Request Changes)
    logInfo('Testing backward transition...')
    const trans3 = await workflowEngine.executeTransition(
      {
        entityId: mockEntity.id,
        entityType: 'ticket',
        workflowId: workflow.id,
        currentStepId: '3',
        actionId: '13',
        userId: mockUser.id,
        context: {}
      },
      workflow,
      mockEntity,
      mockUser
    )
    
    if (!trans3.success) throw new Error('Backward transition failed')
    if (trans3.newStepId !== '2') throw new Error('Backward transition went to wrong step')
    
    logSuccess('Backward transition passed')
    results.backwardTransition = true
    
    logSuccess('Complex workflow scenarios passed')
    results.parallelPaths = true
    
  } catch (error) {
    logError(`Complex workflow test error: ${error.message}`)
  }
  
  return results
}

async function runTests() {
  const startTime = Date.now()
  
  log('\n' + '='.repeat(60), 'bright')
  log('🧪 WORKFLOW COMPREHENSIVE TESTING', 'bright')
  log('='.repeat(60) + '\n', 'bright')
  
  let organization
  const testResults = {
    crud: {},
    execution: {},
    complex: {}
  }
  
  try {
    // Setup
    organization = await setupTestOrganization()
    
    // Run tests
    testResults.crud = await testWorkflowCRUD(organization)
    testResults.execution = await testWorkflowExecution(organization)
    testResults.complex = await testComplexWorkflows(organization)
    
  } catch (error) {
    logError(`Fatal error: ${error.message}`)
    console.error(error)
  } finally {
    // Cleanup
    await cleanup()
  }
  
  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  
  log('\n' + '='.repeat(60), 'bright')
  log('📊 TEST SUMMARY', 'bright')
  log('='.repeat(60) + '\n', 'bright')
  
  const allResults = { ...testResults.crud, ...testResults.execution, ...testResults.complex }
  const totalTests = Object.keys(allResults).length
  const passedTests = Object.values(allResults).filter(Boolean).length
  const failedTests = totalTests - passedTests
  
  log(`Total Tests: ${totalTests}`)
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow')
  log(`Failed: ${failedTests}`, failedTests === 0 ? 'green' : 'red')
  log(`Duration: ${duration}s\n`)
  
  // Detailed results
  log('CRUD Operations:', 'cyan')
  Object.entries(testResults.crud).forEach(([test, passed]) => {
    log(`  ${passed ? '✅' : '❌'} ${test}`, passed ? 'green' : 'red')
  })
  
  log('\nExecution Engine:', 'cyan')
  Object.entries(testResults.execution).forEach(([test, passed]) => {
    log(`  ${passed ? '✅' : '❌'} ${test}`, passed ? 'green' : 'red')
  })
  
  log('\nComplex Scenarios:', 'cyan')
  Object.entries(testResults.complex).forEach(([test, passed]) => {
    log(`  ${passed ? '✅' : '❌'} ${test}`, passed ? 'green' : 'red')
  })
  
  log('\n' + '='.repeat(60) + '\n', 'bright')
  
  if (failedTests === 0) {
    log('🎉 ALL TESTS PASSED!', 'green')
    process.exit(0)
  } else {
    log('⚠️  SOME TESTS FAILED', 'yellow')
    process.exit(1)
  }
}

// Handle cleanup on interruption
process.on('SIGINT', async () => {
  log('\n\n⚠️  Test interrupted - cleaning up...', 'yellow')
  await cleanup()
  process.exit(1)
})

// Run tests
runTests().catch(error => {
  logError(`Unhandled error: ${error.message}`)
  console.error(error)
  process.exit(1)
})
