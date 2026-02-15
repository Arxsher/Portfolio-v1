"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useSpring, useMotionValue } from "framer-motion"

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(true)
  const hasMovedRef = useRef(false)

  // Use motion values for smoother performance
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Dot follows cursor tightly
  const dotX = useSpring(mouseX, { stiffness: 1000, damping: 50 })
  const dotY = useSpring(mouseY, { stiffness: 1000, damping: 50 })

  // Outline trails behind with softer spring
  const outlineX = useSpring(mouseX, { stiffness: 150, damping: 15 })
  const outlineY = useSpring(mouseY, { stiffness: 150, damping: 15 })

  useEffect(() => {
    // Check if device is mobile/touch
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 767px)").matches || "ontouchstart" in window)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)

    const handleMouseMove = (e: MouseEvent) => {
      // Set initial position immediately on first move (no animation)
      if (!hasMovedRef.current) {
        mouseX.jump(e.clientX)
        mouseY.jump(e.clientY)
        hasMovedRef.current = true
      } else {
        mouseX.set(e.clientX)
        mouseY.set(e.clientY)
      }
      setIsVisible(true)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    const handleMouseEnter = () => {
      setIsVisible(true)
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    document.addEventListener("mouseleave", handleMouseLeave)
    document.addEventListener("mouseenter", handleMouseEnter)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("mouseenter", handleMouseEnter)
      window.removeEventListener("resize", checkMobile)
    }
  }, [mouseX, mouseY])

  // Don't render on mobile or until cursor has moved
  if (isMobile || !isVisible) return null

  return (
    <>
      <motion.div
        className="cursor-dot"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
      <motion.div
        className="cursor-outline"
        style={{
          x: outlineX,
          y: outlineY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
    </>
  )
}
