'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

export interface GeneratedImage {
  id: string
  imageType: string
  imageUrl: string | null
  storagePath: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  prompt?: string
  error?: string
}

interface ImageGalleryProps {
  images: GeneratedImage[]
  onRegenerate?: (imageType: string, note?: string) => void
  onEdit?: (imageType: string, editInstructions: string) => void
  onDownload?: (image: GeneratedImage) => void
  isGenerating?: boolean
  className?: string
}

const IMAGE_TYPE_LABELS: Record<string, string> = {
  main: 'Main / Hero',
  infographic_1: 'Infographic 1',
  infographic_2: 'Infographic 2',
  lifestyle: 'Lifestyle',
  comparison: 'Comparison',
}

const IMAGE_TYPE_DESCRIPTIONS: Record<string, string> = {
  main: 'Clean product shot on white background',
  infographic_1: 'Technical features with callouts',
  infographic_2: 'Benefits grid with icons',
  lifestyle: 'Product in use with real person',
  comparison: 'Multiple uses or package contents',
}

export function ImageGallery({
  images,
  onRegenerate,
  onEdit,
  onDownload,
  isGenerating = false,
  className,
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)
  const [regenerateNote, setRegenerateNote] = useState('')
  const [editInstructions, setEditInstructions] = useState('')
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [actionImageType, setActionImageType] = useState<string | null>(null)

  const handleRegenerate = () => {
    if (actionImageType && onRegenerate) {
      onRegenerate(actionImageType, regenerateNote || undefined)
      setShowRegenerateDialog(false)
      setRegenerateNote('')
      setActionImageType(null)
    }
  }

  const handleEdit = () => {
    if (actionImageType && editInstructions && onEdit) {
      onEdit(actionImageType, editInstructions)
      setShowEditDialog(false)
      setEditInstructions('')
      setActionImageType(null)
    }
  }

  const openRegenerateDialog = (imageType: string) => {
    setActionImageType(imageType)
    setShowRegenerateDialog(true)
  }

  const openEditDialog = (imageType: string) => {
    setActionImageType(imageType)
    setShowEditDialog(true)
  }

  const downloadImage = async (image: GeneratedImage) => {
    if (!image.imageUrl) return

    try {
      const response = await fetch(image.imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${image.imageType}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  // Sort images by type order
  const sortedImages = [...images].sort((a, b) => {
    const order = ['main', 'infographic_1', 'infographic_2', 'lifestyle', 'comparison']
    return order.indexOf(a.imageType) - order.indexOf(b.imageType)
  })

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedImages.map((image) => (
          <div
            key={image.id || image.imageType}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            {/* Image Preview */}
            <div className="aspect-square relative bg-gray-50">
              {image.status === 'completed' && image.imageUrl ? (
                <img
                  src={image.imageUrl}
                  alt={IMAGE_TYPE_LABELS[image.imageType]}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage(image)}
                />
              ) : image.status === 'generating' || (isGenerating && image.status === 'pending') ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-500">Generating...</span>
                </div>
              ) : image.status === 'failed' ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center p-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="text-sm text-red-600">Generation failed</span>
                  {image.error && (
                    <span className="text-xs text-gray-500">{image.error}</span>
                  )}
                </div>
              ) : (
                <Skeleton className="w-full h-full" />
              )}
            </div>

            {/* Image Info & Actions */}
            <div className="p-4 space-y-3">
              <div>
                <h4 className="font-medium text-gray-900">
                  {IMAGE_TYPE_LABELS[image.imageType] || image.imageType}
                </h4>
                <p className="text-xs text-gray-500">
                  {IMAGE_TYPE_DESCRIPTIONS[image.imageType]}
                </p>
              </div>

              {/* Action Buttons */}
              {image.status === 'completed' && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadImage(image)}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </Button>
                  {onRegenerate && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRegenerateDialog(image.imageType)}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regenerate
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(image.imageType)}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Button>
                  )}
                </div>
              )}

              {(image.status === 'failed' || image.status === 'pending') && onRegenerate && (
                <Button
                  size="sm"
                  onClick={() => openRegenerateDialog(image.imageType)}
                >
                  {image.status === 'failed' ? 'Retry' : 'Generate'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle>{IMAGE_TYPE_LABELS[selectedImage.imageType]}</DialogTitle>
              </DialogHeader>
              <div className="aspect-square relative">
                <img
                  src={selectedImage.imageUrl!}
                  alt={IMAGE_TYPE_LABELS[selectedImage.imageType]}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => downloadImage(selectedImage)}>
                  Download
                </Button>
                {onRegenerate && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedImage(null)
                      openRegenerateDialog(selectedImage.imageType)
                    }}
                  >
                    Regenerate
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Regenerate Dialog */}
      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Add optional notes to guide the regeneration, or leave blank to generate a new variation.
            </p>
            <Textarea
              placeholder="e.g., Make it more vibrant, add more contrast, try a different angle..."
              value={regenerateNote}
              onChange={(e) => setRegenerateNote(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRegenerateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRegenerate}>
                Regenerate (1 Credit)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Describe the changes you want to make. The AI will edit the image while preserving its overall layout.
            </p>
            <Textarea
              placeholder="e.g., Change the headline to 'Premium Quality', make the background lighter, remove the icon..."
              value={editInstructions}
              onChange={(e) => setEditInstructions(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={!editInstructions.trim()}>
                Apply Edit (1 Credit)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
