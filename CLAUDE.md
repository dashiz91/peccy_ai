# Peccy AI

AI-powered Amazon listing image generator built with Next.js 14 and Supabase.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **AI**: Google Gemini (vision + image generation)
- **Payments**: Stripe (credits system)
- **UI**: shadcn/ui + Tailwind CSS
- **Validation**: Zod

## Project Structure

```
peccy_ai/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth pages (login, signup)
│   │   ├── dashboard/          # Main dashboard
│   │   ├── generate/           # Generation wizard
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   └── dashboard/          # Dashboard-specific components
│   ├── lib/
│   │   ├── supabase/           # Supabase client utilities
│   │   └── gemini/             # Gemini AI utilities
│   └── types/
│       └── database.ts         # Supabase type definitions
├── supabase/
│   └── schema.sql              # Database schema
└── .env.local                  # Environment variables
```

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Gemini AI
GEMINI_API_KEY=xxx

# Stripe
STRIPE_SECRET_KEY=xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=xxx
STRIPE_WEBHOOK_SECRET=xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Schema

### Tables
- `profiles` - User profiles (extends auth.users)
- `generations` - Generation sessions
- `generated_images` - Individual generated images
- `credit_transactions` - Credit purchase/usage history

### Key Features
- Row Level Security (RLS) for all tables
- Auto-create profile on signup via trigger
- Atomic credit deduction function
- Credits start at 10 for new users

## Getting Started

1. **Run the schema in Supabase SQL Editor:**
   ```
   supabase/schema.sql
   ```

2. **Create storage buckets in Supabase Dashboard:**
   - `uploads` - User-uploaded product images
   - `generated` - AI-generated images
   - `style-references` - Style reference images

3. **Enable Google OAuth in Supabase (optional):**
   - Go to Authentication > Providers > Google
   - Add your Google OAuth credentials

4. **Start development:**
   ```bash
   npm run dev
   ```

## Credits System

| Action | Credits |
|--------|---------|
| Framework analysis | 0 (free) |
| Generate 1 image | 1 |
| Full set (5 images) | 5 |
| Regenerate | 1 |
| Edit | 1 |

## API Routes

### Generation Flow
```
POST /api/generate/analyze    # Step 1: Analyze product, generate frameworks
POST /api/generate/prompts    # Step 2: Generate detailed image prompts
POST /api/generate/image      # Step 3: Generate single image
```

### Flow
1. User uploads product images
2. `POST /api/generate/analyze` → Returns 4 design frameworks
3. User selects a framework
4. `POST /api/generate/prompts` → Returns 5 detailed image prompts
5. `POST /api/generate/image` (x5) → Generates each listing image

## Key Files

### Supabase
- `src/lib/supabase/client.ts` - Browser Supabase client
- `src/lib/supabase/server.ts` - Server Supabase client
- `src/lib/supabase/storage.ts` - Storage utilities
- `src/middleware.ts` - Auth middleware (protects routes)
- `src/types/database.ts` - TypeScript types for Supabase
- `supabase/schema.sql` - Full database schema with RLS
- `supabase/storage-policies.sql` - Storage bucket policies

### Gemini AI
- `src/lib/gemini/client.ts` - Gemini client initialization
- `src/lib/gemini/prompts.ts` - AI Designer prompts
- `src/lib/gemini/service.ts` - Framework analysis & image generation

## Development Notes

- All auth is handled by Supabase Auth
- Protected routes: `/dashboard`, `/generate`, `/settings`
- Credits are tracked in `profiles.credits` column
- Use `deduct_credits()` function for atomic credit operations
- Generated images stored in Supabase Storage with signed URLs
