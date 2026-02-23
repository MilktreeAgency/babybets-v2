import { useState, useRef, useEffect } from 'react'
import { Upload, X, Loader2, FolderOpen } from 'lucide-react'
import { uploadImage } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ImageLibrary } from './ImageLibrary'

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
}

export function ImageUpload({
  value,
  onChange,
}: ImageUploadProps) {
  const bucket = 'babybets-assets'
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pasteAreaRef = useRef<HTMLDivElement>(null)

  const uploadFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setError(null)
    setUploading(true)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop() || 'png'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { url, error: uploadError } = await uploadImage(bucket, fileName, file)

      if (uploadError) {
        throw uploadError
      }

      if (url) {
        onChange(url)
      }
    } catch (err) {
      console.error('Error uploading image:', err)
      setError('Failed to upload image')
    } finally {
      setUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
  }

  const handlePaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault()
        const file = items[i].getAsFile()
        if (file) {
          await uploadFile(file)
        }
        break
      }
    }
  }

  useEffect(() => {
    const pasteArea = pasteAreaRef.current
    const handlePasteWrapper = (e: Event) => handlePaste(e as ClipboardEvent)

    if (pasteArea) {
      pasteArea.addEventListener('paste', handlePasteWrapper)
    }

    // Also listen globally when component is focused
    const globalPasteHandler = (e: Event) => {
      const clipboardEvent = e as ClipboardEvent
      if (document.activeElement === pasteArea || pasteArea?.contains(document.activeElement)) {
        handlePaste(clipboardEvent)
      }
    }
    document.addEventListener('paste', globalPasteHandler)

    return () => {
      if (pasteArea) {
        pasteArea.removeEventListener('paste', handlePasteWrapper)
      }
      document.removeEventListener('paste', globalPasteHandler)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemove = () => {
    onChange(null)
    setError(null)
  }

  const handleLibrarySelect = (urls: string[]) => {
    if (urls.length > 0) {
      onChange(urls[0])
    }
  }

  return (
    <div ref={pasteAreaRef} className="space-y-3" tabIndex={0}>
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload">
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            className="cursor-pointer"
            asChild
          >
            <span>
              {uploading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="size-4 mr-2" />
                  Upload Image
                </>
              )}
            </span>
          </Button>
        </label>

        <Button
          type="button"
          variant="outline"
          onClick={() => setLibraryOpen(true)}
          disabled={uploading}
          className="cursor-pointer"
        >
          <FolderOpen className="size-4 mr-2" />
          Select from Library
        </Button>

        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={uploading}
            className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="size-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Prize preview"
            className="h-32 w-auto rounded-lg border border-gray-200 object-cover"
            onError={(e) => {
              e.currentTarget.src = ''
              e.currentTarget.style.display = 'none'
              setError('Failed to load image')
            }}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Recommended: PNG or JPG, max 5MB. You can also paste images (Ctrl+V / Cmd+V)
      </p>

      <ImageLibrary
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={handleLibrarySelect}
        multiSelect={false}
        maxSelect={1}
      />
    </div>
  )
}
