import { useState, useRef, useEffect } from 'react'
import { Upload, X, Loader2, FolderOpen } from 'lucide-react'
import { uploadImage } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ImageLibrary } from './ImageLibrary'

interface MultiImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  maxSizeMB?: number
}

export function MultiImageUpload({
  value,
  onChange,
  maxImages = 5,
  maxSizeMB = 10,
}: MultiImageUploadProps) {
  const bucket = 'babybets-assets'
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pasteAreaRef = useRef<HTMLDivElement>(null)

  const uploadFile = async (file: File): Promise<string | null> => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error(`${file.name}: Not an image file`)
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`${file.name}: File size exceeds ${maxSizeMB}MB`)
    }

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop() || 'png'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { url, error: uploadError } = await uploadImage(bucket, fileName, file)

      if (uploadError) {
        throw uploadError
      }

      return url || null
    } catch (err) {
      console.error('Error uploading image:', err)
      throw err
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const filesToUpload = Array.from(files).slice(0, maxImages - value.length)

    if (filesToUpload.length === 0) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    setError(null)
    setUploading(true)
    setUploadProgress(`Uploading 0/${filesToUpload.length}`)

    try {
      // Upload all files in parallel
      const uploadPromises = filesToUpload.map((file, index) =>
        uploadFile(file).then(url => {
          setUploadProgress(`Uploading ${index + 1}/${filesToUpload.length}`)
          return url
        }).catch(err => {
          console.error(`Failed to upload ${file.name}:`, err)
          return null
        })
      )

      const uploadedUrls = await Promise.all(uploadPromises)

      // Filter out failed uploads (null values)
      const successfulUrls = uploadedUrls.filter((url): url is string => url !== null)

      if (successfulUrls.length > 0) {
        onChange([...value, ...successfulUrls])
      }

      const failedCount = filesToUpload.length - successfulUrls.length
      if (failedCount > 0) {
        setError(`${failedCount} file(s) failed to upload. ${successfulUrls.length} uploaded successfully.`)
      }
    } catch (err) {
      console.error('Error during upload:', err)
      setError('Failed to upload images')
    } finally {
      setUploading(false)
      setUploadProgress('')
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handlePaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    const imageFiles: File[] = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault()
        const file = items[i].getAsFile()
        if (file && value.length + imageFiles.length < maxImages) {
          imageFiles.push(file)
        }
      }
    }

    if (imageFiles.length === 0) return

    setError(null)
    setUploading(true)
    setUploadProgress(`Uploading 0/${imageFiles.length}`)

    try {
      const uploadPromises = imageFiles.map((file, index) =>
        uploadFile(file).then(url => {
          setUploadProgress(`Uploading ${index + 1}/${imageFiles.length}`)
          return url
        }).catch(err => {
          console.error(`Failed to upload pasted image:`, err)
          return null
        })
      )

      const uploadedUrls = await Promise.all(uploadPromises)
      const successfulUrls = uploadedUrls.filter((url): url is string => url !== null)

      if (successfulUrls.length > 0) {
        onChange([...value, ...successfulUrls])
      }

      const failedCount = imageFiles.length - successfulUrls.length
      if (failedCount > 0) {
        setError(`${failedCount} image(s) failed to upload. ${successfulUrls.length} uploaded successfully.`)
      }
    } catch (err) {
      console.error('Error uploading pasted images:', err)
      setError('Failed to upload pasted images')
    } finally {
      setUploading(false)
      setUploadProgress('')
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
  }, [value.length, maxImages]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
    setError(null)
  }

  const handleLibrarySelect = (urls: string[]) => {
    const remainingSlots = maxImages - value.length
    const urlsToAdd = urls.slice(0, remainingSlots)
    onChange([...value, ...urlsToAdd])
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
                  {uploadProgress || 'Uploading...'}
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

        <Button
          type="button"
          variant="outline"
          onClick={() => setLibraryOpen(true)}
          disabled={uploading || value.length >= maxImages}
          className="cursor-pointer"
        >
          <FolderOpen className="size-4 mr-2" />
          Select from Library
        </Button>
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

      <ImageLibrary
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={handleLibrarySelect}
        multiSelect={true}
        maxSelect={maxImages - value.length}
      />
    </div>
  )
}
