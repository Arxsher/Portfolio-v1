"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { MapPin, GitBranch, FileText, ArrowUpRight, Info, User } from "lucide-react"
import { Link } from "react-router-dom"

// stunning custom palette for the commits bar
const languageColors: Record<string, string> = {
  TypeScript: "#3178c6", 
  JavaScript: "#f1e05a", 
  PHP: "#a855f7",        
  Python: "#3572A5",     
  HTML: "#e34c26",       
  CSS: "#ff69b4",        
  React: "#22d3ee",      
}

export function BentoSection() {
  const [currentTime, setCurrentTime] = useState("")
  const [commits, setCommits] = useState<any[]>([
    { repo: "portfolio", message: "Initial commit", additions: 142, deletions: 12 },
    { repo: "spotify", message: "feat: manual build", additions: 85, deletions: 4 },
    { repo: "tp-react", message: "initial state", additions: 12, deletions: 0 },
    { repo: "comet", message: "rebuilt for web age", additions: 210, deletions: 15 }
  ])
  const [languages] = useState<any[]>([
    { name: "TypeScript", percent: 35, color: "#3178c6" },
    { name: "React", percent: 25, color: "#22d3ee" },
    { name: "PHP", percent: 20, color: "#a855f7" },
    { name: "JavaScript", percent: 15, color: "#f1e05a" },
    { name: "CSS", percent: 5, color: "#ff69b4" }
  ])
  const [hoveredLang, setHoveredLang] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [clickCount, setClickCount] = useState<number | string>("...")
  const [userClicks, setUserClicks] = useState(0)
  const [plusOnes, setPlusOnes] = useState<{ id: number; x: number }[]>([])

  // Abacus API Config
  const ABACUS_NAMESPACE = "ArxsherPortfolio"
  const ABACUS_KEY = "globalClicks"

  // Update time for Casablanca
  useEffect(() => {
    const updateTime = () => {
      const time = new Date().toLocaleTimeString("en-US", {
        timeZone: "Africa/Casablanca",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      setCurrentTime(time)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Fetch initial click count, real GitHub data, and local user clicks
  useEffect(() => {
    const savedClicks = localStorage.getItem("user_clicks_record")
    if (savedClicks) setUserClicks(parseInt(savedClicks))

    async function initData() {
      // 1. Fetch Abacus Click Count
      try {
        const res = await fetch(`https://abacus.jasoncameron.dev/get/${ABACUS_NAMESPACE}/${ABACUS_KEY}`)
        const data = await res.json()
        if (data.value !== undefined) setClickCount(data.value)
      } catch (e) { console.error("Abacus load failed", e) }

      // 2. Fetch GitHub
      try {
        const eventsRes = await fetch("https://api.github.com/users/Arxsher/events/public")
        if (!eventsRes.ok) throw new Error("API Limit")
        const eventsData = await eventsRes.json()
        const pushEvents = eventsData.filter((event: any) => event.type === "PushEvent")
        const recentCommits: any[] = []
        for (const event of pushEvents) {
          if (event.payload && Array.isArray(event.payload.commits)) {
            const repoName = event.repo.name.split("/")[1]
            for (const commit of event.payload.commits) {
              if (recentCommits.length < 4) {
                try {
                  const detailRes = await fetch(`https://api.github.com/repos/${event.repo.name}/commits/${commit.sha}`)
                  const detailData = await detailRes.json()
                  recentCommits.push({
                    repo: repoName,
                    message: commit.message,
                    additions: detailData.stats?.additions || 0,
                    deletions: detailData.stats?.deletions || 0,
                  })
                } catch {
                  recentCommits.push({ repo: repoName, message: commit.message, additions: 0, deletions: 0 })
                }
              }
            }
          }
        }
        if (recentCommits.length > 0) setCommits(recentCommits)
      } catch (err) { console.warn(err) }
      finally { setLoading(false) }
    }
    initData()
  }, [])

  const handleAbacusClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const newTotal = userClicks + 1
    setUserClicks(newTotal)
    localStorage.setItem("user_clicks_record", newTotal.toString())
    
    const id = Date.now()
    const spreadX = (Math.random() - 0.5) * 60
    setPlusOnes(prev => [...prev, { id, x: spreadX }])
    
    setTimeout(() => {
      setPlusOnes(prev => prev.filter(p => p.id !== id))
    }, 800)

    try {
      const res = await fetch(`https://abacus.jasoncameron.dev/hit/${ABACUS_NAMESPACE}/${ABACUS_KEY}`)
      const data = await res.json()
      if (data.value !== undefined) setClickCount(data.value)
    } catch (e) { console.error("Abacus hit failed", e) }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1.0],
      },
    },
  }

  return (
    <section id="bento" className="py-8 md:py-12 relative font-sans">
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
              <div className="w-4 md:w-6 h-px bg-[hsl(var(--line))]" />
              <span className="text-mono text-[hsl(var(--muted-foreground))]">dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-[hsl(var(--line))] rounded-full" />
              <div className="w-6 md:w-8 h-px bg-[hsl(var(--line-accent))]" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-8 gap-4"
        >
          {/* About & CV Card */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-3 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4 flex flex-col justify-center items-center"
          >
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <span className="text-mono text-sm text-[hsl(var(--foreground))]">About Me</span>
            </div>
            <div className="text-center">
              <p className="text-[hsl(var(--muted-foreground))] text-sm leading-relaxed mb-6">
                Learn about my background, experience, and current projects.
              </p>
              <Link
                to="/project/about"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#fab387] hover:bg-[#f9c7a3] text-[#1e1e2e] rounded-md text-sm transition-all border border-[hsl(var(--border))] font-mono font-medium"
              >
                npm i about
              </Link>
            </div>
          </motion.div>

          {/* Currently Based In Card - RE-STYLED WITH IMAGE FILTER */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4 overflow-hidden flex flex-col"
          >
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <MapPin className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <span className="text-mono text-sm text-[hsl(var(--foreground))]">Currently Based In</span>
              <span className="text-red-500 animate-bounce">📍</span>
            </div>

            <div className="relative h-24 bg-[hsl(var(--muted))] rounded-md mb-3 overflow-hidden">
                <img 
                  src="/casa-map.jpg" 
                  alt="Casablanca Map" 
                  className="w-full h-full object-cover grayscale brightness-50 contrast-125 opacity-40"
                />
                <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />
            </div>

            <div className="flex items-center justify-between mt-auto">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono uppercase tracking-[0.2em]">CASABLANCA</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[hsl(var(--muted))]">🌙</span>
                <span className="text-mono text-[11px] text-[hsl(var(--muted-foreground))]">{currentTime}</span>
              </div>
            </div>
          </motion.div>

          {/* Counter Card */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-3 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4 flex flex-col"
          >
            <div className="flex justify-end mb-2">
              <Info className="w-4 h-4 text-[hsl(var(--muted))]" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <motion.span 
                key={clickCount}
                className="text-4xl font-bold text-[hsl(var(--foreground))] tracking-tight mb-4"
              >
                {typeof clickCount === 'number' ? clickCount.toLocaleString() : clickCount}
              </motion.span>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={handleAbacusClick}
                className="relative px-6 py-2 bg-[#fab387] text-[#1e1e2e] rounded-md text-sm font-medium hover:bg-[#f9c7a3] transition-colors uppercase"
              >
                CLICK ME
                <AnimatePresence>
                  {plusOnes.map((p) => (
                    <motion.span
                      key={p.id}
                      initial={{ opacity: 1, y: 0, x: p.x, scale: 0.5 }}
                      animate={{ opacity: 0, y: -60, scale: 1.2 }}
                      exit={{ opacity: 0 }}
                      transition={{ 
                        duration: 1.2, 
                        ease: [0.22, 1, 0.36, 1],
                        opacity: { duration: 0.8, delay: 0.4 }
                      }}
                      className="absolute pointer-events-none text-[#fab387] font-black text-base select-none drop-shadow-[0_0_12px_rgba(250,179,135,0.8)]"
                      style={{ left: "50%", top: "-10px" }}
                    >
                      +1
                    </motion.span>
                  ))}
                </AnimatePresence>
              </motion.button>
              <span className="text-xs text-[hsl(var(--muted-foreground))] mt-3">you've clicked {userClicks} times</span>
            </div>
          </motion.div>

          {/* Recent Commits Card */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4 flex flex-col justify-between group overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-orange-500" style={{ filter: 'drop-shadow(0 0 5px rgba(249, 115, 22, 0.4))' }} />
                  <span className="text-mono text-sm text-[hsl(var(--foreground))]">Recent Commits</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                    <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest font-black">Sync Active</span>
                </div>
              </div>

              <div className="space-y-2 mb-4 min-h-[80px]">
                {loading ? (
                  <span className="text-xs text-foreground/10 animate-pulse font-mono uppercase tracking-widest px-2">Hydrating...</span>
                ) : (
                  commits.map((commit, index) => (
                    <div key={index} className="flex items-center justify-between text-[11px] px-1 font-mono group/item">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-orange-500/50 shrink-0">{commit.repo}:</span>
                        <span className="text-[hsl(var(--muted-foreground))] truncate group-hover/item:text-[hsl(var(--foreground))] transition-colors">{commit.message}</span>
                      </div>
                      <div className="flex gap-2 shrink-0 ml-2">
                        <span className="text-emerald-500/80">+{commit.additions}</span>
                        <span className="text-[hsl(var(--muted))]">/</span>
                        <span className="text-rose-500/80">-{commit.deletions}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="relative pt-2 border-t border-foreground/5">
              <AnimatePresence>
                {hoveredLang && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: -35, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    className="absolute left-1/2 -translate-x-1/2 px-3 py-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded shadow-2xl flex items-center gap-2 z-50 pointer-events-none whitespace-nowrap"
                  >
                    <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: hoveredLang.color, color: hoveredLang.color }} />
                    <span className="text-[10px] font-black text-[hsl(var(--foreground))] uppercase tracking-tighter">{hoveredLang.name} {hoveredLang.percent}%</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex h-[3px] w-full rounded-none overflow-hidden mb-3 bg-[hsl(var(--muted))] items-center relative">
                {languages.map((lang) => (
                  <motion.div
                    key={lang.name}
                    initial={{ width: 0 }}
                    animate={{ width: `${lang.percent}%` }}
                    onMouseEnter={() => setHoveredLang(lang)}
                    onMouseLeave={() => setHoveredLang(null)}
                    style={{ backgroundColor: lang.color }}
                    className="h-full cursor-pointer transition-opacity relative group/segment"
                  >
                    <motion.div 
                      whileHover={{ scaleY: 2.2 }} 
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className="absolute inset-0 bg-inherit origin-center z-10" 
                    />
                  </motion.div>
                ))}
              </div>

              <div className="flex items-center justify-between px-1">
                <a href="https://github.com/Arxsher" target="_blank" rel="noreferrer" className="text-xs text-orange-500 font-bold hover:text-orange-400 flex items-center gap-1 transition-colors font-mono">
                  View on GitHub <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Latest Posts Card */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <span className="text-mono text-sm text-[hsl(var(--foreground))]">Latest Posts</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[hsl(var(--muted))] hover:text-[hsl(var(--muted-foreground))] cursor-pointer transition-colors" />
            </div>

            <div className="space-y-2">
              {[
                { title: "AWS Lambda InvalidEntrypoint Debugging", date: "Nov 28, 2025" },
                { title: "AWS CDK Credentials Hell", date: "Nov 26, 2025" },
                { title: "Hello World", date: "Oct 19, 2025" },
                { title: "Stop Burning CPU on Dead FastAPI Streams", date: "Jul 06, 2025" },
              ].map((post, index) => (
                <div key={index} className="flex items-center justify-between text-xs py-1 border-b border-[hsl(var(--line))] last:border-0 group cursor-pointer">
                  <span className="text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors truncate mr-4">
                    {post.title}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[hsl(var(--muted))]">-</span>
                    <span className="text-[hsl(var(--muted-foreground))]">{post.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-6 md:mt-10 flex items-center gap-2 md:gap-3"
        >
          <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-[#404040] rounded-full" />
          <div className="w-12 md:w-16 h-px bg-[#2a2a2a]" />
          <div className="w-0.5 h-0.5 md:w-1 md:h-1 bg-[#2a2a2a] rounded-full" />
        </motion.div>
      </div>
    </section>
  )
}
