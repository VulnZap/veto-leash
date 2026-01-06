# Web AGENTS.md

> **@veto/web** is the landing page at veto.run. React + Tailwind + Vite.

## Commands

```bash
pnpm dev                # Start dev server (http://localhost:5173)
pnpm build              # Build for production
pnpm preview            # Preview production build
```

## Structure

```
apps/web/
├── src/
│   ├── App.tsx         # Main component - THE LANDING PAGE
│   ├── main.tsx        # React entry point
│   └── index.css       # Tailwind imports + custom styles
├── index.html          # HTML template
├── tailwind.config.js  # Tailwind configuration
├── vite.config.ts      # Vite configuration
└── public/
    └── favicon.svg     # Veto logo
```

## Tech Stack

- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **TypeScript** - Type safety

## Key File: App.tsx

Single-page landing with sections:

1. Hero - "The permission layer for AI agents"
2. Problem - What can go wrong
3. Solution - How Veto helps
4. Products - SDK vs CLI
5. Code examples
6. CTA - Install commands

## Styling

```tsx
<div className="max-w-4xl mx-auto px-4 py-16">
  <h1 className="text-5xl font-bold text-white">Veto</h1>
</div>
```

- Dark theme by default
- Orange accent: #f5a524 (Veto brand color)
- Mobile-responsive: use `sm:`, `md:`, `lg:` prefixes

## Deployment

Built output goes to `dist/`. Deploy to Vercel, Netlify, or Cloudflare Pages.

## Note

This package is excluded from Changesets (`@veto/web` in ignore list). Deploy manually or via Vercel auto-deploy.
