import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateImagePrompts, DesignFramework } from '@/lib/gemini/service'

export const maxDuration = 30

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
      generationId,
      framework,
      productName,
      features,
      globalNote,
    } = body

    // Validate required fields
    if (!generationId || !framework || !productName) {
      return NextResponse.json(
        { error: 'Missing required fields: generationId, framework, productName' },
        { status: 400 }
      )
    }

    // Verify the generation belongs to this user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: generation, error: dbError } = await (supabase as any)
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single()

    if (dbError || !generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      )
    }

    // Generate image prompts using the selected framework
    const prompts = await generateImagePrompts({
      framework: framework as DesignFramework,
      productName,
      features,
      globalNote,
    })

    // Update the generation with selected framework and prompts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('generations')
      .update({
        selected_framework: framework,
        image_prompts: prompts,
        status: 'generating',
      })
      .eq('id', generationId)

    return NextResponse.json({
      success: true,
      generationId,
      prompts,
    })
  } catch (error) {
    console.error('Prompt generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Prompt generation failed' },
      { status: 500 }
    )
  }
}
