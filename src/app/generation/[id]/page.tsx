'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ImageGallery, type GeneratedImage } from '@/components/generate/image-gallery'

interface Generation {
  id: string
  product_title: string
  product_description: string | null
  brand_name: string | null
  target_audience: string | null
  status: 'pending' | 'analyzing' | 'generating' | 'completed' | 'failed'
  selected_framework: Record<string, unknown> | null
  credits_used: number
  created_at: string
  updated_at: string
}

interface DBImage {
  id: string
  image_type: string
  storage_path: string
  prompt_used: string | null
  version: number
  created_at: string
}

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  analyzing: 'bg-blue-100 text-blue-800',
  generating: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

export default function GenerationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const generationId = params.id as string

  const [generation, setGeneration] = useState<Generation | null>(null)
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState<string | null>(null)

  // Fetch generation data
  useEffect(() => {
    async function fetchGeneration() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Fetch generation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: gen, error: genError } = await (supabase as any)
        .from('generations')
        .select('*')
        .eq('id', generationId)
        .eq('user_id', user.id)
        .single()

      if (genError || !gen) {
        toast.error('Generation not found')
        router.push('/history')
        return
      }

      setGeneration(gen)

      // Fetch images
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: dbImages } = await (supabase as any)
        .from('generated_images')
        .select('*')
        .eq('generation_id', generationId)
        .order('created_at', { ascending: true })

      if (dbImages && dbImages.length > 0) {
        // Get signed URLs for each image
        const imagesWithUrls: GeneratedImage[] = await Promise.all(
          dbImages.map(async (img: DBImage) => {
            const { data: urlData } = await supabase.storage
              .from('generated')
              .createSignedUrl(img.storage_path, 3600)

            return {
              id: img.id,
              imageType: img.image_type,
              imageUrl: urlData?.signedUrl || null,
              storagePath: img.storage_path,
              status: 'completed' as const,
              prompt: img.prompt_used || undefined,
            }
          })
        )
        setImages(imagesWithUrls)
      }

      setLoading(false)
    }

    fetchGeneration()
  }, [generationId, router])

  // Handle regeneration
  const handleRegenerate = useCallback(
    async (imageType: string, note?: string) => {
      if (!generation) return

      setRegenerating(imageType)

      // Update UI to show generating state
      setImages((prev) =>
        prev.map((img) =>
          img.imageType === imageType ? { ...img, status: 'generating' as const } : img
        )
      )

      try {
        // Get the image's prompt
        const existingImage = images.find((img) => img.imageType === imageType)
        let prompt = existingImage?.prompt || ''
        if (note) {
          prompt = `${prompt}\n\nAdditional instructions: ${note}`
        }

        // Get product image for reference
        const supabase = createClient()

        const response = await fetch('/api/generate/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            generationId: generation.id,
            imageType,
            prompt,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Regeneration failed')
        }

        // Get new signed URL
        const { data: urlData } = await supabase.storage
          .from('generated')
          .createSignedUrl(data.storagePath, 3600)

        setImages((prev) =>
          prev.map((img) =>
            img.imageType === imageType
              ? {
                  ...img,
                  id: data.imageId,
                  imageUrl: `${urlData?.signedUrl}&t=${Date.now()}`,
                  storagePath: data.storagePath,
                  status: 'completed' as const,
                }
              : img
          )
        )

        toast.success('Image regenerated successfully')
      } catch (error) {
        console.error('Regeneration error:', error)
        toast.error(error instanceof Error ? error.message : 'Regeneration failed')

        setImages((prev) =>
          prev.map((img) =>
            img.imageType === imageType ? { ...img, status: 'failed' as const } : img
          )
        )
      } finally {
        setRegenerating(null)
      }
    },
    [generation, images]
  )

  const handleEdit = useCallback((imageType: string, editInstructions: string) => {
    toast.info('Edit functionality coming soon!')
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!generation) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/history')}>
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to History
            </Button>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{generation.product_title}</h1>
              <p className="text-gray-600 mt-1">
                Created{' '}
                {new Date(generation.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <Badge className={statusColors[generation.status]}>{generation.status}</Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Product Info */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generation.brand_name && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Brand</dt>
                  <dd className="mt-1 text-gray-900">{generation.brand_name}</dd>
                </div>
              )}
              {generation.target_audience && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Target Audience</dt>
                  <dd className="mt-1 text-gray-900">{generation.target_audience}</dd>
                </div>
              )}
              {generation.product_description && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-gray-900">{generation.product_description}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Credits Used</dt>
                <dd className="mt-1 text-gray-900">{generation.credits_used}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Selected Framework */}
        {generation.selected_framework && (
          <Card>
            <CardHeader>
              <CardTitle>Design Framework</CardTitle>
              <CardDescription>The style guide used for generating images</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <h3 className="font-medium text-lg">{(generation.selected_framework as any).framework_name}</h3>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <p className="text-gray-600">{(generation.selected_framework as any).design_philosophy}</p>

                {/* Color Palette */}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(generation.selected_framework as any).color_palette && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Colors:</span>
                    <div className="flex gap-1">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {Object.entries((generation.selected_framework as any).color_palette).map(
                        ([key, color]) => (
                          <div
                            key={key}
                            className="w-6 h-6 rounded-full border border-gray-200"
                            style={{ backgroundColor: color as string }}
                            title={`${key}: ${color}`}
                          />
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Images */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Images</CardTitle>
            <CardDescription>
              {images.length} images generated. Click to view larger or download.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {images.length > 0 ? (
              <ImageGallery
                images={images}
                onRegenerate={handleRegenerate}
                onEdit={handleEdit}
                isGenerating={!!regenerating}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                No images generated yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push('/history')}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to History
          </Button>
          <Link href="/generate">
            <Button>
              Start New Generation
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
