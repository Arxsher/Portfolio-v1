import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { motion } from "framer-motion"
import { HeroSection } from "./components/hero-section"
import { WorkSection } from "./components/work-section"
import { BentoSection } from "./components/bento-section"
import { ContactSection } from "./components/contact-section"
import { Navbar } from "./components/navbar"
import { CustomCursor } from "./components/custom-cursor"
import { SmoothScrollProvider, SectionTransition } from "./components/smooth-scroll-provider"
import { ProjectDetail } from "./pages/ProjectDetail"

function HomePage() {
  return (
    <div className="grid-container relative">
      {/* Left border line */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-[hsl(var(--line))] hidden md:block" />
      {/* Right border line */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-[hsl(var(--line))] hidden md:block" />

      <section id="hero">
        <SectionTransition id="hero">
          <HeroSection />
        </SectionTransition>
      </section>

      <section id="work">
        <SectionTransition id="work">
          <WorkSection />
        </SectionTransition>
      </section>

      <section id="bento">
        <SectionTransition id="bento">
          <BentoSection />
        </SectionTransition>
      </section>

      <section id="across-the-web">
        <SectionTransition id="across-the-web">
          <ContactSection />
        </SectionTransition>
      </section>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <SmoothScrollProvider>
        <motion.main
          className="min-h-screen relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0] }}
        >
          <span
            className="fixed bottom-4 left-4 md:left-8 text-mono text-xs text-[hsl(var(--muted-foreground))] select-none pointer-events-none z-50 hidden md:inline"
            aria-hidden
          >
            ~/.Press L
          </span>
          <Routes>
            <Route 
              path="/" 
              element={
                <>
                  <CustomCursor />
                  <Navbar />
                  <HomePage />
                </>
              } 
            />
            <Route path="/project/:id" element={<ProjectDetail />} />
          </Routes>
        </motion.main>
      </SmoothScrollProvider>
    </Router>
  )
}
