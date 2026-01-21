import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Profile, Generation, GeneratedImage } from '@/types/database'

type GenerationWithImages = Generation & { generated_images: GeneratedImage[] | null }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's recent generations
  const { data: generations } = await supabase
    .from('generations')
    .select('*, generated_images(*)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(6) as { data: GenerationWithImages[] | null }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single() as { data: Profile | null }

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    analyzing: 'bg-blue-100 text-blue-800',
    generating: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Create stunning Amazon listing images with AI
          </p>
        </div>
        <Link href="/generate">
          <Button size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Generation
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available Credits</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {profile?.credits ?? 0}
              <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
              </svg>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/credits" className="text-sm text-violet-600 hover:underline">
              Buy more credits →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Generations</CardDescription>
            <CardTitle className="text-3xl">{generations?.length ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/history" className="text-sm text-violet-600 hover:underline">
              View history →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Images Created</CardDescription>
            <CardTitle className="text-3xl">
              {generations?.reduce((acc, g) => acc + (g.generated_images?.length || 0), 0) ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm text-gray-500">Across all generations</span>
          </CardContent>
        </Card>
      </div>

      {/* Recent Generations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Generations</h2>
          <Link href="/history" className="text-sm text-violet-600 hover:underline">
            View all →
          </Link>
        </div>

        {generations && generations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generations.map((generation) => (
              <Link key={generation.id} href={`/generation/${generation.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-1">
                        {generation.product_title}
                      </CardTitle>
                      <Badge className={statusColors[generation.status]}>
                        {generation.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {new Date(generation.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {generation.generated_images?.length || 0} images
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No generations yet</h3>
              <p className="text-gray-500 mb-4">Start by creating your first listing images</p>
              <Link href="/generate">
                <Button>Create Your First Generation</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
