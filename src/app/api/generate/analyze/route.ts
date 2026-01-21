import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeProductAndGenerateFrameworks } from '@/lib/gemini/service'

export const maxDuration = 60 // Allow up to 60 seconds for AI processing

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      productImageBase64,
      productImageMimeType,
      productName,
      brandName,
      features,
      targetAudience,
      primaryColor,
      additionalImages,
      styleReference,
      lockedColors,
    } = body

    // Validate required fields
    if (!productImageBase64 || !productImageMimeType || !productName) {
      return NextResponse.json(
        { error: 'Missing required fields: productImageBase64, productImageMimeType, productName' },
        { status: 400 }
      )
    }

    // Call Gemini to analyze and generate frameworks
    const result = await analyzeProductAndGenerateFrameworks({
      productImageBase64,
      productImageMimeType,
      productName,
      brandName,
      features,
      targetAudience,
      primaryColor,
      additionalImages,
      styleReference,
      lockedColors,
    })

    // Create a generation record in the database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: generation, error: dbError } = await (supabase as any)
      .from('generations')
      .insert({
        user_id: user.id,
        product_title: productName,
        product_description: features?.join(', ') || '',
        status: 'analyzing',
        framework_data: result,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save generation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      generationId: generation.id,
      productAnalysis: result.product_analysis,
      frameworks: result.frameworks,
    })
  } catch (error) {
    console.error('Framework analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Framework analysis failed' },
      { status: 500 }
    )
  }
}
