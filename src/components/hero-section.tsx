import { motion } from "framer-motion"

const focusAreas = ["AI Agent Orchestration", "React", "TypeScript", "Figma", "System Design"]

export const HeroSection = () => {
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
    hidden: { opacity: 0, y: 8 },
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
    <section id="hero" className="min-h-[85vh] flex items-center pt-24 md:pt-32 relative hero-container">
      <div className="px-4 md:px-8 w-full hero-grid">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:gap-16 hero-main-wrapper">
          {/* Left column - Main content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative flex-1 max-w-2xl hero-content-left"
          >
            {/* Portfolio label */}
            <motion.div variants={itemVariants} className="mb-6 md:mb-8 dark-portfolio-label">
              <span className="text-mono text-theme-muted tracking-wide uppercase">PORTFOLIO / 2026</span>
            </motion.div>

            {/* Name Container */}
            <motion.div variants={itemVariants} className="mb-8 md:mb-10 hero-title-box">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-theme-foreground leading-[1.1] tracking-tight hero-name">
                <span className="light-greeting hidden">Hey! I'm</span>
                <span className="name-primary">Zakaria</span>
                <span className="name-secondary block text-theme-muted">@Arxsher</span>
              </h1>
            </motion.div>

            {/* Description Container */}
            <motion.div variants={itemVariants} className="mb-8 md:mb-10 hero-bio-container">
              <p className="text-lg md:text-xl text-theme-muted leading-relaxed max-w-lg">
                Designer, Developer and builder crafting digital experiences at the intersection of{" "}
                <span className="text-theme-accent">design</span>,{" "}
                <span className="text-theme-accent">technology</span>, and{" "}
                <span className="text-theme-accent">user experience</span>.
              </p>
            </motion.div>

            {/* Availability & Location */}
            <motion.div variants={itemVariants} className="flex items-center gap-4 text-base hero-availability">
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-4 h-4 rounded-full animate-availability-ping" />
                  <div className="absolute w-3 h-3 rounded-full blur-sm animate-availability-glow" />
                  <div className="relative w-2 h-2 rounded-full animate-availability-dot" />
                </div>
                <span className="text-theme-muted">Available for work</span>
              </div>
              <span className="opacity-40 text-theme-muted">Casa, Morocco</span>
            </motion.div>
          </motion.div>

          {/* Right column - Currently & Focus */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
            className="mt-12 lg:mt-24 lg:w-72 hero-content-right"
          >
            {/* Currently */}
            <div className="mb-8 currently-card">
              <span className="text-mono text-theme-muted text-sm tracking-wide block mb-3 uppercase">Currently</span>
              <div className="space-y-1">
                <p className="text-theme-foreground text-base font-normal">FullStack Developer</p>
                <p className="text-theme-muted text-base">
                  @{" "}
                  <a
                    href="https://github.com/Arxsher"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-theme-foreground transition-colors duration-300"
                  >
                    Freelance
                  </a>
                </p>
                <p className="opacity-40 text-theme-muted text-sm">2021 — Present</p>
              </div>
            </div>

            {/* Focus */}
            <div className="focus-card">
              <span className="text-mono text-theme-muted text-sm tracking-wide block mb-3 uppercase">Focus</span>
              <div className="flex flex-wrap gap-2">
                {focusAreas.map((area) => (
                  <span
                    key={area}
                    className="px-3 py-1.5 text-sm text-theme-muted border border-[hsl(var(--border))] rounded-full hover:border-theme-muted hover:text-theme-foreground transition-colors duration-300"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Decorative element */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 md:mt-16 flex items-center gap-2 md:gap-3 hero-footer-line"
        >
          <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-[hsl(var(--line))] rounded-full" />
          <div className="w-12 md:w-16 h-px bg-[hsl(var(--line-accent))]" />
          <div className="w-0.5 h-0.5 md:w-1 md:h-1 bg-[hsl(var(--line-accent))] rounded-full" />
        </motion.div>
      </div>
    </section>
  )
}
