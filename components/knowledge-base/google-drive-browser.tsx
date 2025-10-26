"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { createFrontendClient } from "@pipedream/sdk/browser"
import {
  Folder,
  File,
  ChevronRight,
  Loader2,
  FolderOpen,
  CheckCircle2,
  Home,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

interface DriveFile {
  id: string
  name: string
  mimeType: string
  webViewLink?: string
  size?: string
  modifiedTime?: string
}

interface DriveFolder {
  id: string
  name: string
  mimeType: string
}

interface BreadcrumbItem {
  id: string | null
  name: string
}

interface GoogleDriveBrowserProps {
  onFilesSelected: (files: DriveFile[]) => void
  onConnect?: (accountId: string) => void
}

export function GoogleDriveBrowser({ onFilesSelected, onConnect }: GoogleDriveBrowserProps) {
  const [userId] = useState(() => {
    // Use a consistent userId - in production, get from auth context
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("temp_user_id")
      if (!id) {
        id = `user-${Date.now()}`
        localStorage.setItem("temp_user_id", id)
      }
      return id
    }
    return `user-${Date.now()}`
  })

  const [accountId, setAccountId] = useState<string | null>(null)
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: "My Drive" }])
  const [isRestoring, setIsRestoring] = useState(true)

  // Initialize Pipedream frontend client
  const pd = useMemo(() => {
    return createFrontendClient({
      externalUserId: userId,
      tokenCallback: async () => {
        const response = await fetch("/api/google-drive/token", {
          method: "POST",
        })
        const data = await response.json()
        return {
          token: data.token,
          expiresAt: data.expires_at,
          connectLinkUrl: data.connectLinkUrl,
        }
      },
    })
  }, [userId])

  // Restore connection from localStorage on mount
  useEffect(() => {
    const savedConnection = localStorage.getItem(`google_drive_connection_${userId}`)
    if (savedConnection) {
      try {
        const { accountId: savedAccountId } = JSON.parse(savedConnection)
        setAccountId(savedAccountId)
        fetchFiles(savedAccountId, null)
        if (onConnect) {
          onConnect(savedAccountId)
        }
      } catch (err) {
        console.error("Failed to restore connection:", err)
        localStorage.removeItem(`google_drive_connection_${userId}`)
      }
    }
    setIsRestoring(false)
  }, [userId])

  // Connect Google Drive account
  const connectGoogleDrive = async () => {
    setLoading(true)

    try {
      await pd.connectAccount({
        app: "google_drive",
        onSuccess: async (data: any) => {
          setAccountId(data.id)

          localStorage.setItem(
            `google_drive_connection_${userId}`,
            JSON.stringify({
              accountId: data.id,
              connectedAt: new Date().toISOString(),
            })
          )

          await fetchFiles(data.id, null)
          toast.success("Google Drive connected successfully")
          
          if (onConnect) {
            onConnect(data.id)
          }
        },
        onError: (err: any) => {
          console.error("Connection failed:", err)
          toast.error("Failed to connect Google Drive")
        },
      })
    } catch (err) {
      toast.error("Connection failed")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch files from Google Drive
  const fetchFiles = async (accId: string, folderId: string | null) => {
    setLoading(true)

    try {
      const response = await fetch("/api/google-drive/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: accId, folderId, pageSize: 20 }),
      })

      if (!response.ok) throw new Error("Failed to fetch files")

      const data = await response.json()
      setFiles(data.files || [])
      setFolders(data.folders || [])
      setCurrentFolder(folderId)
    } catch (err) {
      toast.error("Failed to fetch files")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Navigate to folder
  const navigateToFolder = (folder: DriveFolder) => {
    if (!accountId) return

    setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }])
    fetchFiles(accountId, folder.id)
  }

  // Navigate using breadcrumbs
  const navigateToBreadcrumb = (index: number) => {
    if (!accountId) return

    const newBreadcrumbs = breadcrumbs.slice(0, index + 1)
    const targetFolder = newBreadcrumbs[newBreadcrumbs.length - 1]

    setBreadcrumbs(newBreadcrumbs)
    fetchFiles(accountId, targetFolder.id)
  }

  // Toggle file selection
  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId)
    } else {
      newSelected.add(fileId)
    }
    setSelectedFiles(newSelected)
  }

  // Handle file ingestion
  const handleIngest = useCallback(() => {
    const selected = files.filter((f) => selectedFiles.has(f.id))
    if (selected.length === 0) {
      toast.error("Please select at least one file")
      return
    }
    onFilesSelected(selected)
  }, [files, selectedFiles, onFilesSelected])

  // Disconnect account
  const disconnectAccount = () => {
    localStorage.removeItem(`google_drive_connection_${userId}`)
    setAccountId(null)
    setFiles([])
    setFolders([])
    setSelectedFiles(new Set())
    setBreadcrumbs([{ id: null, name: "My Drive" }])
    setCurrentFolder(null)
  }

  // Get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("folder")) return <Folder className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  // Check if file is supported for knowledge base
  const isSupportedFile = (mimeType: string) => {
    const supported = [
      "application/vnd.google-apps.document",
      "application/vnd.google-apps.spreadsheet",
      "application/vnd.google-apps.presentation",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/pdf",
      "text/plain",
      "text/markdown",
      "text/html",
    ]
    return supported.some((type) => mimeType.includes(type))
  }

  if (isRestoring) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Restoring connection...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <img
                src="https://www.google.com/drive/static/images/drive/logo-drive.png"
                alt="Google Drive"
                className="h-6 w-6"
              />
              Google Drive
            </CardTitle>
            <CardDescription>
              {accountId
                ? "Browse and select files to import into knowledge base"
                : "Connect your Google Drive to import documents"}
            </CardDescription>
          </div>
          {accountId && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchFiles(accountId, currentFolder)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={disconnectAccount}>
                Disconnect
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connect Button */}
        {!accountId && (
          <Button onClick={connectGoogleDrive} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <img
                  src="https://www.google.com/drive/static/images/drive/logo-drive.png"
                  alt="Google Drive"
                  className="h-4 w-4 mr-2"
                />
                Connect Google Drive
              </>
            )}
          </Button>
        )}

        {/* File Browser */}
        {accountId && (
          <>
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.id || "root"} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="h-4 w-4" />}
                  <button
                    onClick={() => navigateToBreadcrumb(index)}
                    className="hover:text-foreground flex items-center gap-1"
                  >
                    {index === 0 ? <Home className="h-4 w-4" /> : null}
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>

            {/* Folders */}
            {folders.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Folders</p>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => navigateToFolder(folder)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <FolderOpen className="h-5 w-5 text-blue-500" />
                    <span className="flex-1 truncate">{folder.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {/* Files */}
            {files.length > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Files</p>
                  <Badge variant="outline">
                    {selectedFiles.size} selected
                  </Badge>
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-1 pr-4">
                    {files.map((file) => {
                      const supported = isSupportedFile(file.mimeType)
                      return (
                        <div
                          key={file.id}
                          className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                            supported
                              ? "hover:bg-accent cursor-pointer"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                          onClick={() => supported && toggleFileSelection(file.id)}
                        >
                          <Checkbox
                            checked={selectedFiles.has(file.id)}
                            disabled={!supported}
                            onCheckedChange={() => toggleFileSelection(file.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          {getFileIcon(file.mimeType)}
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {file.mimeType.split("/").pop()}
                            </p>
                          </div>
                          {!supported && (
                            <Badge variant="secondary" className="text-xs">
                              Not supported
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            ) : !loading && folders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No files found in this folder</p>
              </div>
            ) : null}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Ingest Button */}
            {selectedFiles.size > 0 && (
              <Button onClick={handleIngest} className="w-full">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Ingest {selectedFiles.size} File{selectedFiles.size > 1 ? "s" : ""}
              </Button>
            )}

            {/* Supported Formats */}
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
              <p className="font-medium">Supported formats:</p>
              <p>Google Docs/Sheets/Slides (exported as PDF), Word (.docx), PDF, Text (.txt), Markdown (.md), HTML</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
