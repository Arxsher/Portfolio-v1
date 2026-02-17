"use client"

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"
import { motion, useSpring, useInView } from "framer-motion"

type ScrollContextType = {
  currentSection: string
}

const ScrollContext = createContext<ScrollContextType | null>(null)

export function useScrollContext() {
  const context = useContext(ScrollContext)
  if (!context) {
    throw new Error("useScrollContext must be used within a ScrollProvider")
  }
  return context
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [currentSection, setCurrentSection] = useState("hero")

  useEffect(() => {
    const sections = ["hero", "work", "across-the-web"]

    // When near bottom of page, always highlight Elsewhere (section can be short)
    const checkBottom = () => {
      const scrollBottom = window.scrollY + window.innerHeight
      const docHeight = document.documentElement.scrollHeight - 80
      if (scrollBottom >= docHeight) {
        setCurrentSection("across-the-web")
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id
            if (sections.includes(id)) {
              setCurrentSection(id)
            }
          }
        })
      },
      {
        rootMargin: "-30% 0px -50% 0px",
        threshold: 0.1,
      },
    )

    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId)
      if (element) observer.observe(element)
    })

    window.addEventListener("scroll", checkBottom, { passive: true })
    checkBottom()

    return () => {
      sections.forEach((sectionId) => {
        const element = document.getElementById(sectionId)
        if (element) observer.unobserve(element)
      })
      window.removeEventListener("scroll", checkBottom)
    }
  }, [])

  return <ScrollContext.Provider value={{ currentSection }}>{children}</ScrollContext.Provider>
}

export function SectionTransition({ children, id }: { children: ReactNode; id: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    margin: "-10% 0px -10% 0px",
    once: false,
    amount: 0.2,
  })

  // Use spring physics for buttery smooth transitions
  const springConfig = { stiffness: 70, damping: 20, mass: 0.5 }
  const opacity = useSpring(isInView ? 1 : 0.8, springConfig)

  return (
    <motion.div
      ref={ref}
      style={{
        opacity,
        willChange: "opacity, transform",
      }}
      transition={{
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1.0],
      }}
    >
      {children}
    </motion.div>
  )
}
