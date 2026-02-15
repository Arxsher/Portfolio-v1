import { useParams, Link, NavLink } from "react-router-dom"
import { motion } from "framer-motion"
import { Calendar, Github, ExternalLink, ArrowLeft, FileText, ChevronRight, Terminal, BookOpen, Layers, Code2, Sparkles, User, Mail, ArrowUpRight } from "lucide-react"
import { projects } from "../data/projects"
import { CustomCursor } from "../components/custom-cursor"
import { Navbar } from "../components/navbar"
import { useEffect } from "react"

export function ProjectDetail() {
  const { id } = useParams()
  const project = projects.find((p) => p.id === id)

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono">
        <div className="text-center text-theme-foreground">
          <h1 className="text-2xl mb-4">Project not found.</h1>
          <Link to="/" className="text-theme-accent hover:underline flex items-center gap-2 justify-center">
            <ArrowLeft size={16} /> Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-[hsl(var(--background))]">
      <CustomCursor />
      
      {/* Top Nav (Fixed) */}
      <div className="fixed top-0 left-0 right-0 z-[60]">
        <Navbar />
      </div>

      <div className="flex flex-1 pt-20">
        {/* Sidebar - Docs Style */}
        <aside className="w-64 border-r border-[hsl(var(--line))] hidden lg:flex flex-col sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto bg-[hsl(var(--background))] px-6 py-10">
          <div className="mb-10">
            <div className="flex items-center gap-2 text-theme-muted mb-4 uppercase text-[10px] tracking-[0.2em] font-mono font-bold">
              <Layers size={12} />
              Navigation
            </div>
            <Link to="/" className="flex items-center gap-2 text-sm text-theme-muted hover:text-theme-accent transition-colors font-mono mb-2 px-3">
              <ChevronRight size={14} className="opacity-50" /> ~/home
            </Link>
            <NavLink
              to="/project/overview"
              className={({ isActive }) =>
                `flex items-center gap-2 text-sm py-2 px-4 rounded-xl transition-all font-mono ${
                  isActive 
                    ? "bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))] font-bold" 
                    : "text-theme-muted hover:text-theme-foreground hover:bg-[hsl(var(--muted))/5]"
                }`
              }
            >
              <ChevronRight size={14} className="opacity-50" /> ~/overview
            </NavLink>
          </div>

          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 text-theme-muted mb-4 uppercase text-[10px] tracking-[0.2em] font-mono font-bold">
                <Terminal size={12} />
                Projects
              </div>
              <div className="space-y-1">
                {projects.filter(p => p.category !== 'system' && p.category !== 'profile' && p.category !== 'outreach').map((p) => (
                  <NavLink
                    key={p.id}
                    to={`/project/${p.id}`}
                    className={({ isActive }) =>
                      `flex items-center justify-between text-sm py-2 px-4 rounded-xl transition-all font-mono group ${
                        isActive 
                          ? "bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))] font-bold" 
                          : "text-theme-muted hover:text-theme-foreground hover:bg-[hsl(var(--muted))/5]"
                      }`
                    }
                  >
                    <span>{p.title}</span>
                  </NavLink>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-theme-muted mb-4 uppercase text-[10px] tracking-[0.2em] font-mono font-bold">
                <BookOpen size={12} />
                Identity
              </div>
              <div className="space-y-1">
                <NavLink
                  to="/project/about"
                  className={({ isActive }) =>
                    `flex items-center gap-2 text-sm py-2 px-4 rounded-xl transition-all font-mono ${
                      isActive 
                        ? "bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))] font-bold" 
                        : "text-theme-muted hover:text-theme-foreground hover:bg-[hsl(var(--muted))/5]"
                    }`
                  }
                >
                  <User size={14} className="opacity-50" /> About
                </NavLink>
                <NavLink
                  to="/project/contact"
                  className={({ isActive }) =>
                    `flex items-center gap-2 text-sm py-2 px-4 rounded-xl transition-all font-mono ${
                      isActive 
                        ? "bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))] font-bold" 
                        : "text-theme-muted hover:text-theme-foreground hover:bg-[hsl(var(--muted))/5]"
                    }`
                  }
                >
                  <Mail size={14} className="opacity-50" /> Contact
                </NavLink>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <motion.main
          key={project.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 overflow-y-auto px-6 md:px-12 lg:px-24 py-10"
        >
          <div className="max-w-4xl">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-[11px] font-mono text-theme-muted mb-8 uppercase tracking-widest">
              <Link to="/" className="hover:text-theme-accent transition-colors">Home</Link>
              <ChevronRight size={10} className="opacity-30" />
              <span className="opacity-50">Docs</span>
              <ChevronRight size={10} className="opacity-30" />
              <span className="text-theme-accent">{project.title}</span>
            </div>

            {/* Docs Header */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-4xl md:text-5xl font-bold text-theme-foreground tracking-tight">
                  {project.title}
                </h1>
                <div className="flex items-center gap-3">
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noreferrer" className="p-2 border border-[hsl(var(--line))] rounded-md hover:border-theme-accent hover:text-theme-accent transition-all text-theme-foreground">
                      <Github size={18} />
                    </a>
                  )}
                  {project.demo && (
                    <a href={project.demo} target="_blank" rel="noreferrer" className="p-2 border border-[hsl(var(--line))] rounded-md hover:border-theme-accent hover:text-theme-accent transition-all text-theme-foreground">
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>
              </div>

              {/* Meta Stats Bar */}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 py-4 border-y border-[hsl(var(--line))] text-xs font-mono text-theme-muted">
                <div className="flex flex-col gap-1">
                  <span className="uppercase opacity-40 text-[9px] tracking-tighter">Reference</span>
                  <span className="flex items-center gap-1.5 font-bold"><Calendar size={12} /> {project.date}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="uppercase opacity-40 text-[9px] tracking-tighter">Category</span>
                  <span className="text-theme-accent uppercase font-bold">{project.category}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="uppercase opacity-40 text-[9px] tracking-tighter">Status</span>
                  <span className="text-theme-foreground font-bold uppercase tracking-widest">{project.category === 'system' ? 'STABLE' : 'VERIFIED'}</span>
                </div>
              </div>
            </div>

            {/* Content Blocks */}
            <div className="max-w-none space-y-16">
              <div className="space-y-6">
                {project.fullDescription.map((p, i) => (
                  <p key={i} className="text-lg text-[hsl(var(--muted-foreground))] leading-relaxed font-jetbrains-mono">
                    {p}
                  </p>
                ))}
              </div>

              {/* Tag Cloud */}
              <div className="flex flex-wrap gap-2 pt-4">
                {project.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="px-2.5 py-0.5 bg-[hsl(var(--muted))/5] text-theme-accent text-[10px] font-mono rounded border border-[hsl(var(--border))] uppercase font-bold"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {project.id === 'overview' ? (
                <div className="space-y-8 pt-8">
                  <h3 className="text-2xl font-bold text-theme-foreground flex items-center gap-3 tracking-tight">
                    <span className="w-1.5 h-6 bg-theme-accent rounded-full" />
                    Technical Manifest
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.filter(p => p.category !== 'system' && p.category !== 'profile' && p.category !== 'outreach').map((p) => (
                      <Link 
                        key={p.id} 
                        to={`/project/${p.id}`}
                        className="p-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl hover:border-theme-accent transition-all group shadow-sm hover:shadow-md"
                      >
                        <div className="text-theme-accent mb-2 font-mono text-[10px] uppercase font-bold opacity-50">/{p.category}</div>
                        <h4 className="text-theme-foreground font-bold text-lg group-hover:text-theme-accent transition-colors mb-1">{p.title}</h4>
                        <p className="text-theme-muted text-sm leading-snug line-clamp-2">{p.description}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (project.category === 'profile' || project.category === 'outreach') ? (
                project.category === 'outreach' ? (
                  <div className="space-y-8 pt-8">
                    <h3 className="text-2xl font-bold text-theme-foreground flex items-center gap-3 tracking-tight">
                      <Mail size={24} className="text-theme-accent" />
                      Direct Access
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.features.map((feature, i) => {
                        const getLink = () => {
                          if (feature === "Email me") return `mailto:nzakaria644@gmail.com`
                          if (feature === "WhatsApp") return `https://wa.me/212711066107`
                          if (feature === "View my work") return `https://github.com/Arxsher`
                          if (feature === "Connect on LinkedIn") return `https://linkedin.com/in/Arxsher`
                          return "#"
                        }
                        return (
                          <a 
                            key={i} 
                            href={getLink()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl font-mono text-sm hover:border-theme-accent transition-colors group flex items-center justify-between"
                          >
                            <span><span className="text-theme-accent mr-2">$</span> {feature}</span>
                            <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-theme-accent" />
                          </a>
                        )
                      })}
                    </div>
                  </div>
                ) : null
              ) : (
                <div className="space-y-12">
                  {/* Key Features - List Style */}
                  <div className="space-y-8">
                    <h3 className="text-3xl font-bold text-theme-accent tracking-tight flex items-center gap-3">
                      <Sparkles size={28} />
                      Key Features
                    </h3>
                    <div className="space-y-6 font-jetbrains-mono">
                      {project.features.map((feature, i) => {
                        const [title, ...desc] = feature.split(':');
                        return (
                          <div key={i} className="flex items-start gap-4">
                            <span className="mt-2 w-1.5 h-1.5 bg-theme-muted rounded-full shrink-0 opacity-40" />
                            <p className="text-lg leading-relaxed">
                              {title && desc.length > 0 ? (
                                <>
                                  <span className="text-theme-foreground font-bold">{title}:</span>
                                  <span className="text-[hsl(var(--muted-foreground))] ml-2">{desc.join(':').trim()}</span>
                                </>
                              ) : (
                                <span className="text-[hsl(var(--muted-foreground))]">{feature}</span>
                              )}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Architecture Block - Non-Terminal Style */}
                  {project.technicalDetails && (
                    <div className="space-y-8 pt-8 border-t border-[hsl(var(--line))]">
                      <h3 className="text-3xl font-bold text-theme-accent tracking-tight flex items-center gap-3">
                        <Code2 size={28} />
                        Architecture
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {project.technicalDetails.map((detail, i) => (
                          <div key={i} className="p-5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl font-mono text-sm text-theme-foreground">
                            <span className="text-theme-accent mr-2">$</span> {detail}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Nav */}
            <div className="mt-32 pt-12 border-t border-[hsl(var(--line))] flex justify-between items-center">
              <Link to="/" className="inline-flex items-center gap-3 text-theme-muted hover:text-theme-accent transition-all font-mono uppercase text-[10px] tracking-[0.2em] group">
                <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> 
                ~/root
              </Link>
              <div className="text-theme-muted opacity-20 font-mono text-[10px] uppercase">
                Terminal Document v2.0
              </div>
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  )
}
