"use client"

import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"

const projects = [
  {
    id: "spotify-wrapped",
    title: "Spotify Wrapped",
    description: "Full-stack listener data analyzer",
    tag: "fullstack",
  },
  {
    id: "skillsy",
    title: "Skillsy",
    description: "Skill discovery and growth platform",
    tag: "platform",
  },
  {
    id: "comet-chat",
    title: "Comet Chat",
    description: "Real-time communication platform",
    tag: "realtime",
  },
  {
    id: "archexcellence",
    title: "ArchExcellence",
    description: "Architectural management platform",
    tag: "freelance",
  },
  {
    id: "hologesture",
    title: "HoloGesture",
    description: "Advanced hand-tracking interface",
    tag: "private",
  },
  {
    id: "edenmorph",
    title: "EdenMorph",
    description: "Creative space for animations",
    tag: "creative",
  },
]

export function WorkSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
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
    <section id="work" className="py-8 md:py-12 relative">
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
              <span className="text-mono text-[hsl(var(--muted-foreground))]">experiments</span>
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
          className="relative"
        >
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-[hsl(var(--muted))] via-[hsl(var(--line))] to-transparent hidden md:block" />

          <div className="md:pl-6">
            {projects.map((project) => (
              <motion.div key={project.id} variants={itemVariants}>
                <div className="group relative py-3 md:py-4 border-b border-[hsl(var(--line))] hover:border-[hsl(var(--line-accent))] transition-all duration-300">
                  {/* Hover indicator line */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 group-hover:w-3 h-px bg-[hsl(var(--muted))] transition-all duration-300 hidden md:block" />

                  <Link
                    to={`/project/${project.id}`}
                    className="flex flex-col md:flex-row md:items-center md:justify-between md:pl-4"
                  >
                    <div className="flex items-start gap-2 md:items-center md:gap-4">
                      <span className="text-large font-normal text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--accent))] transition-colors duration-300">
                        {project.title}
                      </span>
                      {project.tag && (
                        <span className="text-mono text-[hsl(var(--muted))] text-xs md:text-sm flex-shrink-0">
                          [{project.tag}]
                        </span>
                      )}
                      <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-[hsl(var(--muted))] group-hover:text-[hsl(var(--foreground))] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 flex-shrink-0" />
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 md:mt-0">
                      <span className="text-base text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors duration-300">
                        {project.description}
                      </span>
                    </div>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
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
