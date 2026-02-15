export interface Project {
  id: string;
  title: string;
  description: string;
  fullDescription: string[];
  date: string;
  github?: string;
  demo?: string;
  tags: string[];
  features: string[];
  category: string;
  technicalDetails?: string[];
}

export const projects: Project[] = [
  {
    id: "overview",
    title: "A collection hub",
    description: "Curated workspace of projects, builds, and logs",
    fullDescription: [
      "This is a collection hub—a curated space where I document my builds, research, and technical experiments. This isn't just a list of links; it's a living repository of the 'how' and 'why' behind my work.",
      "Everything here is driven by a focus on autonomy and performance. Whether it's a full-stack platform or a weekend AI experiment, this hub acts as the central node for my technical existence.",
      "Browse the project logs below to dive into the specific architecture and implementation details of each build."
    ],
    date: "2026 Edition",
    tags: ["curated", "repository", "build-logs", "workspace"],
    features: [],
    category: "system"
  },
  {
    id: "about",
    title: "The Architect",
    description: "Background and technical philosophy",
    fullDescription: [
      "I'm Zakaria, a Full-Stack Developer and designer focused on building high-stiffness digital tools. My approach is rooted in the 'Resident Tinkerer' philosophy—autonomous, iterative, and technically rigorous.",
      "I exist in the space between high-level orchestration and low-level system tweaking. I've spent significant time in the trenches of Arch Linux, managing Hackintosh kernels, and refining BIOS configurations to push hardware to its absolute limit. I don't just use systems; I own them.",
      "Based in Morocco and studying at OFPPT, I bridge the gap between raw backend logic and refined frontend experiences. I believe that software should feel physically grounded and performant, with zero room for unnecessary jank or technical debt.",
      "This portfolio is my technical manifest. Beyond full-stack builds, I'm deep into AI agent orchestration, reverse engineering complex workflows, and proving that a solo dev with a lean setup can out-build a legacy team."
    ],
    date: "Profile 2026",
    tags: ["bio", "intj", "fullstack", "morocco"],
    features: [
      "System Architecture & Design",
      "AI Agent Orchestration",
      "React / Node / PHP Stack",
      "UI/UX Industrial Design"
    ],
    category: "profile"
  },
  {
    id: "contact",
    title: "Reach the System",
    description: "Direct channels for collaboration",
    fullDescription: [
      "If you're looking to collaborate on a high-density build or want to discuss technical orchestration, reach out through the primary channels below.",
      "Always down to work on interesting problems, build weird stuff, and ship real projects. Hit me up if you've got something cooking.",
      "Fast responses. Let's talk tech."
    ],
    date: "Active 24/7",
    tags: ["collaboration", "internship", "outreach", "direct"],
    features: [
      "Email me",
      "WhatsApp",
      "View my work",
      "Connect on LinkedIn"
    ],
    category: "outreach"
  },
  {
    id: "spotify-wrapped",
    title: "Spotify Analytics",
    description: "Full-stack listener data analyzer",
    fullDescription: [
      "Spotify Analytics is a technical deep-dive into the listener's musical identity. It moves beyond standard wrappers by providing a real-time, persistent dashboard that tracks evolution in musical taste.",
      "The core challenge was orchestrating the high-frequency data streams from the Spotify Web API without hitting rate limits. I implemented a custom caching layer and context-based state management to ensure that once data is fetched, the UI remains snappy and responsive.",
      "I built this during a focused push to explore 'Agentic Workflows.' Vesper, my autonomous partner, assisted in optimizing the data engine while I architected the 'Industrial Dark' design language that defines the app's soul.",
      "The result is a high-stiffness analytical tool that bridges the gap between raw API data and meaningful user insight."
    ],
    date: "December 2025",
    github: "https://github.com/Arxsher/spotify-wrapped",
    demo: "https://arxsher.github.io/spotify-wrapped/",
    tags: ["react-19", "vite", "spotify-api", "context-api", "framer-motion"],
    features: [
      "User Profile Dashboard: View your Spotify profile information with a personalized welcome greeting.",
      "Listening Statistics: Track your streams, minutes listened, unique artists, and new discoveries.",
      "Top Artists & Tracks: Explore your most-played music with visual grid layouts.",
      "Dynamic Genre Breakdown: Visualize your music preferences with a real-time genre distribution engine.",
      "Monthly Listening Trends: Interactive charts showing how your habits change over time.",
      "Recently Played: Browse your listening history with full history support.",
      "Agentic Integration: Built in collaboration with Vesper, an autonomous AI agent."
    ],
    technicalDetails: [
      "Frontend: React 19 + Vite for sub-millisecond HMR",
      "State: Advanced Context API for cross-component data sync",
      "Animations: GSAP + Framer Motion for physical UI response",
      "Styling: Pure CSS Variables for radical theme switching",
      "API: RESTful Spotify Web API integration with OAuth2 flow"
    ],
    category: "fullstack"
  },
  {
    id: "skillsy",
    title: "Skillsy",
    description: "Developer community & roadmap platform",
    fullDescription: [
      "Skillsy was born from the need for a localized, developer-centric community space. It's a full-stack ecosystem designed to bridge the gap between learning and collaboration, focused on the specific needs of the tech scene in Morocco.",
      "The architecture follows a strict MVC (Model-View-Controller) pattern using native PHP. This was a deliberate choice to master the fundamentals of web routing and state persistence without the abstraction of modern frameworks. I built the authentication system from the ground up, including secure password hashing and session management.",
      "To ensure maximum accessibility, I deployed Skillsy as both a responsive web platform and a native Android application. This required managing cross-platform UI consistency and ensuring the backend could handle diverse client requests over SSL.",
      "The project serves as a technical foundation for my future work in large-scale social systems."
    ],
    date: "October 2025",
    github: "https://github.com/Arxsher/Skillsy",
    demo: "https://skillsy.wuaze.com",
    tags: ["php", "mysql", "tailwind-css", "android-apk", "mvc"],
    features: [
      "Custom User Authentication & Persistent Sessions",
      "Native MVC Architecture for modular scaling",
      "Tailwind-powered responsive Community Dashboard",
      "Android APK integration for mobile-first access",
      "SSL-Encrypted data transmission and hosting",
      "Error-resilient forms and user feedback systems"
    ],
    technicalDetails: [
      "Backend: PHP 7.4+ with native MVC implementation",
      "Database: MySQL with optimized indexing for user lookup",
      "Styling: Tailwind CSS for high-stiffness industrial UI",
      "Mobile: Native Android wrapper with WebView bridging",
      "Environment: XAMPP local dev to high-availability web hosting"
    ],
    category: "platform"
  },
  {
    id: "archexcellence",
    title: "ArchExcellence",
    description: "Architectural management platform",
    fullDescription: [
      "ArchExcellence is a high-end freelance project built for an architectural firm in Casablanca. The goal was to transform a traditional portfolio into an interactive management hub for premium villa and renovation projects.",
      "The system handles the entire project lifecycle—from the initial client submission through to detailed request routing. I architected the platform using Laravel to leverage its robust routing and security features, ensuring that sensitive blueprints and client data remain protected.",
      "A key focus was the 'Premium Aesthetic.' The UI was designed to reflect the quality of the architecture itself, using clean lines, generous white space, and optimized high-resolution asset delivery to create a feeling of technical luxury.",
      "This project highlights my ability to take a client's business vision and translate it into a performant, industrial-grade digital tool."
    ],
    date: "January 2026",
    demo: "https://ab-anassbenlechgar.com",
    tags: ["php", "laravel", "mysql", "architecture", "freelance"],
    features: [
      "Automated Multi-step Project Submission Flow",
      "Dynamic Request Routing for Villas and Renovations",
      "Optimized Asset Management for architectural renders",
      "Custom SEO engine with OpenGraph and Twitter meta sync",
      "High-availability MySQL project and lead database",
      "Responsive admin-facing dashboard for project tracking"
    ],
    technicalDetails: [
      "Engine: PHP/Laravel 10+ for secure request handling",
      "Storage: MySQL with high-integrity lead relational mapping",
      "SEO: Specialized meta-engine for social sharing preview",
      "Frontend: Blade + Tailwind for surgical UI precision",
      "Performance: Optimized Vite build for rapid site loading"
    ],
    category: "freelance"
  },
  {
    id: "comet-chat",
    title: "Comet",
    description: "Next-gen real-time chat platform",
    fullDescription: [
      "Comet is a conceptual real-time chat platform inspired by Talkomatic — rebuilt for the web age.",
      "The vision: eliminate the gap between thought and expression. No send button. No waiting. Every keystroke appears instantly.",
      "This frontend exploration focused on crafting a sleek, immersive experience that feels as fast as thinking."
    ],
    date: "August 2025",
    github: "https://github.com/Arxsher/comet",
    tags: ["real-time", "chat", "ux-research", "frontend", "concept"],
    features: [
      "Instant keystroke broadcast architecture",
      "Room-based conversation model",
      "Sleek animated landing experience",
      "Responsive mobile-first design"
    ],
    technicalDetails: [
      "$ Concept: Vanilla frontend showcase",
      "$ Stack: HTML, CSS, JavaScript",
      "$ Focus: UI/UX research for instant messaging",
      "$ Next: WebSocket backend implementation"
    ],
    category: "realtime"
  },
  {
    id: "hologesture",
    title: "HoloGesture",
    description: "Advanced hand-tracking interface",
    fullDescription: [
      "HoloGesture is an experimental research project focusing on high-precision hand-tracking and gesture recognition for web interfaces.",
      "The goal was to move beyond traditional mouse and touch interaction, using computer vision to translate physical hand movements into digital commands in real-time.",
      "This project pushed my understanding of spatial UI/UX and the performance constraints of running ML models directly in the browser environment."
    ],
    date: "July 2025",
    tags: ["computer-vision", "ml", "gestures", "interface", "experimental"],
    features: [
      "Real-time Hand Tracking & Keypoint Detection",
      "Gesture-to-Command Mapping Engine",
      "Zero-latency UI Response Pipeline",
      "Experimental Spatial Interaction Model"
    ],
    technicalDetails: [
      "Model: MediaPipe / TensorFlow.js orchestration",
      "Frontend: React for fluid interface updates",
      "Compute: Hardware-accelerated browser-side ML",
      "Status: Private technical research build"
    ],
    category: "experimental"
  },
  {
    id: "edenmorph",
    title: "EdenMorph",
    description: "Canvas-based organic animation experiment",
    fullDescription: [
      "EdenMorph is a creative coding exploration that brings mathematical beauty to life through interactive canvas animations.",
      "Using parametric equations to render a beating heart that responds to user interaction, this project bridges the gap between cold math and organic motion.",
      "Every particle follows a mathematically defined path while responding to touch and mouse input in real-time — creating a dialogue between the user and the machine."
    ],
    date: "September 2025",
    github: "https://github.com/Arxsher/edenmorph",
    tags: ["creative-coding", "canvas", "math", "animations", "interactive"],
    features: [
      "Parametric heart curve rendering",
      "Real-time mouse/touch particle interaction",
      "Responsive canvas scaling",
      "Smooth 60fps animation pipeline"
    ],
    technicalDetails: [
      "$ Render: HTML5 Canvas 2D API",
      "$ Math: Parametric polar equations",
      "$ Input: Touch & mouse event handling",
      "$ Perf: requestAnimationFrame optimization"
    ],
    category: "creative"
  }
];