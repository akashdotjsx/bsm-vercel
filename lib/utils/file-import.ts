import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export interface ImportTicketData {
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical'
  type: 'incident' | 'request' | 'problem' | 'change' | 'task'
  assignee?: string
  due_date?: string
  status?: 'new' | 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed'
}

export interface ImportResult {
  success: boolean
  tickets: ImportTicketData[]
  errors: string[]
  totalRows: number
  validRows: number
  successfullyImportedCount: number
  failedImportCount: number
  parsingErrors: string[]
  validationErrors: string[]
  importErrors: string[]
}

export interface ImportProgress {
  current: number
  total: number
  status: 'parsing' | 'validating' | 'importing' | 'completed' | 'error'
  message: string
}

// Configuration for validation
const CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  requiredColumns: ['title', 'priority', 'type'],
  optionalColumns: ['description', 'assignee', 'due_date', 'status'],
  validPriorities: ['low', 'medium', 'high', 'urgent', 'critical'],
  validTypes: ['incident', 'request', 'problem', 'change', 'general_query'],
  validStatuses: ['new', 'open', 'in_progress', 'pending', 'resolved', 'closed'],
  supportedExtensions: ['csv', 'xlsx', 'xls']
}

// Column mapping for different possible column names
const COLUMN_MAPPING = {
  title: ['title', 'ticket_title', 'subject', 'summary', 'name'],
  description: ['description', 'desc', 'details', 'content', 'notes'],
  priority: ['priority', 'pri', 'urgency', 'level'],
  type: ['type', 'category', 'ticket_type', 'kind'],
  assignee: ['assignee', 'assigned_to', 'owner', 'agent', 'assigned'],
  due_date: ['due_date', 'due', 'deadline', 'due_date_time', 'due_time'],
  status: ['status', 'state', 'ticket_status', 'current_status']
}

/**
 * Normalize column names to standard format
 */
function normalizeColumnName(columnName: string): string | null {
  if (!columnName || typeof columnName !== 'string') return null
  
  const normalized = columnName.toLowerCase().trim().replace(/[_\s-]/g, '_')
  
  for (const [standardName, variations] of Object.entries(COLUMN_MAPPING)) {
    if (variations.some(variation => 
      normalized.includes(variation) || 
      variation.includes(normalized) ||
      normalized === variation
    )) {
      return standardName
    }
  }
  
  return null
}

/**
 * Validate and normalize a single ticket row
 */
function validateTicketRow(row: any, rowIndex: number): { 
  ticket: ImportTicketData | null, 
  errors: string[] 
} {
  const errors: string[] = []
  const ticket: Partial<ImportTicketData> = {}

  // Required fields validation
  if (!row.title || typeof row.title !== 'string' || row.title.trim().length === 0) {
    errors.push(`Row ${rowIndex + 1}: Title is required and cannot be empty`)
  } else {
    ticket.title = row.title.trim()
  }

  // Optional description
  if (row.description && typeof row.description === 'string' && row.description.trim().length > 0) {
    ticket.description = row.description.trim()
  }

  // Priority validation
  if (!row.priority || typeof row.priority !== 'string') {
    errors.push(`Row ${rowIndex + 1}: Priority is required`)
  } else {
    const priority = row.priority.toLowerCase().trim()
    if (CONFIG.validPriorities.includes(priority)) {
      ticket.priority = priority as ImportTicketData['priority']
    } else {
      errors.push(`Row ${rowIndex + 1}: Invalid priority "${row.priority}". Must be one of: ${CONFIG.validPriorities.join(', ')}`)
    }
  }

  // Type validation
  if (!row.type || typeof row.type !== 'string') {
    errors.push(`Row ${rowIndex + 1}: Type is required`)
  } else {
    const type = row.type.toLowerCase().trim()
    // Map general_query to task for API compatibility
    const mappedType = type === 'general_query' ? 'task' : type
    if (CONFIG.validTypes.includes(type)) {
      ticket.type = mappedType as ImportTicketData['type']
    } else {
      errors.push(`Row ${rowIndex + 1}: Invalid type "${row.type}". Must be one of: ${CONFIG.validTypes.join(', ')}`)
    }
  }

  // Optional assignee
  if (row.assignee && typeof row.assignee === 'string' && row.assignee.trim().length > 0) {
    ticket.assignee = row.assignee.trim()
  }

  // Optional due date
  if (row.due_date && typeof row.due_date === 'string' && row.due_date.trim().length > 0) {
    const dateStr = row.due_date.trim()
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      errors.push(`Row ${rowIndex + 1}: Invalid due date format "${dateStr}". Use YYYY-MM-DD or MM/DD/YYYY`)
    } else {
      ticket.due_date = date.toISOString().split('T')[0] // Format as YYYY-MM-DD
    }
  }

  // Optional status
  if (row.status && typeof row.status === 'string' && row.status.trim().length > 0) {
    const status = row.status.toLowerCase().trim()
    if (CONFIG.validStatuses.includes(status)) {
      ticket.status = status as ImportTicketData['status']
    } else {
      errors.push(`Row ${rowIndex + 1}: Invalid status "${row.status}". Must be one of: ${CONFIG.validStatuses.join(', ')}`)
    }
  }

  if (errors.length > 0) {
    return { ticket: null, errors }
  }

  return { ticket: ticket as ImportTicketData, errors: [] }
}

/**
 * Parse CSV file
 */
export async function parseCSVFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const errors: string[] = []
    const tickets: ImportTicketData[] = []
    const parsingErrors: string[] = []
    const validationErrors: string[] = []

    console.log('📄 Parsing CSV file:', file.name, 'Size:', file.size)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log('📄 CSV parse complete:', results)
        const rows = results.data as any[]
        console.log('📄 Parsed rows:', rows.length, rows)
        
        if (rows.length === 0) {
          parsingErrors.push('CSV file is empty or contains no valid data')
          resolve({
            success: false,
            tickets: [],
            errors: parsingErrors,
            totalRows: 0,
            validRows: 0,
            successfullyImportedCount: 0,
            failedImportCount: 0,
            parsingErrors,
            validationErrors,
            importErrors: []
          })
          return
        }

        // Normalize column names
        const normalizedRows = rows.map(row => {
          const normalizedRow: any = {}
          for (const [key, value] of Object.entries(row)) {
            const normalizedKey = normalizeColumnName(key)
            if (normalizedKey) {
              normalizedRow[normalizedKey] = value
            }
          }
          return normalizedRow
        })

        console.log('📄 Normalized rows:', normalizedRows)

        // Validate each row
        normalizedRows.forEach((row, index) => {
          const { ticket, errors: rowErrors } = validateTicketRow(row, index)
          validationErrors.push(...rowErrors)
          if (ticket) {
            tickets.push(ticket)
          }
        })

        const allErrors = [...parsingErrors, ...validationErrors]

        resolve({
          success: allErrors.length === 0,
          tickets,
          errors: allErrors,
          totalRows: rows.length,
          validRows: tickets.length,
          successfullyImportedCount: 0, // Will be set during import
          failedImportCount: 0, // Will be set during import
          parsingErrors,
          validationErrors,
          importErrors: []
        })
      },
      error: (error) => {
        console.error('❌ CSV parsing error:', error)
        parsingErrors.push(`CSV parsing error: ${error.message}`)
        resolve({
          success: false,
          tickets: [],
          errors: parsingErrors,
          totalRows: 0,
          validRows: 0,
          successfullyImportedCount: 0,
          failedImportCount: 0,
          parsingErrors,
          validationErrors: [],
          importErrors: []
        })
      }
    })
  })
}

/**
 * Parse Excel file
 */
export async function parseExcelFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const errors: string[] = []
    const tickets: ImportTicketData[] = []
    const parsingErrors: string[] = []
    const validationErrors: string[] = []

    console.log('📊 Parsing Excel file:', file.name, 'Size:', file.size)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        console.log('📊 Excel file data loaded, size:', data.length)
        const workbook = XLSX.read(data, { type: 'array' })
        console.log('📊 Excel workbook parsed:', workbook.SheetNames)
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0]
        if (!firstSheetName) {
          parsingErrors.push('Excel file contains no worksheets')
          resolve({
            success: false,
            tickets: [],
            errors: parsingErrors,
            totalRows: 0,
            validRows: 0,
            successfullyImportedCount: 0,
            failedImportCount: 0,
            parsingErrors,
            validationErrors: [],
            importErrors: []
          })
          return
        }

        const worksheet = workbook.Sheets[firstSheetName]
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
        
        if (rows.length < 2) {
          parsingErrors.push('Excel file must contain at least a header row and one data row')
          resolve({
            success: false,
            tickets: [],
            errors: parsingErrors,
            totalRows: 0,
            validRows: 0,
            successfullyImportedCount: 0,
            failedImportCount: 0,
            parsingErrors,
            validationErrors: [],
            importErrors: []
          })
          return
        }

        // Get headers and normalize them
        const headers = rows[0] as string[]
        const normalizedHeaders = headers.map(header => normalizeColumnName(header))
        
        console.log('📊 Headers:', headers)
        console.log('📊 Normalized headers:', normalizedHeaders)
        
        // Convert rows to objects with normalized headers
        const dataRows = rows.slice(1).map(row => {
          const obj: any = {}
          row.forEach((cell, index) => {
            const normalizedHeader = normalizedHeaders[index]
            if (normalizedHeader && cell !== undefined && cell !== null && cell !== '') {
              obj[normalizedHeader] = cell
            }
          })
          return obj
        })

        console.log('📊 Data rows:', dataRows)

        // Validate each row
        dataRows.forEach((row, index) => {
          const { ticket, errors: rowErrors } = validateTicketRow(row, index)
          validationErrors.push(...rowErrors)
          if (ticket) {
            tickets.push(ticket)
          }
        })

        const allErrors = [...parsingErrors, ...validationErrors]

        resolve({
          success: allErrors.length === 0,
          tickets,
          errors: allErrors,
          totalRows: dataRows.length,
          validRows: tickets.length,
          successfullyImportedCount: 0, // Will be set during import
          failedImportCount: 0, // Will be set during import
          parsingErrors,
          validationErrors,
          importErrors: []
        })
      } catch (error) {
        console.error('❌ Excel parsing error:', error)
        parsingErrors.push(`Excel parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        resolve({
          success: false,
          tickets: [],
          errors: parsingErrors,
          totalRows: 0,
          validRows: 0,
          successfullyImportedCount: 0,
          failedImportCount: 0,
          parsingErrors,
          validationErrors: [],
          importErrors: []
        })
      }
    }

    reader.onerror = () => {
      parsingErrors.push('Failed to read Excel file')
      resolve({
        success: false,
        tickets: [],
        errors: parsingErrors,
        totalRows: 0,
        validRows: 0,
        successfullyImportedCount: 0,
        failedImportCount: 0,
        parsingErrors,
        validationErrors: [],
        importErrors: []
      })
    }

    reader.readAsArrayBuffer(file)
  })
}

/**
 * Parse file based on its type
 */
export async function parseImportFile(file: File): Promise<ImportResult> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  
  if (fileExtension === 'csv') {
    return parseCSVFile(file)
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    return parseExcelFile(file)
  } else {
    return {
      success: false,
      tickets: [],
      errors: [`Unsupported file format: ${fileExtension}. Supported formats: ${CONFIG.supportedExtensions.join(', ')}`],
      totalRows: 0,
      validRows: 0,
      successfullyImportedCount: 0,
      failedImportCount: 0,
      parsingErrors: [`Unsupported file format: ${fileExtension}`],
      validationErrors: [],
      importErrors: []
    }
  }
}

/**
 * Validate file before parsing
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > CONFIG.maxFileSize) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the ${CONFIG.maxFileSize / 1024 / 1024}MB limit`
    }
  }

  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  if (!fileExtension || !CONFIG.supportedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `Unsupported file format: ${fileExtension}. Supported formats: ${CONFIG.supportedExtensions.join(', ')}`
    }
  }

  return { valid: true }
}

/**
 * Get import requirements for display
 */
export function getImportRequirements() {
  return {
    requiredColumns: CONFIG.requiredColumns,
    optionalColumns: CONFIG.optionalColumns,
    validPriorities: CONFIG.validPriorities,
    validTypes: CONFIG.validTypes,
    validStatuses: CONFIG.validStatuses,
    maxFileSize: CONFIG.maxFileSize,
    supportedExtensions: CONFIG.supportedExtensions
  }
}