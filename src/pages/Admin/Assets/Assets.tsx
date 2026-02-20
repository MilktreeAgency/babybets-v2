import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { DashboardHeader } from '../components'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Upload,
  Trash2,
  Copy,
  Image as ImageIcon,
  RefreshCw,
  X,
  Check
} from 'lucide-react'
import {
  checkFileUsage,
  getPublicUrl,
  formatFileSize
} from '@/services/assetManager.service'

interface StorageFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: Record<string, unknown> | null
}

const BUCKET_NAME = 'babybets-assets'

export default function Assets() {
  const [files, setFiles] = useState<StorageFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  // Load all files from the bucket
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) throw error

      // Filter out folders (only show files)
      const actualFiles = (data || []).filter(item => item.id !== null && item.metadata !== null)
      setFiles(actualFiles)
    } catch (error) {
      console.error('Error loading files:', error)
      toast.error('Failed to load files')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  // Handle file upload
  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    try {
      setUploading(true)

      for (const file of uploadFiles) {
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, file)

        if (error) throw error
      }

      toast.success(`${uploadFiles.length} file(s) uploaded successfully`)
      setUploadDialogOpen(false)
      setUploadFiles([])

      // Reload files
      loadFiles()
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  // Handle file deletion
  const handleDelete = async () => {
    if (!selectedFile) return

    try {
      setDeleting(true)

      // Check if file is in use
      const fileUrl = getPublicUrl(BUCKET_NAME, selectedFile.name)
      const usage = await checkFileUsage(fileUrl)

      if (usage.inUse) {
        // Build detailed error message
        const usageDetails = usage.usages
          .map(u => `${u.table} (${u.count})`)
          .join(', ')

        toast.error(
          `Cannot delete: File is in use`,
          {
            description: `Found ${usage.totalCount} reference${usage.totalCount > 1 ? 's' : ''} in: ${usageDetails}`,
            duration: 5000,
          }
        )
        setDeleteDialogOpen(false)
        setSelectedFile(null)
        return
      }

      // Delete the file
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([selectedFile.name])

      if (error) throw error

      // Remove the file from local state
      setFiles(prevFiles => prevFiles.filter(f => f.id !== selectedFile.id))

      toast.success('File deleted successfully')
      setDeleteDialogOpen(false)
      setSelectedFile(null)
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Failed to delete file')
    } finally {
      setDeleting(false)
    }
  }

  // Handle copy URL
  const handleCopyUrl = async (file: StorageFile) => {
    const url = getPublicUrl(BUCKET_NAME, file.name)
    await navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    toast.success('URL copied to clipboard')

    setTimeout(() => {
      setCopiedUrl(null)
    }, 2000)
  }

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    const imageFiles = droppedFiles.filter(file => file.type.startsWith('image/'))

    if (imageFiles.length > 0) {
      setUploadFiles(imageFiles)
      setUploadDialogOpen(true)
    } else {
      toast.error('Please drop image files only')
    }
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Assets' }
        ]}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Asset Manager</h1>
              <p className="text-muted-foreground mt-1">
                Manage all assets in one place
              </p>
            </div>
            <button
              onClick={() => setUploadDialogOpen(true)}
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-admin-info-fg text-white rounded-lg hover:bg-admin-info-text transition-colors"
            >
              <Upload className="size-4" />
              Upload Files
            </button>
          </div>

          {/* Files Grid */}
          <div
            className={`bg-admin-card-bg border rounded-lg p-6 min-h-[500px] ${
              dragActive ? 'border-admin-info-fg border-2 bg-admin-info-bg' : 'border-border'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {files.length} file{files.length !== 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={loadFiles}
                disabled={loading}
                className="cursor-pointer inline-flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No files</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Drag and drop files here or click the Upload button to add files
                </p>
                <button
                  onClick={() => setUploadDialogOpen(true)}
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-admin-info-fg text-white rounded-lg hover:bg-admin-info-text transition-colors"
                >
                  <Upload className="size-4" />
                  Upload Files
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {files.map((file) => {
                  const fileUrl = getPublicUrl(BUCKET_NAME, file.name)
                  const isCopied = copiedUrl === fileUrl

                  return (
                    <div
                      key={file.id}
                      className="group relative bg-muted/30 rounded-lg overflow-hidden"
                    >
                      {/* Image Preview */}
                      <div
                        className="cursor-pointer aspect-square bg-muted/50 flex items-center justify-center overflow-hidden"
                        onClick={() => {
                          setSelectedFile(file)
                          setPreviewDialogOpen(true)
                        }}
                      >
                        <img
                          src={fileUrl}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* File Info */}
                      <div className="p-2.5">
                        <p className="text-xs font-medium truncate text-foreground/80" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {file.metadata && typeof file.metadata.size === 'number' ? formatFileSize(file.metadata.size) : 'Unknown'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopyUrl(file)
                          }}
                          className="cursor-pointer h-6 w-6 flex items-center justify-center rounded bg-background/95 backdrop-blur-sm"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-admin-success-fg" />
                          ) : (
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedFile(file)
                            setDeleteDialogOpen(true)
                          }}
                          className="cursor-pointer h-6 w-6 flex items-center justify-center rounded bg-background/95 backdrop-blur-sm"
                        >
                          <Trash2 className="w-3 h-3 text-admin-error-text" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Select image files to upload
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload" className="cursor-pointer">Select Files</Label>
              <Input
                id="file-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = e.target.files
                  if (files) {
                    setUploadFiles(Array.from(files))
                  }
                }}
                className="cursor-pointer"
              />
            </div>

            {uploadFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected files ({uploadFiles.length}):</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {uploadFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-muted px-3 py-2 rounded">
                      <span className="truncate flex-1">{file.name}</span>
                      <button
                        onClick={() => setUploadFiles(prev => prev.filter((_, i) => i !== index))}
                        className="cursor-pointer ml-2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false)
                setUploadFiles([])
              }}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || uploadFiles.length === 0}
              className="cursor-pointer"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedFile?.name}</DialogTitle>
            <DialogDescription>
              {selectedFile && selectedFile.metadata && typeof selectedFile.metadata.size === 'number' && formatFileSize(selectedFile.metadata.size)}
              {selectedFile && (!selectedFile.metadata || typeof selectedFile.metadata.size !== 'number') && 'Unknown size'} • Created{' '}
              {selectedFile && new Date(selectedFile.created_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {selectedFile && (
            <div className="flex items-center justify-center bg-muted rounded-lg p-4">
              <img
                src={getPublicUrl(BUCKET_NAME, selectedFile.name)}
                alt={selectedFile.name}
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewDialogOpen(false)}
              className="cursor-pointer"
            >
              Close
            </Button>
            <Button
              onClick={() => selectedFile && handleCopyUrl(selectedFile)}
              className="cursor-pointer"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy URL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedFile?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="cursor-pointer bg-admin-error-text hover:bg-admin-error-text/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
