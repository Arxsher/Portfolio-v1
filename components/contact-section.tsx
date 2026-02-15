"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { ArrowUpRight, Copy, Check } from "lucide-react"

const links = [
  { label: "Email", value: "dosofisan7@gmail.com", href: "mailto:dosofisan7@gmail.com", copyable: true },
  { label: "X", value: "@damilareoo", href: "https://x.com/damilareoo" },
  { label: "GitHub", value: "damilareoo", href: "https://github.com/damilareoo" },
  { label: "LinkedIn", value: "damilareoo", href: "https://linkedin.com/in/damilareoo" },
  { label: "v0", value: "@damilareoo", href: "https://v0.app/@damilareoo" },
  { label: "Layers", value: "damilareoo", href: "https://layers.to/damilareoo" },
  { label: "Substack", value: "@damilareoo", href: "https://substack.com/@damilareoo" },
  { label: "Contra", value: "damilareoo", href: "https://contra.com/damilareoo" },
]

export function ContactSection() {
  const [copied, setCopied] = useState(false)
  const [showSpotifyEmbed, setShowSpotifyEmbed] = useState(false)

  const copyEmail = () => {
    navigator.clipboard.writeText("dosofisan7@gmail.com")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1.0],
      },
    },
  }

  return (
    <section id="across-the-web" className="py-8 pb-12 md:py-12 md:pb-16 relative">
      <div className="px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative mb-6 md:mb-10"
        >
          <div className="h-px bg-[#2a2a2a] mb-4 md:mb-6" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-4 md:w-6 h-px bg-[#404040]" />
              <span className="text-mono text-[#737373]">elsewhere</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-[#404040] rounded-full" />
              <div className="w-6 md:w-8 h-px bg-[#2a2a2a]" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="relative"
        >
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-[#404040] via-[#2a2a2a] to-transparent hidden md:block" />

          <div className="md:pl-6 space-y-2.5 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-12">
            {links.map((link) => (
              <motion.div
                key={link.label}
                className="group flex items-center justify-between py-2.5 md:py-3 border-b border-[#1a1a1a] hover:border-[#404040] transition-colors duration-300 md:pl-4"
              >
                {link.copyable ? (
                  <div className="flex items-center gap-2 md:gap-3">
                    <span className="text-mono text-[#737373] text-xs md:text-sm flex-shrink-0">{link.label}</span>
                    <span className="text-base text-[#a1a1a1] truncate max-w-[120px] md:max-w-none text-xs md:text-sm">
                      {link.value}
                    </span>
                    <button
                      onClick={copyEmail}
                      className="text-[#525252] hover:text-[#fafafa] transition-colors duration-300 flex-shrink-0"
                      aria-label="Copy email"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      )}
                    </button>
                  </div>
                ) : (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 md:gap-3 w-full"
                  >
                    <span className="text-mono text-[#737373] group-hover:text-[#a1a1a1] transition-colors text-xs md:text-sm flex-shrink-0">
                      {link.label}
                    </span>
                    <span className="text-base text-[#a1a1a1] group-hover:text-[#fafafa] transition-colors duration-300 truncate text-xs md:text-sm">
                      {link.value}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#525252] group-hover:text-[#fafafa] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 flex-shrink-0" />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <footer className="mt-12 md:mt-16 relative">
          <div className="h-px bg-[#2a2a2a] mb-4 md:mb-6" />

          <div className="flex items-center justify-center flex-wrap gap-1">
            <p className="text-base text-[#737373] text-xs md:text-sm flex items-center gap-1 md:gap-1.5 flex-wrap justify-center">
              <span>Built with love and music by</span>
              <a
                href="https://x.com/damilare_oo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#a1a1a1] hover:text-[#fafafa] transition-colors"
              >
                Damilare
              </a>
              <span
                className="relative inline-flex items-center"
                onMouseEnter={() => setShowSpotifyEmbed(true)}
                onMouseLeave={() => setShowSpotifyEmbed(false)}
              >
                <a
                  href="https://open.spotify.com/playlist/2WqAscMqGj6fGkjaYN9jsY?si=74ddec964be94dca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#a1a1a1] hover:text-[#fafafa] transition-colors"
                  aria-label="Spotify Playlist"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-3.5 w-3.5 md:h-4 md:w-4"
                  >
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                </a>

                <AnimatePresence>
                  {showSpotifyEmbed && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        scale: 0.8,
                        y: 10,
                        filter: "blur(4px)",
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        filter: "blur(0px)",
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.9,
                        y: 5,
                        filter: "blur(2px)",
                      }}
                      transition={{
                        duration: 0.3,
                        ease: [0.25, 0.1, 0.25, 1.0],
                        scale: {
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        },
                      }}
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 z-50 bg-[#121212] rounded-lg shadow-2xl border border-[#2a2a2a] overflow-hidden spotify-popup"
                    >
                      <motion.div
                        className="w-72 md:w-80"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.2 }}
                      >
                        <iframe
                          src="https://open.spotify.com/embed/playlist/2WqAscMqGj6fGkjaYN9jsY?utm_source=generator&theme=0"
                          width="100%"
                          height="352"
                          frameBorder="0"
                          allowFullScreen
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                          className="rounded-lg"
                        />
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ delay: 0.15, duration: 0.2 }}
                        className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-[#2a2a2a]"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </span>
            </p>
          </div>

          <div className="mt-6 md:mt-8 flex items-center justify-center gap-2 md:gap-3">
            <div className="w-6 md:w-8 h-px bg-[#2a2a2a]" />
            <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-[#404040] rounded-full" />
            <div className="w-6 md:w-8 h-px bg-[#2a2a2a]" />
          </div>

          <div className="absolute bottom-0 left-3 md:left-4 w-3 h-3 md:w-4 md:h-4 border-l border-b border-[#333]" />
          <div className="absolute bottom-0 right-3 md:right-4 w-3 h-3 md:w-4 md:h-4 border-r border-b border-[#333]" />
        </footer>
      </div>
    </section>
  )
}
