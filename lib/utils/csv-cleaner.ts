/**
 * CSV Cleaning Utility
 * Handles malformed CSV files with embedded line breaks and other issues
 */

export interface CleanCSVResult {
  success: boolean
  cleanedContent: string
  errors: string[]
  rowCount: number
}

/**
 * Clean a CSV file content by fixing common formatting issues
 */
export function cleanCSVContent(content: string): CleanCSVResult {
  const errors: string[] = []
  
  try {
    // Split into lines while preserving quoted content
    const lines = []
    let currentLine = ''
    let inQuotes = false
    let quoteCount = 0
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i]
      const nextChar = content[i + 1]
      
      if (char === '"') {
        quoteCount++
        inQuotes = !inQuotes
      }
      
      if (char === '\n' || char === '\r') {
        if (!inQuotes) {
          // End of line - add current line if it has content
          if (currentLine.trim()) {
            lines.push(currentLine.trim())
          }
          currentLine = ''
          
          // Skip \r\n combination
          if (char === '\r' && nextChar === '\n') {
            i++ // Skip the next \n
          }
        } else {
          // Inside quotes - replace with space
          currentLine += ' '
        }
      } else {
        currentLine += char
      }
    }
    
    // Add the last line if there's content
    if (currentLine.trim()) {
      lines.push(currentLine.trim())
    }
    
    if (lines.length === 0) {
      errors.push('No valid lines found in CSV content')
      return {
        success: false,
        cleanedContent: '',
        errors,
        rowCount: 0
      }
    }
    
    // Get headers from first line
    const headers = parseCSVLine(lines[0])
    if (headers.length === 0) {
      errors.push('No valid headers found in CSV')
      return {
        success: false,
        cleanedContent: '',
        errors,
        rowCount: 0
      }
    }
    
    console.log('🧹 CSV headers found:', headers)
    
    // Clean and reconstruct the CSV
    const cleanedLines = [headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',')]
    
    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue
      
      const fields = parseCSVLine(line)
      if (fields.length > 0) {
        // Pad with empty strings if needed
        while (fields.length < headers.length) {
          fields.push('')
        }
        
        // Clean and quote fields
        const cleanedFields = fields.slice(0, headers.length).map(field => {
          const cleaned = field.replace(/"/g, '""').trim()
          return `"${cleaned}"`
        })
        
        cleanedLines.push(cleanedFields.join(','))
      }
    }
    
    const cleanedContent = cleanedLines.join('\n')
    
    console.log('🧹 CSV cleaned successfully:', {
      originalLines: lines.length,
      cleanedRows: cleanedLines.length - 1, // Exclude header
      headers
    })
    
    return {
      success: true,
      cleanedContent,
      errors,
      rowCount: cleanedLines.length - 1 // Exclude header
    }
  } catch (error) {
    errors.push(`CSV cleaning error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return {
      success: false,
      cleanedContent: '',
      errors,
      rowCount: 0
    }
  }
}

/**
 * Parse a single CSV line, handling quoted fields properly
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let currentField = ''
  let inQuotes = false
  let i = 0
  
  while (i < line.length) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"'
        i += 2
        continue
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      fields.push(currentField.trim())
      currentField = ''
    } else {
      currentField += char
    }
    
    i++
  }
  
  // Add the last field
  fields.push(currentField.trim())
  
  return fields
}

/**
 * Detect and clean common CSV format issues
 */
export function preprocessCSVFile(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const cleanResult = cleanCSVContent(content)
        
        if (!cleanResult.success) {
          reject(new Error(`CSV cleaning failed: ${cleanResult.errors.join(', ')}`))
          return
        }
        
        // Create a new file with cleaned content
        const cleanedBlob = new Blob([cleanResult.cleanedContent], { type: 'text/csv' })
        const cleanedFile = new File([cleanedBlob], `cleaned_${file.name}`, { type: 'text/csv' })
        
        resolve(cleanedFile)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}