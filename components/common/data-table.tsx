"use client"

import { type ReactNode, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Download, RefreshCw, ChevronUp, ChevronDown } from "lucide-react"
import { useSearchFilters } from "@/lib/hooks/use-search-filters"

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: any, item: T) => ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  title?: string
  description?: string
  searchFields: (keyof T)[]
  actions?: ReactNode
  onRowClick?: (item: T) => void
  loading?: boolean
  emptyMessage?: string
  showSearch?: boolean
  showFilters?: boolean
  pageSize?: number
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  description,
  searchFields,
  actions,
  onRowClick,
  loading = false,
  emptyMessage = "No data available",
  showSearch = true,
  showFilters = true,
  pageSize = 50,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)

  const { searchQuery, setSearchQuery, filteredData, sortBy, sortOrder, toggleSort, totalCount, filteredCount } =
    useSearchFilters({
      data,
      searchFields,
    })

  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = filteredData.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredCount / pageSize)

  const handleExport = () => {
    const csvContent = [
      columns.map((col) => col.label).join(","),
      ...filteredData.map((item) =>
        columns
          .map((col) => {
            const value = item[col.key]
            return typeof value === "string" ? `"${value}"` : value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title || "data"}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      {(title || description || actions) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {title && <CardTitle className="text-[16px]">{title}</CardTitle>}
              {description && <p className="text-[13px] text-muted-foreground mt-1">{description}</p>}
            </div>
            <div className="flex items-center gap-2">{actions}</div>
          </div>
        </CardHeader>
      )}

      <CardContent>
        {(showSearch || showFilters) && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {showSearch && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 text-[13px]"
                  />
                </div>
              )}

              <Badge variant="outline" className="text-[12px]">
                {filteredCount} of {totalCount} items
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} className="text-[13px] bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="text-[13px]">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`px-4 py-3 text-left text-[13px] font-medium ${
                      column.sortable ? "cursor-pointer hover:bg-muted" : ""
                    }`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && toggleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable &&
                        sortBy === column.key &&
                        (sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr
                    key={index}
                    className={`border-b hover:bg-muted/50 ${onRowClick ? "cursor-pointer" : ""}`}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((column) => (
                      <td key={String(column.key)} className="px-4 py-3 text-[13px]">
                        {column.render ? column.render(item[column.key], item) : String(item[column.key] || "")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-[13px] text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredCount)} of {filteredCount} results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="text-[13px]"
              >
                Previous
              </Button>
              <span className="text-[13px]">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="text-[13px]"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
