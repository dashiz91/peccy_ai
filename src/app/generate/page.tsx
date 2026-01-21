'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ImageUploader, type UploadedImage } from '@/components/generate/image-uploader'
import { FrameworkSelector, type DesignFramework } from '@/components/generate/framework-selector'
import { ImageGallery, type GeneratedImage } from '@/components/generate/image-gallery'

type WizardStep = 'upload' | 'details' | 'frameworks' | 'generate' | 'results'

interface ProductDetails {
  productName: string
  brandName: string
  features: string
  targetAudience: string
  globalNote: string
}

interface ProductAnalysis {
  product_category: string
  detected_features: string[]
  suggested_positioning: string
  target_audience_insights: string
}

const STEPS: { id: WizardStep; label: string; description: string }[] = [
  { id: 'upload', label: 'Upload', description: 'Add product images' },
  { id: 'details', label: 'Details', description: 'Product information' },
  { id: 'frameworks', label: 'Style', description: 'Choose design framework' },
  { id: 'generate', label: 'Generate', description: 'Create listing images' },
  { id: 'results', label: 'Results', description: 'View & download' },
]

const IMAGE_TYPES = ['main', 'infographic_1', 'infographic_2', 'lifestyle', 'comparison']

export default function GeneratePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload')
  const [isLoading, setIsLoading] = useState(false)

  // Step 1: Upload
  const [productImages, setProductImages] = useState<UploadedImage[]>([])
  const [styleReference, setStyleReference] = useState<UploadedImage[]>([])
  const [lockedColors, setLockedColors] = useState<string[]>([])
  const [colorInput, setColorInput] = useState('')

  // Step 2: Details
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    productName: '',
    brandName: '',
    features: '',
    targetAudience: '',
    globalNote: '',
  })

  // Step 3: Frameworks
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [productAnalysis, setProductAnalysis] = useState<ProductAnalysis | null>(null)
  const [frameworks, setFrameworks] = useState<DesignFramework[]>([])
  const [selectedFrameworkIndex, setSelectedFrameworkIndex] = useState<number | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Step 4 & 5: Generation & Results
  const [imagePrompts, setImagePrompts] = useState<Record<string, string>>({})
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)
  const progressPercent = ((currentStepIndex + 1) / STEPS.length) * 100

  // Color management
  const addColor = useCallback(() => {
    const color = colorInput.trim()
    if (color && /^#[0-9A-Fa-f]{6}$/.test(color) && !lockedColors.includes(color)) {
      setLockedColors([...lockedColors, color])
      setColorInput('')
    } else if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      toast.error('Please enter a valid hex color (e.g., #FF5500)')
    }
  }, [colorInput, lockedColors])

  const removeColor = useCallback((color: string) => {
    setLockedColors(lockedColors.filter((c) => c !== color))
  }, [lockedColors])

  // Step 1 -> Step 2
  const handleUploadComplete = () => {
    if (productImages.length === 0) {
      toast.error('Please upload at least one product image')
      return
    }
    setCurrentStep('details')
  }

  // Step 2 -> Step 3: Analyze and generate frameworks
  const handleDetailsComplete = async () => {
    if (!productDetails.productName.trim()) {
      toast.error('Please enter a product name')
      return
    }

    setIsAnalyzing(true)
    setCurrentStep('frameworks')

    try {
      const response = await fetch('/api/generate/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productImageBase64: productImages[0].base64,
          productImageMimeType: productImages[0].mimeType,
          productName: productDetails.productName,
          brandName: productDetails.brandName,
          features: productDetails.features.split('\n').filter(Boolean),
          targetAudience: productDetails.targetAudience,
          additionalImages: productImages.slice(1).map((img) => ({
            base64: img.base64,
            mimeType: img.mimeType,
          })),
          styleReference: styleReference[0]
            ? {
                base64: styleReference[0].base64,
                mimeType: styleReference[0].mimeType,
              }
            : undefined,
          lockedColors: lockedColors.length > 0 ? lockedColors : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Framework analysis failed')
      }

      setGenerationId(data.generationId)
      setProductAnalysis(data.productAnalysis)
      setFrameworks(data.frameworks)
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error(error instanceof Error ? error.message : 'Framework analysis failed')
      setCurrentStep('details')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Step 3 -> Step 4: Generate prompts and start image generation
  const handleFrameworkSelect = async () => {
    if (selectedFrameworkIndex === null || !generationId) {
      toast.error('Please select a framework')
      return
    }

    setIsLoading(true)
    setCurrentStep('generate')

    // Initialize pending images
    const pendingImages: GeneratedImage[] = IMAGE_TYPES.map((type) => ({
      id: type,
      imageType: type,
      imageUrl: null,
      storagePath: '',
      status: 'pending',
    }))
    setGeneratedImages(pendingImages)

    try {
      // First, generate prompts
      const promptsResponse = await fetch('/api/generate/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationId,
          framework: frameworks[selectedFrameworkIndex],
          productName: productDetails.productName,
          features: productDetails.features.split('\n').filter(Boolean),
          globalNote: productDetails.globalNote || undefined,
        }),
      })

      const promptsData = await promptsResponse.json()

      if (!promptsResponse.ok) {
        throw new Error(promptsData.error || 'Prompt generation failed')
      }

      setImagePrompts(promptsData.prompts)

      // Now generate images one by one
      setIsGenerating(true)

      for (const imageType of IMAGE_TYPES) {
        // Update status to generating
        setGeneratedImages((prev) =>
          prev.map((img) =>
            img.imageType === imageType ? { ...img, status: 'generating' } : img
          )
        )

        try {
          const imageResponse = await fetch('/api/generate/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              generationId,
              imageType,
              prompt: promptsData.prompts[imageType],
              referenceImageBase64: productImages[0].base64,
              referenceImageMimeType: productImages[0].mimeType,
            }),
          })

          const imageData = await imageResponse.json()

          if (!imageResponse.ok) {
            throw new Error(imageData.error || 'Image generation failed')
          }

          // Update with completed image
          setGeneratedImages((prev) =>
            prev.map((img) =>
              img.imageType === imageType
                ? {
                    ...img,
                    id: imageData.imageId,
                    imageUrl: imageData.imageUrl,
                    storagePath: imageData.storagePath,
                    status: 'completed',
                    prompt: promptsData.prompts[imageType],
                  }
                : img
            )
          )
        } catch (error) {
          console.error(`Error generating ${imageType}:`, error)
          setGeneratedImages((prev) =>
            prev.map((img) =>
              img.imageType === imageType
                ? {
                    ...img,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Generation failed',
                  }
                : img
            )
          )
        }
      }

      setCurrentStep('results')
    } catch (error) {
      console.error('Generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Generation failed')
    } finally {
      setIsLoading(false)
      setIsGenerating(false)
    }
  }

  // Regenerate a single image
  const handleRegenerate = async (imageType: string, note?: string) => {
    if (!generationId) return

    // Update status to generating
    setGeneratedImages((prev) =>
      prev.map((img) =>
        img.imageType === imageType ? { ...img, status: 'generating' } : img
      )
    )

    try {
      // Get existing prompt and enhance with note
      let prompt = imagePrompts[imageType]
      if (note) {
        prompt = `${prompt}\n\nAdditional instructions: ${note}`
      }

      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationId,
          imageType,
          prompt,
          referenceImageBase64: productImages[0].base64,
          referenceImageMimeType: productImages[0].mimeType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Regeneration failed')
      }

      setGeneratedImages((prev) =>
        prev.map((img) =>
          img.imageType === imageType
            ? {
                ...img,
                id: data.imageId,
                imageUrl: `${data.imageUrl}&t=${Date.now()}`, // Cache bust
                storagePath: data.storagePath,
                status: 'completed',
              }
            : img
        )
      )

      toast.success('Image regenerated successfully')
    } catch (error) {
      console.error('Regeneration error:', error)
      toast.error(error instanceof Error ? error.message : 'Regeneration failed')
      setGeneratedImages((prev) =>
        prev.map((img) =>
          img.imageType === imageType ? { ...img, status: 'failed' } : img
        )
      )
    }
  }

  // Edit a single image
  const handleEdit = async (imageType: string, editInstructions: string) => {
    toast.info('Edit functionality coming soon!')
    // TODO: Implement edit API when available
  }

  const goBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-200" />
              <h1 className="text-xl font-semibold text-gray-900">New Generation</h1>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center flex-1 ${
                    index < STEPS.length - 1 ? 'relative' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index <= currentStepIndex
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="text-xs mt-1 text-gray-600 hidden sm:block">{step.label}</span>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`absolute top-4 left-1/2 w-full h-0.5 ${
                        index < currentStepIndex ? 'bg-violet-600' : 'bg-gray-200'
                      }`}
                      style={{ transform: 'translateX(50%)' }}
                    />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progressPercent} className="h-1" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Step 1: Upload */}
        {currentStep === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Product Images</CardTitle>
              <CardDescription>
                Upload clear photos of your product. The first image will be used as the primary reference.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <ImageUploader
                images={productImages}
                onImagesChange={setProductImages}
                maxImages={5}
                label="Product Images"
                description="Upload up to 5 product images. First image is primary."
              />

              <div className="border-t pt-6">
                <ImageUploader
                  images={styleReference}
                  onImagesChange={setStyleReference}
                  maxImages={1}
                  label="Style Reference (Optional)"
                  description="Upload a style reference image for the AI to match"
                />
              </div>

              <div className="border-t pt-6">
                <Label>Locked Colors (Optional)</Label>
                <p className="text-sm text-gray-500 mb-3">
                  Add specific hex colors to use across all designs
                </p>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="#FF5500"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addColor()}
                    className="max-w-xs"
                  />
                  <Button type="button" variant="outline" onClick={addColor}>
                    Add Color
                  </Button>
                </div>
                {lockedColors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {lockedColors.map((color) => (
                      <div
                        key={color}
                        className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1"
                      >
                        <div
                          className="w-5 h-5 rounded-full border border-gray-300"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm">{color}</span>
                        <button
                          type="button"
                          onClick={() => removeColor(color)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleUploadComplete} disabled={productImages.length === 0}>
                  Continue
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Details */}
        {currentStep === 'details' && (
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>
                Tell us about your product to help the AI create better listing images.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    placeholder="e.g., Premium Wireless Earbuds"
                    value={productDetails.productName}
                    onChange={(e) =>
                      setProductDetails({ ...productDetails, productName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brandName">Brand Name</Label>
                  <Input
                    id="brandName"
                    placeholder="e.g., AudioMax"
                    value={productDetails.brandName}
                    onChange={(e) =>
                      setProductDetails({ ...productDetails, brandName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Key Features (one per line)</Label>
                <Textarea
                  id="features"
                  placeholder="40-hour battery life&#10;Active noise cancellation&#10;IPX7 water resistance&#10;Bluetooth 5.3"
                  rows={5}
                  value={productDetails.features}
                  onChange={(e) =>
                    setProductDetails({ ...productDetails, features: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  placeholder="e.g., Music enthusiasts, commuters, athletes"
                  value={productDetails.targetAudience}
                  onChange={(e) =>
                    setProductDetails({ ...productDetails, targetAudience: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="globalNote">Global Instructions (Optional)</Label>
                <Textarea
                  id="globalNote"
                  placeholder="e.g., Make it feel premium and luxurious, emphasize the modern design"
                  rows={3}
                  value={productDetails.globalNote}
                  onChange={(e) =>
                    setProductDetails({ ...productDetails, globalNote: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500">
                  These instructions will be applied to all generated images.
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={goBack}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </Button>
                <Button
                  onClick={handleDetailsComplete}
                  disabled={!productDetails.productName.trim() || isLoading}
                >
                  {isLoading ? 'Analyzing...' : 'Generate Frameworks'}
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Framework Selection */}
        {currentStep === 'frameworks' && (
          <Card>
            <CardHeader>
              <CardTitle>Select Design Framework</CardTitle>
              <CardDescription>
                The AI has analyzed your product and created {frameworks.length} unique design frameworks.
                {productAnalysis && (
                  <span className="block mt-2 text-gray-600">
                    Category: <strong>{productAnalysis.product_category}</strong>
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FrameworkSelector
                frameworks={frameworks}
                selectedIndex={selectedFrameworkIndex}
                onSelect={setSelectedFrameworkIndex}
                isLoading={isAnalyzing}
              />

              {!isAnalyzing && frameworks.length > 0 && (
                <div className="flex justify-between">
                  <Button variant="outline" onClick={goBack}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                  </Button>
                  <Button
                    onClick={handleFrameworkSelect}
                    disabled={selectedFrameworkIndex === null || isLoading}
                  >
                    Generate Images (5 Credits)
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Generating */}
        {currentStep === 'generate' && (
          <Card>
            <CardHeader>
              <CardTitle>Generating Your Listing Images</CardTitle>
              <CardDescription>
                The AI is creating 5 professional listing images for your product.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageGallery
                images={generatedImages}
                isGenerating={isGenerating}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 5: Results */}
        {currentStep === 'results' && (
          <Card>
            <CardHeader>
              <CardTitle>Your Listing Images</CardTitle>
              <CardDescription>
                Your images are ready! Download them or regenerate any that need adjustments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ImageGallery
                images={generatedImages}
                onRegenerate={handleRegenerate}
                onEdit={handleEdit}
              />

              <div className="flex justify-between pt-6 border-t">
                <Button variant="outline" onClick={() => router.push('/dashboard')}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Back to Dashboard
                </Button>
                <Button
                  onClick={() => {
                    setCurrentStep('upload')
                    setProductImages([])
                    setStyleReference([])
                    setLockedColors([])
                    setProductDetails({
                      productName: '',
                      brandName: '',
                      features: '',
                      targetAudience: '',
                      globalNote: '',
                    })
                    setGenerationId(null)
                    setProductAnalysis(null)
                    setFrameworks([])
                    setSelectedFrameworkIndex(null)
                    setImagePrompts({})
                    setGeneratedImages([])
                  }}
                >
                  Start New Generation
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
