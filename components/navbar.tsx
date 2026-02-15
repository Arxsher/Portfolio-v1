"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Menu } from "lucide-react"
import { useScrollContext } from "./smooth-scroll-provider"
import { MobileMenu } from "./mobile-menu"
import Image from "next/image"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { currentSection } = useScrollContext()

  const navItems = [
    { name: "Experiments", href: "#work", id: "work" },
    { name: "Elsewhere", href: "#across-the-web", id: "across-the-web" },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <>
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1.0] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-black/90 backdrop-blur-sm" : ""
        }`}
      >
        <div className="h-px bg-[#222]" />

        <div className="grid-container">
          <div className="flex items-center justify-between py-3 md:py-4 px-4 md:px-8">
            <a href="#" className="flex items-center gap-2 md:gap-3 group">
              <div className="w-1.5 md:w-2 h-px bg-[#333] group-hover:w-3 md:group-hover:w-4 group-hover:bg-[#666] transition-all duration-300" />
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden border border-[#333] group-hover:border-[#666] transition-colors duration-300">
                <Image
                  src="/images/avatar.png"
                  alt="Damilare Osofisan"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
            </a>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item, index) => (
                <div key={item.name} className="flex items-center">
                  {index > 0 && <div className="w-4 h-px bg-[#222] mx-2" />}
                  <a
                    href={item.href}
                    className={`text-mono px-3 py-1 transition-all duration-300 ${
                      currentSection === item.id
                        ? "text-[#fafafa] font-semibold"
                        : "text-[#737373] hover:text-[#a1a1a1]"
                    }`}
                  >
                    {item.name}
                  </a>
                </div>
              ))}
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(true)}
                className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 border border-[#222] hover:border-[#333] transition-colors duration-300 text-[#ededed]"
                aria-label="Open menu"
              >
                <Menu className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="h-px bg-[#222]" />
      </motion.header>

      <MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
