import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateImage } from '@/lib/gemini/service'

export const maxDuration = 120 // Allow up to 2 minutes for image generation

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

    // Check user has credits
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (!profile || profile.credits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      generationId,
      imageType,
      prompt,
      referenceImageBase64,
      referenceImageMimeType,
    } = body

    // Validate required fields
    if (!generationId || !imageType || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: generationId, imageType, prompt' },
        { status: 400 }
      )
    }

    // Verify the generation belongs to this user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: generation, error: genError } = await (supabase as any)
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single()

    if (genError || !generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      )
    }

    // Generate the image
    const result = await generateImage({
      prompt,
      referenceImageBase64,
      referenceImageMimeType,
      aspectRatio: '1:1',
    })

    // Save image to Supabase Storage
    const imageBuffer = Buffer.from(result.imageBase64, 'base64')
    const fileName = `${generationId}/${imageType}_v1.png`

    const { error: uploadError } = await supabase.storage
      .from('generated')
      .upload(fileName, imageBuffer, {
        contentType: result.mimeType || 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to save generated image' },
        { status: 500 }
      )
    }

    // Get signed URL for the image
    const { data: urlData } = await supabase.storage
      .from('generated')
      .createSignedUrl(fileName, 3600) // 1 hour expiry

    // Create generated_images record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: imageRecord, error: recordError } = await (supabase as any)
      .from('generated_images')
      .insert({
        generation_id: generationId,
        image_type: imageType,
        storage_path: fileName,
        prompt_used: prompt,
        version: 1,
      })
      .select()
      .single()

    if (recordError) {
      console.error('Database record error:', recordError)
    }

    // Deduct credit using the database function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: creditError } = await (supabase as any).rpc('deduct_credits', {
      user_id: user.id,
      amount: 1,
      description: `Generated ${imageType} image`,
    })

    if (creditError) {
      console.error('Credit deduction error:', creditError)
      // Don't fail the request, image was already generated
    }

    return NextResponse.json({
      success: true,
      imageId: imageRecord?.id,
      imageUrl: urlData?.signedUrl,
      imageType,
      storagePath: fileName,
      creditsUsed: 1,
    })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Image generation failed' },
      { status: 500 }
    )
  }
}
