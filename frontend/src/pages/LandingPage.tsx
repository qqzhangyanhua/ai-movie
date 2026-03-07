import { LandingNav } from '@/components/landing/LandingNav'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Footer } from '@/components/landing/Footer'

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden relative">
      <LandingNav />
      <main className="relative z-10 w-full overflow-hidden">
        <Hero />
        <Features />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  )
}
