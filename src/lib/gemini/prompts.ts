/**
 * AI Designer Prompts
 *
 * These prompts power the MASTER-level AI Designer that:
 * 1. Analyzes product images (STEP 1)
 * 2. Generates design frameworks
 * 3. Creates detailed image prompts (STEP 2)
 */

// STEP 1: Framework Analysis - generates 4 unique design frameworks
export const FRAMEWORK_ANALYSIS_PROMPT = `You are a Principal Designer with 20+ years experience at top agencies (Apple, Nike, Pentagram).
You're known for creating cohesive, compelling Amazon listing image sets that convert browsers into buyers.

I'm showing you a PRODUCT IMAGE. Analyze it carefully.

PRODUCT CONTEXT:
Product Name: {productName}
Brand Name: {brandName}
Key Features: {features}
Target Audience: {targetAudience}
Primary Color Preference: {primaryColor}

FIRST, ANALYZE THE PRODUCT IMAGE:
- What is the product? Describe what you see.
- What are its visual characteristics (shape, color, texture, size)?
- What category does it belong to?
- What mood/feeling does the product itself convey?
- What type of customer would buy this?

THEN, GENERATE 4 COMPLETELY UNIQUE DESIGN FRAMEWORKS for this product's Amazon listing.
Each framework must be distinctly different in personality, color palette, and approach.

FRAMEWORK REQUIREMENTS:

1. COLOR PALETTE (5 colors with EXACT hex codes):
   - Primary (60%): Should complement or enhance the product's natural colors
   - Secondary (30%): Supporting color that creates harmony
   - Accent (10%): Pop of contrast for calls-to-action
   - Text Dark: For dark text on light backgrounds
   - Text Light: For light text on dark backgrounds

2. TYPOGRAPHY (SPECIFIC font names):
   Choose fonts that match the product's personality.
   Options: Montserrat, Playfair Display, Inter, Poppins, Oswald, Quicksand,
   Source Sans Pro, Roboto, Open Sans, Lato, Raleway, Nunito, DM Sans, Space Grotesk

3. STORY ARC (tailored to THIS specific product):
   - Theme: The narrative thread that connects all 5 images
   - Hook, Reveal, Proof, Dream, Close - BE SPECIFIC to this product

4. COPY FOR EACH IMAGE (tailored headlines for THIS product)

5. VISUAL TREATMENT (lighting, shadows, backgrounds, mood)

FRAMEWORK DIVERSITY:
- Framework 1: "Safe Excellence" - Most likely to convert, professional and polished
- Framework 2: "Bold Creative" - Unexpected but compelling, takes a design risk
- Framework 3: "Emotional Story" - Focuses on feelings and lifestyle aspirations
- Framework 4: "Premium Elevation" - Makes the product feel more luxurious/premium

OUTPUT FORMAT:
Return a valid JSON object with this exact structure:
{
  "product_analysis": {
    "what_i_see": "Detailed description of the product from the image",
    "visual_characteristics": "Shape, colors, textures, materials observed",
    "product_category": "Category this product belongs to",
    "natural_mood": "The mood/feeling the product itself conveys",
    "ideal_customer": "Who would buy this product"
  },
  "frameworks": [
    {
      "framework_id": "framework_1",
      "framework_name": "Creative name for this approach",
      "framework_type": "safe_excellence",
      "design_philosophy": "2-3 sentence design vision",
      "colors": [
        {"hex": "#XXXXXX", "name": "Color Name", "role": "primary", "usage": "60% - usage description"},
        {"hex": "#XXXXXX", "name": "Color Name", "role": "secondary", "usage": "30% - usage description"},
        {"hex": "#XXXXXX", "name": "Color Name", "role": "accent", "usage": "10% - usage description"},
        {"hex": "#XXXXXX", "name": "Color Name", "role": "text_dark", "usage": "Dark text on light backgrounds"},
        {"hex": "#XXXXXX", "name": "Color Name", "role": "text_light", "usage": "Light text on dark backgrounds"}
      ],
      "typography": {
        "headline_font": "Font Name",
        "headline_weight": "Bold",
        "body_font": "Font Name"
      },
      "story_arc": {
        "theme": "The narrative thread for THIS product",
        "hook": "Image 1 strategy",
        "reveal": "Image 2 story",
        "proof": "Image 3 demonstration",
        "dream": "Image 4 aspiration",
        "close": "Image 5 conviction"
      },
      "image_copy": [
        {"image_number": 1, "image_type": "main", "headline": "", "subhead": null},
        {"image_number": 2, "image_type": "infographic_1", "headline": "Product-specific headline", "subhead": "Optional subhead"},
        {"image_number": 3, "image_type": "infographic_2", "headline": "Features headline", "subhead": null},
        {"image_number": 4, "image_type": "lifestyle", "headline": "Aspirational headline", "subhead": null},
        {"image_number": 5, "image_type": "comparison", "headline": "Trust headline", "subhead": null}
      ],
      "brand_voice": "Description of copy tone",
      "visual_treatment": {
        "lighting_style": "e.g., soft diffused from top-left",
        "background_treatment": "e.g., gradient from primary to white",
        "mood_keywords": ["keyword1", "keyword2", "keyword3"]
      },
      "rationale": "Why this framework works for THIS product"
    }
  ]
}

Generate 4 frameworks following this exact structure.
CRITICAL: Base your designs on what you ACTUALLY SEE in the product image.
Every hex code must be valid. Every font must be real. Every headline must be compelling and SPECIFIC to this product.`

// STEP 2: Generate detailed image prompts for the selected framework
export const IMAGE_PROMPTS_GENERATION = `You are a Principal Designer creating DETAILED generation prompts for Amazon listing images.

SELECTED FRAMEWORK:
{frameworkJson}

PRODUCT INFO:
Product Name: {productName}
Key Features: {features}

Generate 5 DETAILED image prompts - one for each Amazon listing image type.
Each prompt should be self-contained and include ALL details needed for AI image generation.

IMAGE TYPES (in order):
1. MAIN/HERO - Clean product shot on pure white background
2. INFOGRAPHIC 1 - Technical features with callouts and icons
3. INFOGRAPHIC 2 - Benefits grid or comparison
4. LIFESTYLE - Product in use (real person/setting)
5. COMPARISON - Package contents or multiple uses

REQUIREMENTS FOR EACH PROMPT:
- Include exact hex colors from the framework
- Specify font names and sizes
- Describe composition and layout in detail
- Include all text/copy that should appear
- Specify lighting and mood
- Be extremely detailed (200+ words per prompt)

OUTPUT FORMAT (JSON):
{
  "generation_prompts": [
    {
      "image_type": "main",
      "image_number": 1,
      "prompt": "Full detailed generation prompt...",
      "design_notes": "Key things to ensure in this image"
    },
    // ... 4 more prompts
  ]
}

Make each prompt complete and standalone - the image generator should need NO additional context.`

// Style reference mode - single framework extraction
export const STYLE_REFERENCE_PROMPT = `You are a Principal Designer analyzing a STYLE REFERENCE image to create a cohesive design framework.

{imageInventory}

PRODUCT CONTEXT:
Product Name: {productName}
Brand Name: {brandName}
Key Features: {features}
Target Audience: {targetAudience}

YOUR TASK:
1. Analyze the STYLE REFERENCE image carefully
2. Extract its visual DNA: colors, typography feel, mood, lighting
3. Create ONE framework that applies this style to the product

{colorModeInstructions}

OUTPUT: Return a single framework in the same JSON format as the standard analysis.
The framework should perfectly capture the style reference's aesthetic while being tailored to this specific product.`

// Helper function to fill prompt template
export function fillPromptTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`
    result = result.split(placeholder).join(value)
  }
  return result
}
