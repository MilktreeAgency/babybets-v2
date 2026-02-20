import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Image as ImageIcon, Check, Search, Loader2 } from 'lucide-react'
import { getPublicUrl, formatFileSize } from '@/services/assetManager.service'

interface StorageFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  metadata: Record<string, unknown> | null
}

interface ImageLibraryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (urls: string[]) => void
  multiSelect?: boolean
  maxSelect?: number
}

const BUCKET_NAME = 'babybets-assets'

export function ImageLibrary({
  open,
  onOpenChange,
  onSelect,
  multiSelect = false,
  maxSelect = 1,
}: ImageLibraryProps) {
  const [files, setFiles] = useState<StorageFile[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Load files from bucket
  const loadFiles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) throw error

      const actualFiles = (data || []).filter(item => item.id !== null && item.metadata !== null)
      setFiles(actualFiles)
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadFiles()
      setSelectedUrls([])
      setSearchTerm('')
    }
  }, [open])

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (file: StorageFile) => {
    const url = getPublicUrl(BUCKET_NAME, file.name)

    if (multiSelect) {
      setSelectedUrls(prev => {
        const isSelected = prev.includes(url)
        if (isSelected) {
          return prev.filter(u => u !== url)
        } else if (prev.length < maxSelect) {
          return [...prev, url]
        }
        return prev
      })
    } else {
      setSelectedUrls([url])
    }
  }

  const handleConfirm = () => {
    onSelect(selectedUrls)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Image Library</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {multiSelect
              ? `Select up to ${maxSelect} image${maxSelect > 1 ? 's' : ''}`
              : 'Select an image to use'}
          </p>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Image Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Loading images...</p>
                </div>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ImageIcon className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-base mb-1">
                  {searchTerm ? 'No images found' : 'No images yet'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {searchTerm
                    ? 'Try a different search term'
                    : 'Upload images to see them here'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {filteredFiles.length} image{filteredFiles.length !== 1 ? 's' : ''}
                  {searchTerm && ' matching your search'}
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {filteredFiles.map((file) => {
                    const url = getPublicUrl(BUCKET_NAME, file.name)
                    const isSelected = selectedUrls.includes(url)

                    return (
                      <div
                        key={file.id}
                        onClick={() => handleSelect(file)}
                        className="cursor-pointer group relative rounded-lg overflow-hidden transition-all"
                      >
                        <div className="aspect-square bg-background flex items-center justify-center overflow-hidden">
                          <img
                            src={url}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-xs text-white truncate" title={file.name}>
                            {file.name}
                          </p>
                          {file.metadata && typeof file.metadata.size === 'number' && (
                            <p className="text-xs text-white/60">
                              {formatFileSize(file.metadata.size)}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedUrls.length > 0 ? (
              <span className="font-medium text-foreground">
                {selectedUrls.length} selected
              </span>
            ) : (
              <span>No images selected</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedUrls.length === 0}
              className="cursor-pointer"
            >
              Use Selected {selectedUrls.length > 0 && `(${selectedUrls.length})`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
