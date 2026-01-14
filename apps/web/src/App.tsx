import { Nav } from '@/components/Nav'
import { Hero } from '@/sections/Hero'
import { HowItWorks } from '@/sections/HowItWorks'
import { Integrations } from '@/sections/Integrations'
import { OneLinePattern } from '@/sections/OneLinePattern'
import { Rules } from '@/sections/Rules'
import { CodeTabs } from '@/sections/CodeTabs'
import { Waitlist } from '@/sections/Waitlist'
import { Footer } from '@/sections/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main id="main-content">
        <Hero />
        <HowItWorks />
        <Integrations />
        <OneLinePattern />
        <Rules />
        <CodeTabs />
        <Waitlist />
      </main>
      <Footer />
    </div>
  )
}
