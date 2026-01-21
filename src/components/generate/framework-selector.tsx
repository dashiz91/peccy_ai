'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface DesignFramework {
  framework_name: string
  design_philosophy: string
  visual_direction: {
    primary_style: string
    mood: string
    color_approach: string
  }
  color_palette: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  typography_guidance: {
    headline_style: string
    body_style: string
  }
  image_composition: {
    main_image: string
    infographic_style: string
    lifestyle_approach: string
  }
  unique_selling_proposition: string
  preview_image_base64?: string
}

interface FrameworkSelectorProps {
  frameworks: DesignFramework[]
  selectedIndex: number | null
  onSelect: (index: number) => void
  isLoading?: boolean
  className?: string
}

export function FrameworkSelector({
  frameworks,
  selectedIndex,
  onSelect,
  isLoading = false,
  className,
}: FrameworkSelectorProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-lg text-gray-600">AI is analyzing your product and creating frameworks...</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">This may take 30-60 seconds</p>
        </div>
      </div>
    )
  }

  if (frameworks.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Choose Your Design Framework</h3>
        <p className="text-sm text-gray-500">
          Select the style that best represents your brand and product
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {frameworks.map((framework, index) => (
          <Card
            key={index}
            onClick={() => onSelect(index)}
            className={cn(
              'cursor-pointer transition-all hover:shadow-lg',
              selectedIndex === index
                ? 'ring-2 ring-violet-600 shadow-lg'
                : 'hover:ring-1 hover:ring-gray-300'
            )}
          >
            {/* Preview Image */}
            {framework.preview_image_base64 && (
              <div className="aspect-video relative overflow-hidden rounded-t-lg">
                <img
                  src={`data:image/png;base64,${framework.preview_image_base64}`}
                  alt={framework.framework_name}
                  className="w-full h-full object-cover"
                />
                {selectedIndex === index && (
                  <div className="absolute inset-0 bg-violet-600/10 flex items-center justify-center">
                    <div className="bg-violet-600 text-white px-4 py-2 rounded-full flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Selected
                    </div>
                  </div>
                )}
              </div>
            )}

            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-lg">
                {framework.framework_name}
                <Badge variant="outline" className="text-xs">
                  {framework.visual_direction.mood}
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Design Philosophy */}
              <p className="text-sm text-gray-600 line-clamp-2">{framework.design_philosophy}</p>

              {/* Color Palette */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Colors:</span>
                <div className="flex gap-1">
                  {Object.entries(framework.color_palette).map(([key, color]) => (
                    <div
                      key={key}
                      className="w-6 h-6 rounded-full border border-gray-200"
                      style={{ backgroundColor: color }}
                      title={`${key}: ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Visual Style */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  {framework.visual_direction.primary_style}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {framework.typography_guidance.headline_style}
                </Badge>
              </div>

              {/* USP */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">Unique Selling Point:</p>
                <p className="text-sm font-medium text-gray-900 line-clamp-1">
                  {framework.unique_selling_proposition}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
