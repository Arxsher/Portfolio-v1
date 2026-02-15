# AGENTS.md - Portfolio Codebase Guidelines

This document provides essential information for AI coding agents operating in this repository.

## Project Overview

A personal portfolio website built with Vite, React 18, TypeScript, and Tailwind CSS v4. Uses shadcn/ui components (new-york style) and Framer Motion for animations.

## Build & Development Commands

```bash
# Install dependencies (uses bun)
bun install

# Development server (runs on http://localhost:5173)
bun dev

# Type check and build for production
bun run build

# Preview production build
bun run preview
```

### No Test Suite

This project does not currently have a test suite configured. There are no test commands available.

## Project Structure

```
src/                    # Main source directory (Vite entry point)
  components/           # Feature components (navbar, hero-section, etc.)
  main.tsx              # Application entry point
  App.tsx               # Root component
  index.css             # Global styles with Tailwind v4

components/             # Shared/reusable components
  ui/                   # shadcn/ui components

hooks/                  # Custom React hooks
lib/                    # Utility functions (cn helper)
public/                 # Static assets
```

## Code Style Guidelines

### File Naming

- **Components**: `kebab-case.tsx` (e.g., `hero-section.tsx`, `mobile-menu.tsx`)
- **Hooks**: `use-*.ts` or `use-*.tsx` (e.g., `use-toast.ts`, `use-mobile.tsx`)
- **Utilities**: `kebab-case.ts` (e.g., `utils.ts`)

### Component Patterns

```tsx
// Client components require directive
"use client"

// Import order: React -> external libs -> internal (@ paths)
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Arrow function exports for section components
export const HeroSection = () => {
  return <section>...</section>
}

// Named function exports for complex components
export function Navbar() {
  return <nav>...</nav>
}
```

### TypeScript

- **Strict mode enabled** - no implicit any
- Use explicit types for props and state
- Prefer `interface` for component props
- Use `type` for unions and complex types
- Import types with `type` keyword: `import { type ClassValue } from "clsx"`

```tsx
// Props interface pattern
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

// Type for complex structures
type Project = {
  id: number
  title: string
  description: string
  link: string
  tag?: string
  credit?: { name: string; url: string }
}
```

### Styling

- **Tailwind CSS v4** with CSS-first configuration
- Use `cn()` utility for conditional class merging
- CSS custom properties defined in `src/index.css` under `:root`
- Custom components defined in `@layer components`
- Color palette uses hex values: `#fafafa`, `#a1a1a1`, `#737373`, `#404040`, `#2a2a2a`, `#222`, `#1a1a1a`

```tsx
// Class merging with cn()
className={cn(
  "base-classes",
  condition && "conditional-classes",
  className
)}
```

### shadcn/ui Components

- Located in `components/ui/`
- Use `React.forwardRef` pattern
- Include `displayName` for debugging
- Use `cva` (class-variance-authority) for variants
- Add `data-slot` attributes for styling hooks

```tsx
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"
```

### Animation Patterns

Use Framer Motion with consistent easing:

```tsx
// Standard easing curve used throughout
const easing = [0.25, 0.1, 0.25, 1.0]

// Container with staggered children
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

// Child item animation
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] },
  },
}
```

### React Hooks

- Always include cleanup in useEffect
- Use `{ passive: true }` for scroll listeners
- Prefer custom hooks for reusable logic

```tsx
useEffect(() => {
  const handleScroll = () => setScrolled(window.scrollY > 50)
  window.addEventListener("scroll", handleScroll, { passive: true })
  return () => window.removeEventListener("scroll", handleScroll)
}, [])
```

### Context Pattern

```tsx
const ScrollContext = createContext<ScrollContextType | null>(null)

export function useScrollContext() {
  const context = useContext(ScrollContext)
  if (!context) {
    throw new Error("useScrollContext must be used within a ScrollProvider")
  }
  return context
}
```

### JSX Conventions

- Use double quotes for JSX attributes
- Use fragments `<>...</>` instead of unnecessary divs
- External links require `target="_blank"` and `rel="noopener noreferrer"`
- Add `aria-label` to icon-only buttons

### Path Aliases

Configured in `tsconfig.json`:

```json
{
  "paths": {
    "@/*": ["src/*"]
  }
}
```

Use `@/` prefix for imports from src directory.

## Dependencies Reference

| Package | Purpose |
|---------|---------|
| `framer-motion` | Animations and transitions |
| `lucide-react` | Icon library |
| `class-variance-authority` | Component variants |
| `clsx` + `tailwind-merge` | Class name utilities |
| `@radix-ui/*` | Headless UI primitives |

## Important Notes

- No ESLint or Prettier configured - maintain consistent style manually
- TypeScript strict mode is enabled
- Vite dev server runs on port 5173
