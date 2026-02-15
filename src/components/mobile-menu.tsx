import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronRight, Terminal, BookOpen, Layers } from "lucide-react"
import { NavLink, Link, useLocation } from "react-router-dom"
import { projects } from "../data/projects"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const location = useLocation()
  
  const mainNavItems = [
    { name: "Home", href: "/", id: "home" },
    { name: "Overview", href: "/project/overview", id: "overview" },
    { name: "Experiments", href: "/#work", id: "work" },
    { name: "Elsewhere", href: "/#across-the-web", id: "across-the-web" },
  ]

  // Handle anchor link clicks for mobile
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#") && location.pathname === "/") {
      e.preventDefault()
      onClose()
      const id = href.replace("/#", "")
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
            className="absolute top-0 right-0 bottom-0 w-[85%] max-w-sm bg-[hsl(var(--background))] border-l border-[hsl(var(--line))] overflow-y-auto shadow-2xl flex flex-col"
          >
            <div className="sticky top-0 bg-[hsl(var(--background))] z-10 border-b border-[hsl(var(--line))]">
              <div className="flex items-center justify-between py-4 px-6">
                <div className="text-mono text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-widest font-bold font-jetbrains-mono">~/menu</div>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-9 h-9 border border-[hsl(var(--line))] hover:border-[hsl(var(--line-accent))] transition-colors duration-300 text-[hsl(var(--foreground))]"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="px-6 py-8 space-y-10 flex-1">
              {/* Main Navigation */}
              <div>
                <div className="flex items-center gap-2 text-theme-muted mb-4 uppercase text-[10px] tracking-[0.2em] font-mono font-bold font-jetbrains-mono">
                  <Layers size={12} />
                  Navigation
                </div>
                <div className="space-y-2">
                  {mainNavItems.map((item) => (
                    <Link
                      key={item.id}
                      to={item.href}
                      onClick={(e) => {
                        if (item.href.startsWith("/#")) handleAnchorClick(e, item.href)
                        else onClose()
                      }}
                      className={`flex items-center gap-2 text-sm py-2 px-4 rounded-xl transition-all font-mono font-jetbrains-mono ${
                        (location.pathname === item.href)
                          ? "bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))] font-bold" 
                          : "text-theme-muted hover:text-theme-foreground"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Projects List */}
              <div>
                <div className="flex items-center gap-2 text-theme-muted mb-4 uppercase text-[10px] tracking-[0.2em] font-mono font-bold font-jetbrains-mono">
                  <Terminal size={12} />
                  Project Logs
                </div>
                <div className="space-y-1">
                  {projects.filter(p => p.category !== 'system' && p.category !== 'profile' && p.category !== 'outreach').map((p) => (
                    <NavLink
                      key={p.id}
                      to={`/project/${p.id}`}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-2 text-sm py-2 px-4 rounded-xl transition-all font-mono font-jetbrains-mono ${
                          isActive 
                            ? "bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))] font-bold" 
                            : "text-theme-muted hover:text-theme-foreground"
                        }`
                      }
                    >
                      {p.title}
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* Identity/Resources */}
              <div>
                <div className="flex items-center gap-2 text-theme-muted mb-4 uppercase text-[10px] tracking-[0.2em] font-mono font-bold font-jetbrains-mono">
                  <BookOpen size={12} />
                  Identity
                </div>
                <div className="space-y-1">
                  <NavLink
                    to="/project/about"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-2 text-sm py-2 px-4 rounded-xl transition-all font-mono font-jetbrains-mono ${
                        isActive 
                          ? "bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))] font-bold" 
                          : "text-theme-muted hover:text-theme-foreground"
                      }`
                    }
                  >
                    About
                  </NavLink>
                  <NavLink
                    to="/project/contact"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-2 text-sm py-2 px-4 rounded-xl transition-all font-mono font-jetbrains-mono ${
                        isActive 
                          ? "bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))] font-bold" 
                          : "text-theme-muted hover:text-theme-foreground"
                      }`
                    }
                  >
                    Contact
                  </NavLink>
                </div>
              </div>
            </div>

            <div className="mt-auto py-10 px-6 flex justify-between items-center opacity-20">
              <div className="h-px flex-1 bg-[hsl(var(--line))]" />
              <span className="font-mono text-[9px] uppercase px-4 whitespace-nowrap font-jetbrains-mono">End of Stack</span>
              <div className="h-px flex-1 bg-[hsl(var(--line))]" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
