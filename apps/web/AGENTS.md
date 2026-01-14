# Web AGENTS.md

> **@veto/web** — Landing page at [veto.run](https://veto.run). React + Tailwind + Vite.

## Quick Start

```bash
pnpm dev        # http://localhost:5173
pnpm build      # Production build → dist/
pnpm preview    # Preview production build
```

## Architecture

```
apps/web/
├── src/
│   ├── App.tsx              # Main layout - assembles all sections
│   ├── main.tsx             # React entry + dark mode init
│   ├── index.css            # Design system (CSS variables, animations)
│   ├── sections/            # Page sections (Hero, TheGap, etc.)
│   ├── components/          # Reusable components (Nav, etc.)
│   │   └── ui/              # shadcn/ui primitives (unused, available)
│   ├── hooks/               # Custom hooks (unused, available)
│   └── lib/                 # Utilities
├── public/
│   ├── veto-darkmode.png       # Logo (full)
│   ├── veto-darkmode-icon.png  # Logo (icon only)
│   └── terminal-screenshot.png # Hero terminal image
├── tailwind.config.js       # Tailwind + custom colors
└── vite.config.ts           # Vite config with @ alias
```

## Page Structure (App.tsx)

```
Nav           Fixed top nav (logo, Docs link, GitHub button)
Hero          Logo + tagline + install command + CTAs + terminal screenshot
TheGap        Problem statement - what agents are doing today
ThePattern    The pattern - why authorization matters
TheSolution   How Veto solves it
CodeExample   Python code showing Veto integration
Footer        CTAs + social links + company info
```

## Design System

### Colors (index.css)

Dark theme by default. All colors as CSS variables using HSL:

| Token                | Usage                  | Hex     |
| -------------------- | ---------------------- | ------- |
| `--background`       | Page background        | #0a0a0a |
| `--foreground`       | Primary text           | #fafafa |
| `--primary`          | Brand orange           | #f97316 |
| `--muted-foreground` | Secondary text         | #7F8A9A |
| `--surface`          | Card/input backgrounds | #1a1a1a |
| `--surface-elevated` | Elevated surfaces      | #262626 |
| `--border-subtle`    | Subtle borders         | #333333 |
| `--text-secondary`   | Light text             | #e5e5e5 |
| `--text-tertiary`    | Muted text             | #737373 |

### Tailwind Classes

```tsx
// Use semantic colors
<div className="bg-surface text-text-secondary border-border-subtle">

// Use theme colors
<p className="text-muted-foreground">  // Secondary text
<p className="text-foreground">        // Primary text
```

### Buttons

Two button styles defined in index.css:

```tsx
// Primary (orange, clacky 3D effect)
<a className="btn-primary ...">Get Started</a>

// Secondary (dark, clacky 3D effect)
<a className="btn-secondary ...">GitHub</a>
```

### Animations

Staggered fade-in animations:

```tsx
<div className="animate-in delay-1">First</div>
<div className="animate-in delay-2">Second</div>
<div className="animate-in delay-3">Third</div>
// delay-1 through delay-6 available (0ms to 400ms)
```

### Typography

- **Font**: Satoshi (sans-serif)
- **Mono**: SF Mono / Fira Code
- **Headings**: -0.02em letter-spacing, font-weight 500

## Key Files

### Hero.tsx

Main hero section with:

- Logo image
- Two-line tagline ("Agents are software." / "Software needs authorization.")
- `pip install veto` command block
- Get Started + GitHub CTAs
- Terminal screenshot (`/terminal-screenshot.png`)

### Nav.tsx

Fixed navigation with:

- Logo icon (left)
- Docs link + GitHub button (right)
- Mobile menu toggle

### CodeExample.tsx

Python code block showing Veto integration with browser_use:

- macOS window chrome (traffic lights)
- Syntax highlighting (keywords, strings, functions, params)

### Footer.tsx

- Main CTA section
- Company info (Plaw Inc., VulnZap)
- Social links (Twitter, GitHub, Discord)

## Unused Components (Available)

These exist but aren't in App.tsx:

- `sections/Problem.tsx`, `Features.tsx`, `HowItWorks.tsx`, `Integrations.tsx`, `Primitives.tsx`, `Roadmap.tsx`
- `components/ui/*` - shadcn/ui components
- `hooks/*` - useTheme, useScrollPosition, useReducedMotion, useInView

## Adding a New Section

1. Create `src/sections/NewSection.tsx`:

```tsx
export function NewSection() {
  return (
    <section className="py-24 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground mb-6">
          Section Title
        </h2>
        <p className="text-muted-foreground">Content here</p>
      </div>
    </section>
  );
}
```

2. Add to `App.tsx`:

```tsx
import { NewSection } from "@/sections/NewSection";
// ...
<NewSection />;
```

## Common Patterns

### Responsive Text

```tsx
<p className="text-xl sm:text-2xl md:text-3xl">Responsive heading</p>
```

### Section Container

```tsx
<section className="py-24 px-6 border-t border-border">
  <div className="max-w-3xl mx-auto">{/* Content */}</div>
</section>
```

### Code Block with Window Chrome

```tsx
<div className="bg-background rounded border border-surface-elevated overflow-hidden">
  <div className="flex items-center px-4 py-2.5 border-b border-surface-elevated">
    <div className="flex gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
      <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
      <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
    </div>
    <span className="ml-3 text-[11px] text-text-tertiary font-mono">
      filename.py
    </span>
  </div>
  <pre className="p-4 text-[13px] font-mono">{code}</pre>
</div>
```

## Deployment

- Build output: `dist/`
- Deploy to: Vercel (auto-deploy on push to master)
- Excluded from Changesets (manual versioning)

## Links

- **Live**: https://veto.run
- **Repo**: https://github.com/VulnZap/veto/tree/master/apps/web
