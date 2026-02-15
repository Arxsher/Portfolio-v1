import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Menu, Sun, Moon } from "lucide-react"
import { useScrollContext } from "./smooth-scroll-provider"
import { MobileMenu } from "./mobile-menu"
import { useLocation, Link } from "react-router-dom"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark"
  })
  const { currentSection } = useScrollContext()
  const location = useLocation()

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  const navItems = [
    { name: "Overview", href: "/project/overview", id: "overview" },
    { name: "Experiments", href: "/#work", id: "work" },
    { name: "Elsewhere", href: "/#across-the-web", id: "across-the-web" },
  ]

  // Calculate terminal path based on URL and Scroll state
  const getTerminalPath = () => {
    const path = location.pathname
    
    // If on home page, use the current scroll section as the sub-path
    if (path === "/") {
      if (currentSection === "work") return "~/experiments"
      if (currentSection === "across-the-web") return "~/elsewhere"
      if (currentSection === "bento") return "~/dashboard"
      return "~/"
    }
    
    // If on project page
    if (path.startsWith("/project/")) {
      const projectId = path.replace("/project/", "")
      if (projectId === "overview") return "~/overview"
      return `~/projects/${projectId}`
    }
    
    return "~/"
  }

  const toggleTheme = (e?: React.MouseEvent | KeyboardEvent) => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "dark" ? "light" : "dark"
      localStorage.setItem("theme", newTheme)
      return newTheme
    })
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'l') {
        toggleTheme(e)
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Handle anchor link clicks manually since we're using react-router
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#") && location.pathname === "/") {
      e.preventDefault()
      const id = href.replace("/#", "")
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  return (
    <>
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1.0] }}
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${
          scrolled ? "bg-[hsl(var(--background))/90] backdrop-blur-sm border-b border-[hsl(var(--line))]" : ""
        }`}
      >
        <div className="h-px bg-[hsl(var(--line))]" />

        <div className="grid-container">
          <div className="flex items-center justify-between py-3 md:py-4 px-4 md:px-8">
            <Link to="/" className="flex items-center gap-1.5 md:gap-2 group text-mono font-bold tracking-tighter">
              <span className="text-[hsl(var(--accent))]">{getTerminalPath()}</span>
              <div className="w-2 h-4 md:w-2.5 md:h-5 bg-[hsl(var(--foreground))] terminal-cursor" />
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item, index) => (
                <div key={item.name} className="flex items-center">
                  {index > 0 && <div className="w-4 h-px bg-[hsl(var(--line))] mx-2" />}
                  <Link
                    to={item.href}
                    onClick={(e) => handleAnchorClick(e, item.href)}
                    className={`text-mono px-3 py-1 transition-all duration-300 ${
                      currentSection === item.id || (location.pathname === item.href)
                        ? "text-[hsl(var(--foreground))] font-semibold"
                        : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    }`}
                  >
                    {item.name}
                  </Link>
                </div>
              ))}
            </div>

            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={(e) => toggleTheme(e)}
                className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors p-2"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={() => setIsOpen(true)}
                className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 border border-[hsl(var(--line))] hover:border-[hsl(var(--line-accent))] transition-colors duration-300 text-[hsl(var(--foreground))]"
                aria-label="Open menu"
              >
                <Menu className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="h-px bg-[hsl(var(--line))]" />
      </motion.header>

      <MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
