import { useState, useRef, useEffect } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { uploadImage } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

interface MultiImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  maxSizeMB?: number
  bucket?: string
  folder?: string
}

export function MultiImageUpload({
  value,
  onChange,
  maxImages = 5,
  maxSizeMB = 10,
  bucket = 'competition-images',
  folder = 'competitions',
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pasteAreaRef = useRef<HTMLDivElement>(null)

  const uploadFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image must be less than ${maxSizeMB}MB`)
      return
    }

    // Check max images limit
    if (value.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    setError(null)
    setUploading(true)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop() || 'png'
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { url, error: uploadError } = await uploadImage(bucket, fileName, file)

      if (uploadError) {
        throw uploadError
      }

      if (url) {
        onChange([...value, url])
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
    const files = e.target.files
    if (!files) return

    // Upload multiple files
    for (let i = 0; i < Math.min(files.length, maxImages - value.length); i++) {
      await uploadFile(files[i])
    }
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
  }, [value.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
    setError(null)
  }

  return (
    <div ref={pasteAreaRef} className="space-y-3" tabIndex={0}>
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={uploading || value.length >= maxImages}
          className="hidden"
          id="multi-image-upload"
        />
        <label htmlFor="multi-image-upload">
          <Button
            type="button"
            variant="outline"
            disabled={uploading || value.length >= maxImages}
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
                  Upload Images ({value.length}/{maxImages})
                </>
              )}
            </span>
          </Button>
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {value.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Competition image ${index + 1}`}
                className="h-32 w-full rounded-lg border border-gray-200 object-cover"
                onError={(e) => {
                  e.currentTarget.src = ''
                  e.currentTarget.style.display = 'none'
                  setError('Failed to load image')
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(index)}
                disabled={uploading}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-600 hover:text-red-700 size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X className="size-4" />
              </Button>
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Maximum {maxImages} images, {maxSizeMB}MB each. PNG or JPG. You can also paste images (Ctrl+V / Cmd+V)
      </p>
    </div>
  )
}
