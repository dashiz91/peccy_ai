'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const CREDIT_PACKAGES = [
  {
    id: 'credits_25',
    name: '25 Credits',
    credits: 25,
    price: 9.99,
    pricePerCredit: 0.40,
    popular: false,
  },
  {
    id: 'credits_100',
    name: '100 Credits',
    credits: 100,
    price: 29.99,
    pricePerCredit: 0.30,
    popular: true,
  },
  {
    id: 'credits_500',
    name: '500 Credits',
    credits: 500,
    price: 99.99,
    pricePerCredit: 0.20,
    popular: false,
  },
]

function CreditsContent() {
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for success/canceled params
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success === 'true') {
      toast.success('Payment successful! Your credits have been added.')
    } else if (canceled === 'true') {
      toast.info('Payment canceled.')
    }

    // Fetch current credits
    async function fetchCredits() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single()

        if (profile) {
          setCredits(profile.credits)
        }
      }
    }

    fetchCredits()
  }, [searchParams])

  const handlePurchase = async (packageId: string) => {
    setLoading(packageId)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed')
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Buy Credits
          </h1>
          <p className="text-gray-600">
            1 credit = 1 image generation. Buy what you need.
          </p>
          {credits !== null && (
            <p className="mt-4 text-lg">
              Current balance:{' '}
              <span className="font-bold text-violet-600">{credits} credits</span>
            </p>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative ${
                pkg.popular
                  ? 'border-2 border-violet-600 shadow-lg'
                  : 'border border-gray-200'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl">{pkg.credits} Credits</CardTitle>
                <CardDescription>
                  ${pkg.pricePerCredit.toFixed(2)} per credit
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-6">
                  ${pkg.price.toFixed(2)}
                </div>
                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading !== null}
                  className={`w-full ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700'
                      : ''
                  }`}
                  variant={pkg.popular ? 'default' : 'outline'}
                >
                  {loading === pkg.id ? 'Processing...' : 'Buy Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Credit Usage Info */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            How Credits Work
          </h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">0</span>
                </div>
                <div>
                  <p className="font-medium">Framework Analysis</p>
                  <p className="text-sm text-gray-500">Free</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                  <span className="text-violet-600 font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium">Generate Image</p>
                  <p className="text-sm text-gray-500">Per image</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                  <span className="text-violet-600 font-bold">5</span>
                </div>
                <div>
                  <p className="font-medium">Full Set</p>
                  <p className="text-sm text-gray-500">All 5 listing images</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                  <span className="text-violet-600 font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium">Regenerate/Edit</p>
                  <p className="text-sm text-gray-500">Per modification</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreditsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <CreditsContent />
    </Suspense>
  )
}
