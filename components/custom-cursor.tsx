"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [clicked, setClicked] = useState(false)
  const [linkHovered, setLinkHovered] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [overIframe, setOverIframe] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  const onMouseMove = useCallback((e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY })
  }, [])

  const onMouseEnter = useCallback(() => {
    setHidden(false)
  }, [])

  const onMouseLeave = useCallback(() => {
    setHidden(true)
  }, [])

  const onMouseDown = useCallback(() => {
    setClicked(true)
  }, [])

  const onMouseUp = useCallback(() => {
    setClicked(false)
  }, [])

  useEffect(() => {
    setIsHydrated(true)
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  useEffect(() => {
    if (isMobile || !isHydrated) return

    document.addEventListener("mousemove", onMouseMove, true)
    document.addEventListener("mouseenter", onMouseEnter)
    document.addEventListener("mouseleave", onMouseLeave)
    document.addEventListener("mousedown", onMouseDown)
    document.addEventListener("mouseup", onMouseUp)

    window.addEventListener("mousemove", onMouseMove, true)

    const handleLinkHoverEvents = () => {
      document.querySelectorAll("a, button, input, textarea, [role='button']").forEach((el) => {
        el.addEventListener("mouseenter", () => setLinkHovered(true))
        el.addEventListener("mouseleave", () => setLinkHovered(false))
      })
    }

    const handleIframeHoverEvents = () => {
      document.querySelectorAll(".spotify-popup, iframe").forEach((el) => {
        el.addEventListener("mouseenter", () => setOverIframe(true))
        el.addEventListener("mouseleave", () => setOverIframe(false))
      })
    }

    handleLinkHoverEvents()
    handleIframeHoverEvents()

    const observer = new MutationObserver(() => {
      handleLinkHoverEvents()
      handleIframeHoverEvents()
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.removeEventListener("mousemove", onMouseMove, true)
      document.removeEventListener("mouseenter", onMouseEnter)
      document.removeEventListener("mouseleave", onMouseLeave)
      document.removeEventListener("mousedown", onMouseDown)
      document.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener("mousemove", onMouseMove, true)
      observer.disconnect()
    }
  }, [isMobile, isHydrated, onMouseMove, onMouseEnter, onMouseLeave, onMouseDown, onMouseUp])

  if (!isHydrated || isMobile) return null

  return (
    <>
      <motion.div
        className="cursor-dot"
        animate={{
          x: position.x - 4,
          y: position.y - 4,
          scale: clicked ? 0.5 : linkHovered ? 2 : 1,
          opacity: hidden || overIframe ? 0 : 1,
        }}
        transition={{
          type: "spring",
          mass: 0.2,
          stiffness: 800,
          damping: 30,
        }}
      />
      <motion.div
        className="cursor-outline"
        animate={{
          x: position.x - 16,
          y: position.y - 16,
          scale: clicked ? 0.5 : linkHovered ? 1.5 : 1,
          opacity: hidden || overIframe ? 0 : 1,
        }}
        transition={{
          type: "spring",
          mass: 0.5,
          stiffness: 200,
          damping: 30,
        }}
      />
    </>
  )
}
