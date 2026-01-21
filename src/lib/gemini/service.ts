/**
 * Gemini AI Service
 *
 * Handles:
 * - Framework analysis (vision)
 * - Image prompt generation
 * - Image generation
 */

import { getGeminiClient, MODELS, SAFETY_SETTINGS } from './client'
import {
  FRAMEWORK_ANALYSIS_PROMPT,
  IMAGE_PROMPTS_GENERATION,
  STYLE_REFERENCE_PROMPT,
  fillPromptTemplate,
} from './prompts'

export interface DesignFramework {
  framework_id: string
  framework_name: string
  framework_type: string
  design_philosophy: string
  colors: Array<{
    hex: string
    name: string
    role: string
    usage: string
  }>
  typography: {
    headline_font: string
    headline_weight: string
    body_font: string
  }
  story_arc: {
    theme: string
    hook: string
    reveal: string
    proof: string
    dream: string
    close: string
  }
  image_copy: Array<{
    image_number: number
    image_type: string
    headline: string
    subhead: string | null
  }>
  brand_voice: string
  visual_treatment: {
    lighting_style: string
    background_treatment: string
    mood_keywords: string[]
  }
  rationale: string
}

export interface FrameworkAnalysisResult {
  product_analysis: {
    what_i_see: string
    visual_characteristics: string
    product_category: string
    natural_mood: string
    ideal_customer: string
  }
  frameworks: DesignFramework[]
}

export interface ImagePrompt {
  image_type: string
  image_number: number
  prompt: string
  design_notes: string
}

/**
 * Analyze product images and generate design frameworks
 */
export async function analyzeProductAndGenerateFrameworks(params: {
  productImageBase64: string
  productImageMimeType: string
  productName: string
  brandName?: string
  features?: string[]
  targetAudience?: string
  primaryColor?: string
  additionalImages?: Array<{ base64: string; mimeType: string }>
  styleReference?: { base64: string; mimeType: string }
  lockedColors?: string[]
}): Promise<FrameworkAnalysisResult> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({
    model: MODELS.VISION,
    safetySettings: SAFETY_SETTINGS,
  })

  // Build the prompt
  const hasStyleReference = !!params.styleReference

  let prompt: string
  if (hasStyleReference) {
    // Build image inventory
    let imageCount = 1 + (params.additionalImages?.length || 0) + 1 // primary + additional + style ref
    let imageInventory = `=== IMAGE INVENTORY ===\nI'm showing you ${imageCount} image(s):\n`
    imageInventory += `- Image 1: PRIMARY PRODUCT IMAGE\n`

    if (params.additionalImages) {
      params.additionalImages.forEach((_, i) => {
        imageInventory += `- Image ${i + 2}: ADDITIONAL PRODUCT IMAGE\n`
      })
    }

    const styleRefIndex = imageCount
    imageInventory += `- Image ${styleRefIndex}: STYLE REFERENCE IMAGE - the EXACT visual style to follow\n`

    // Build color mode instructions
    let colorModeInstructions: string
    if (params.lockedColors && params.lockedColors.length > 0) {
      colorModeInstructions = `LOCKED PALETTE MODE: Use EXACTLY these colors: ${params.lockedColors.join(', ')}`
    } else {
      colorModeInstructions = `EXTRACT COLORS: Study the style reference and extract its color palette.`
    }

    prompt = fillPromptTemplate(STYLE_REFERENCE_PROMPT, {
      imageInventory,
      productName: params.productName,
      brandName: params.brandName || 'Not specified',
      features: params.features?.join(', ') || 'Not specified',
      targetAudience: params.targetAudience || 'General consumers',
      colorModeInstructions,
    })
  } else {
    prompt = fillPromptTemplate(FRAMEWORK_ANALYSIS_PROMPT, {
      productName: params.productName,
      brandName: params.brandName || 'Not specified',
      features: params.features?.join(', ') || 'Not specified',
      targetAudience: params.targetAudience || 'General consumers',
      primaryColor: params.primaryColor || 'AI to determine based on product image',
    })
  }

  // Build content parts
  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
    { text: prompt },
    {
      inlineData: {
        data: params.productImageBase64,
        mimeType: params.productImageMimeType,
      },
    },
  ]

  // Add additional product images
  if (params.additionalImages) {
    for (const img of params.additionalImages) {
      parts.push({
        inlineData: {
          data: img.base64,
          mimeType: img.mimeType,
        },
      })
    }
  }

  // Add style reference image last
  if (params.styleReference) {
    parts.push({
      inlineData: {
        data: params.styleReference.base64,
        mimeType: params.styleReference.mimeType,
      },
    })
  }

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 8000,
    },
  })

  const response = result.response
  const text = response.text()

  // Parse JSON from response
  const jsonStart = text.indexOf('{')
  const jsonEnd = text.lastIndexOf('}') + 1

  if (jsonStart === -1 || jsonEnd <= jsonStart) {
    throw new Error('No valid JSON found in AI response')
  }

  const jsonStr = text.slice(jsonStart, jsonEnd)
  const data = JSON.parse(jsonStr) as FrameworkAnalysisResult

  if (!data.frameworks || data.frameworks.length === 0) {
    throw new Error('AI response contains no frameworks')
  }

  return data
}

/**
 * Generate detailed image prompts for a selected framework
 */
export async function generateImagePrompts(params: {
  framework: DesignFramework
  productName: string
  features?: string[]
  globalNote?: string
}): Promise<ImagePrompt[]> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({
    model: MODELS.TEXT,
    safetySettings: SAFETY_SETTINGS,
  })

  let prompt = fillPromptTemplate(IMAGE_PROMPTS_GENERATION, {
    frameworkJson: JSON.stringify(params.framework, null, 2),
    productName: params.productName,
    features: params.features?.join(', ') || 'Not specified',
  })

  // Add global note if provided
  if (params.globalNote) {
    prompt += `\n\nUSER'S ADDITIONAL INSTRUCTIONS (apply to ALL images):\n${params.globalNote}`
  }

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8000,
    },
  })

  const response = result.response
  const text = response.text()

  // Parse JSON
  const jsonStart = text.indexOf('{')
  const jsonEnd = text.lastIndexOf('}') + 1

  if (jsonStart === -1 || jsonEnd <= jsonStart) {
    throw new Error('No valid JSON found in prompts response')
  }

  const jsonStr = text.slice(jsonStart, jsonEnd)
  const data = JSON.parse(jsonStr)

  if (!data.generation_prompts || !Array.isArray(data.generation_prompts)) {
    throw new Error('AI response missing generation_prompts array')
  }

  return data.generation_prompts as ImagePrompt[]
}

/**
 * Generate an image using Gemini (using Imagen under the hood)
 *
 * Note: Gemini's image generation is accessed differently.
 * For production, you'd use the Imagen API directly.
 * This is a placeholder showing the intended flow.
 */
export async function generateImage(params: {
  prompt: string
  referenceImageBase64?: string
  referenceImageMimeType?: string
  aspectRatio?: '1:1' | '16:9' | '4:3' | '9:16'
}): Promise<{ imageBase64: string; mimeType: string }> {
  // For actual image generation, you would use the Imagen API
  // or the google.genai image generation endpoint
  // This is a simplified version showing the interface

  const client = getGeminiClient()

  // For image generation, we'll use the experimental image model
  // Note: The actual implementation depends on your Gemini API access level
  const model = client.getGenerativeModel({
    model: 'gemini-2.0-flash-exp', // or imagen-3.0-generate-001
  })

  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
    { text: params.prompt },
  ]

  // Add reference image if provided
  if (params.referenceImageBase64 && params.referenceImageMimeType) {
    parts.push({
      inlineData: {
        data: params.referenceImageBase64,
        mimeType: params.referenceImageMimeType,
      },
    })
  }

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
  })

  const response = result.response

  // Check for image in response
  const candidates = response.candidates
  if (!candidates || candidates.length === 0) {
    throw new Error('No response candidates from image generation')
  }

  const content = candidates[0].content
  if (!content || !content.parts) {
    throw new Error('No content in image generation response')
  }

  // Look for inline data (image)
  for (const part of content.parts) {
    if ('inlineData' in part && part.inlineData) {
      return {
        imageBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType,
      }
    }
  }

  throw new Error('No image data in generation response')
}

/**
 * Health check for Gemini API
 */
export async function healthCheck(): Promise<{
  status: 'ok' | 'error'
  message: string
}> {
  try {
    const client = getGeminiClient()
    const model = client.getGenerativeModel({ model: MODELS.TEXT })

    const result = await model.generateContent('Say "OK" if you can read this.')
    const text = result.response.text()

    if (text.toLowerCase().includes('ok')) {
      return { status: 'ok', message: 'Gemini API is working' }
    }

    return { status: 'ok', message: 'Gemini API connected but unexpected response' }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
