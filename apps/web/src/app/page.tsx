import { Navigation } from '@/components/landing/Navigation'
import { Hero } from '@/components/landing/Hero'
import { PreviewSection } from '@/components/landing/PreviewSection'
import { Features } from '@/components/landing/Features'
import { ApiSection } from '@/components/landing/ApiSection'
import { Pricing } from '@/components/landing/Pricing'
import { Footer } from '@/components/landing/Footer'

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <Navigation />
      <Hero />
      <PreviewSection />
      <Features />
      <ApiSection />
      <Pricing />
      <Footer />
    </div>
  )
}
