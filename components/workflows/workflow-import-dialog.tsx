'use client'

import React, { useState } from 'react'
import { parseJiraWorkflowXML, parseJiraWorkflowXMLDom } from '@/lib/workflow/jira-parser'
import { useWorkflowMutations } from '@/hooks/use-workflows'
import { useAuth } from '@/lib/contexts/auth-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function WorkflowImportDialog() {
  const [open, setOpen] = useState(false)
  const [importType, setImportType] = useState<'xml' | 'tabular'>('tabular')
  const [xmlContent, setXmlContent] = useState('')
  const [entityType, setEntityType] = useState('ticket')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const { createWorkflow } = useWorkflowMutations()
  const { user } = useAuth()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setXmlContent(content)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!xmlContent.trim()) {
      setError('Please provide workflow content')
      return
    }

    setImporting(true)
    setError(null)
    setSuccess(false)

    try {
      // Try to parse the workflow
      let parsed
      
      if (importType === 'xml') {
        // Use DOM parser for actual XML
        parsed = parseJiraWorkflowXMLDom(xmlContent)
      } else {
        // Use tabular parser for mixed format
        parsed = parseJiraWorkflowXML(xmlContent)
      }

      // Create the workflow in the database
      await createWorkflow({
        organization_id: user?.organization_id,
        name: parsed.meta.name,
        description: parsed.meta.description || '',
        entity_type: entityType,
        workflow_config: parsed.config,
        status: 'draft',
        version: 1,
        tags: ['imported', 'jira'],
        created_by: user?.id
      })

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setXmlContent('')
        setSuccess(false)
      }, 2000)

    } catch (err: any) {
      console.error('Import error:', err)
      setError(err.message || 'Failed to import workflow. Please check the format.')
    } finally {
      setImporting(false)
    }
  }

  const sampleTabular = `<workflow name="Default Service Workflow" description="Sample Jira Workflow Export">
<meta name="jira.description">Sample workflow for demonstration</meta>
<meta name="jira.version">10.0.0</meta>
<meta name="jira.category">Service Management</meta>

Default Service Workflow	1	To Do	New	10	Start Progress	To Do	In Progress	User Assigned
Default Service Workflow	2	In Progress	In Progress	11	Send for Review	In Progress	In Review	Comment Required
Default Service Workflow	3	In Review	Review	12	Approve	In Review	Done	Approver Required
Default Service Workflow	3	In Review	Review	13	Request Changes	In Review	In Progress	Reviewer Assigned
Default Service Workflow	4	Done	Complete	14	Reopen	Done	To Do	Can Reopen`

  const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<workflow name="Default Service Workflow" description="Sample Jira Workflow Export">
  <meta name="jira.description">Sample workflow for demonstration</meta>
  <meta name="jira.version">10.0.0</meta>
  <meta name="jira.category">Service Management</meta>
  <steps>
    <step id="1" name="To Do" status="To Do" category="New">
      <actions>
        <action id="10" name="Start Progress" view="transition" to="2">
          <conditions>
            <condition type="jira.permission.condition">user_assigned</condition>
          </conditions>
          <post-functions>
            <function type="jira.update.status.function"/>
            <function type="jira.update.assignee.function"/>
          </post-functions>
        </action>
      </actions>
    </step>
    <step id="2" name="In Progress" status="In Progress" category="In Progress">
      <actions>
        <action id="11" name="Send for Review" view="transition" to="3">
          <conditions>
            <condition type="jira.field.required">comment_required</condition>
          </conditions>
          <post-functions>
            <function type="jira.notify.reviewer.function"/>
          </post-functions>
        </action>
      </actions>
    </step>
  </steps>
</workflow>`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import Workflow
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Jira Workflow</DialogTitle>
          <DialogDescription>
            Import an existing Jira workflow XML export or tabular format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Success/Error Messages */}
          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Workflow imported successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-500 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Entity Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="entity-type">Entity Type</Label>
            <select
              id="entity-type"
              className="w-full border rounded-md p-2"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              <option value="ticket">Ticket</option>
              <option value="service_request">Service Request</option>
              <option value="incident">Incident</option>
              <option value="change">Change</option>
              <option value="asset">Asset</option>
            </select>
          </div>

          {/* Import Type Tabs */}
          <Tabs value={importType} onValueChange={(v) => setImportType(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tabular">Tabular Format</TabsTrigger>
              <TabsTrigger value="xml">XML Format</TabsTrigger>
            </TabsList>

            <TabsContent value="tabular" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workflow-content">Paste Jira Workflow Export</Label>
                <Textarea
                  id="workflow-content"
                  placeholder="Paste your Jira workflow export here (mixed XML + tabular format)..."
                  className="h-64 font-mono text-sm"
                  value={xmlContent}
                  onChange={(e) => setXmlContent(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Supports the mixed format with XML metadata and tabular workflow data
                </p>
              </div>

              <div className="space-y-2">
                <Label>Or Upload File</Label>
                <Input
                  type="file"
                  accept=".xml,.txt"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
              </div>

              <details className="border rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-sm">
                  View Sample Tabular Format
                </summary>
                <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-x-auto">
                  {sampleTabular}
                </pre>
              </details>
            </TabsContent>

            <TabsContent value="xml" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workflow-xml">Paste Jira Workflow XML</Label>
                <Textarea
                  id="workflow-xml"
                  placeholder="Paste your Jira workflow XML here..."
                  className="h-64 font-mono text-sm"
                  value={xmlContent}
                  onChange={(e) => setXmlContent(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Supports standard Jira workflow XML export format
                </p>
              </div>

              <div className="space-y-2">
                <Label>Or Upload XML File</Label>
                <Input
                  type="file"
                  accept=".xml"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
              </div>

              <details className="border rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-sm">
                  View Sample XML Format
                </summary>
                <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-x-auto">
                  {sampleXML}
                </pre>
              </details>
            </TabsContent>
          </Tabs>

          {/* Preview */}
          {xmlContent && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">Preview</h4>
                  <p className="text-xs text-muted-foreground">
                    {xmlContent.length} characters • Ready to import
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={importing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!xmlContent.trim() || importing}>
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import Workflow
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
