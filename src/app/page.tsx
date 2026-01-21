import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-bold text-xl text-gray-900">Peccy AI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
            AI-Powered Amazon Listing Images
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Create Stunning
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent"> Product Images </span>
            in Minutes
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload your product photo and let AI generate professional Amazon listing images
            including hero shots, infographics, lifestyle images, and comparison charts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-lg px-8">
                Start Free - 10 Credits
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8">
              See Examples
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            No credit card required. Start with 10 free image generations.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Amazon Listings
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our AI generates 5 different image types optimized for Amazon&apos;s requirements
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Hero/Main Image',
                description: 'Clean product shot on white background, perfect for your main listing image',
                icon: '🎯',
              },
              {
                title: 'Infographics',
                description: 'Technical features and benefits displayed with professional callouts and icons',
                icon: '📊',
              },
              {
                title: 'Lifestyle Images',
                description: 'Product in real-life settings showing usage and scale',
                icon: '🏠',
              },
              {
                title: 'Comparison Charts',
                description: 'Side-by-side comparisons and package contents visualization',
                icon: '⚖️',
              },
              {
                title: 'Style Matching',
                description: 'Upload a reference image and match its exact visual style',
                icon: '🎨',
              },
              {
                title: 'Brand Consistency',
                description: 'Lock your brand colors and let AI maintain consistency',
                icon: '✨',
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-gray-600">Three simple steps to professional listing images</p>
          </div>

          <div className="space-y-12">
            {[
              {
                step: '01',
                title: 'Upload Your Product',
                description: 'Upload one or more photos of your product. Add optional style references and brand colors.',
              },
              {
                step: '02',
                title: 'Choose Your Framework',
                description: 'AI analyzes your product and generates 4 unique design frameworks. Pick your favorite style.',
              },
              {
                step: '03',
                title: 'Download Your Images',
                description: 'Get 5 professional listing images ready for Amazon. Regenerate or edit any image as needed.',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xl">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Credit-Based Pricing
            </h2>
            <p className="text-gray-600">1 credit = 1 image generation. Buy what you need.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { credits: 25, price: 9.99, perCredit: 0.40, popular: false },
              { credits: 100, price: 29.99, perCredit: 0.30, popular: true },
              { credits: 500, price: 99.99, perCredit: 0.20, popular: false },
            ].map((plan, i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl border-2 ${
                  plan.popular
                    ? 'border-violet-600 bg-violet-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.popular && (
                  <div className="text-violet-600 text-sm font-semibold mb-2">Most Popular</div>
                )}
                <div className="text-3xl font-bold text-gray-900">{plan.credits} Credits</div>
                <div className="text-gray-600 mb-4">${plan.perCredit.toFixed(2)} per credit</div>
                <div className="text-4xl font-bold text-gray-900 mb-6">${plan.price}</div>
                <Button
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600'
                      : ''
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  Buy Credits
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Listings?
          </h2>
          <p className="text-gray-600 mb-8">
            Join thousands of Amazon sellers using AI to create better product images.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-lg px-8">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="font-semibold text-gray-900">Peccy AI</span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Peccy AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
